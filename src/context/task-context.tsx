import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { createTaskRecord, loadTasks, saveTasks } from '../storage/task-storage'
import type { NewTask, Task } from '../types/task'

type TaskContextValue = {
  tasks: Task[]
  loading: boolean
  storageError: string | null
  addTask: (input: NewTask) => Promise<Task>
  updateTask: (id: string, changes: Partial<Omit<Task, 'id'>>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
}

const TaskContext = createContext<TaskContextValue | null>(null)

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'An unexpected storage error occurred.'
}

export function TaskProvider({ children }: PropsWithChildren) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [storageError, setStorageError] = useState<string | null>(null)
  const tasksRef = useRef<Task[]>([])
  const loadedRef = useRef(false)
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    let active = true

    loadTasks()
      .then((savedTasks) => {
        if (active) {
          tasksRef.current = savedTasks
          setTasks(savedTasks)
          loadedRef.current = true
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setStorageError(errorMessage(error))
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const enqueueMutation = useCallback(<T,>(mutation: () => Promise<T>) => {
    if (!loadedRef.current) {
      return Promise.reject(
        new Error('Tasks are still loading or could not be loaded.'),
      )
    }

    const result = mutationQueueRef.current.then(mutation)
    mutationQueueRef.current = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }, [])

  const persistTasks = useCallback(async (updatedTasks: Task[]) => {
    await saveTasks(updatedTasks)
    tasksRef.current = updatedTasks
    setTasks(updatedTasks)
    setStorageError(null)
  }, [])

  const addTask = useCallback(
    async (input: NewTask) => {
      const task = createTaskRecord(input)
      try {
        await enqueueMutation(async () => {
          if (tasksRef.current.some((savedTask) => savedTask.id === task.id)) {
            throw new Error(`A task with ID "${task.id}" already exists.`)
          }
          await persistTasks([...tasksRef.current, task])
        })
        return task
      } catch (error) {
        setStorageError(errorMessage(error))
        throw error
      }
    },
    [enqueueMutation, persistTasks],
  )

  const updateTask = useCallback(
    async (id: string, changes: Partial<Omit<Task, 'id'>>) => {
      try {
        await enqueueMutation(async () => {
          const taskExists = tasksRef.current.some((task) => task.id === id)
          if (!taskExists) {
            throw new Error(`Task "${id}" was not found.`)
          }

          await persistTasks(
            tasksRef.current.map((task) =>
              task.id === id ? { ...task, ...changes } : task,
            ),
          )
        })
      } catch (error) {
        setStorageError(errorMessage(error))
        throw error
      }
    },
    [enqueueMutation, persistTasks],
  )

  const deleteTask = useCallback(
    async (id: string) => {
      try {
        await enqueueMutation(async () => {
          await persistTasks(
            tasksRef.current.filter((task) => task.id !== id),
          )
        })
      } catch (error) {
        setStorageError(errorMessage(error))
        throw error
      }
    },
    [enqueueMutation, persistTasks],
  )

  return (
    <TaskContext.Provider
      value={{ tasks, loading, storageError, addTask, updateTask, deleteTask }}
    >
      {children}
    </TaskContext.Provider>
  )
}

export function useTasks(): TaskContextValue {
  const context = useContext(TaskContext)
  if (context === null) {
    throw new Error('useTasks must be used within a TaskProvider.')
  }
  return context
}
