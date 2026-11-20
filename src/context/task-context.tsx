import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { supabase } from '../api/supabase'
import { createTaskRecord, loadTasks, saveTasks } from '../storage/task-storage'
import type { NewTask, Task, TaskPriority } from '../types/task'
import { useAuth } from './auth-context'

type TaskContextValue = {
  tasks: Task[]
  loading: boolean
  storageError: string | null
  addTask: (input: NewTask) => Promise<Task>
  updateTask: (id: string, changes: Partial<Omit<Task, 'id'>>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  refreshTasks: () => Promise<void>
}

const TaskContext = createContext<TaskContextValue | null>(null)

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'An unexpected storage error occurred.'
}

interface SupabaseTaskRow {
  id: string
  user_id: string
  title: string
  description: string
  category: Task['category']
  priority?: TaskPriority
  status: Task['status']
  start_at: string
  end_at: string
  created_at: string
  updated_at: string
}

function mapRowToTask(row: SupabaseTaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority || 'medium',
    status: row.status,
    startAt: row.start_at,
    endAt: row.end_at,
  }
}

export function TaskProvider({ children }: PropsWithChildren) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [storageError, setStorageError] = useState<string | null>(null)
  const tasksRef = useRef<Task[]>([])
  const loadedRef = useRef(false)
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve())

  const persistTasks = useCallback(async (updatedTasks: Task[]) => {
    await saveTasks(updatedTasks)
    tasksRef.current = updatedTasks
    setTasks(updatedTasks)
    setStorageError(null)
  }, [])

  const refreshTasks = useCallback(async () => {
    try {
      const local = await loadTasks()
      tasksRef.current = local
      setTasks(local)

      if (user) {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('start_at', { ascending: true })

        if (error) {
          console.warn('[TaskSync] Supabase fetch error:', error.message)
        } else if (data) {
          const remoteTasks = (data as SupabaseTaskRow[]).map(mapRowToTask)
          tasksRef.current = remoteTasks
          setTasks(remoteTasks)
          await saveTasks(remoteTasks)
        }
      }
    } catch (error) {
      setStorageError(errorMessage(error))
    }
  }, [user])

  useEffect(() => {
    let active = true

    loadTasks()
      .then(async (local) => {
        if (!active) return
        tasksRef.current = local
        setTasks(local)
        loadedRef.current = true

        if (user) {
          const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .order('start_at', { ascending: true })

          if (error) {
            console.warn('[TaskSync] Supabase fetch error:', error.message)
          } else if (data && active) {
            const remoteTasks = (data as SupabaseTaskRow[]).map(mapRowToTask)
            tasksRef.current = remoteTasks
            setTasks(remoteTasks)
            await saveTasks(remoteTasks)
          }
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
  }, [user])

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

  const addTask = useCallback(
    async (input: NewTask) => {
      try {
        let task: Task

        if (user) {
          // Cloud save with Supabase
          const { data, error } = await supabase
            .from('tasks')
            .insert({
              user_id: user.id,
              title: input.title,
              description: input.description,
              category: input.category,
              priority: input.priority || 'medium',
              start_at: input.startAt,
              end_at: input.endAt,
              status: 'pending',
            })
            .select()
            .single()

          if (error || !data) {
            throw new Error(error?.message || 'Не удалось сохранить задачу в облаке.')
          }

          task = mapRowToTask(data as SupabaseTaskRow)
        } else {
          // Local offline task
          task = createTaskRecord(input)
        }

        await enqueueMutation(async () => {
          await persistTasks([...tasksRef.current, task])
        })

        return task
      } catch (error) {
        setStorageError(errorMessage(error))
        throw error
      }
    },
    [user, enqueueMutation, persistTasks],
  )

  const updateTask = useCallback(
    async (id: string, changes: Partial<Omit<Task, 'id'>>) => {
      try {
        if (user) {
          const updatePayload: Record<string, unknown> = {}
          if (changes.title !== undefined) updatePayload.title = changes.title
          if (changes.description !== undefined) updatePayload.description = changes.description
          if (changes.category !== undefined) updatePayload.category = changes.category
          if (changes.priority !== undefined) updatePayload.priority = changes.priority
          if (changes.status !== undefined) updatePayload.status = changes.status
          if (changes.startAt !== undefined) updatePayload.start_at = changes.startAt
          if (changes.endAt !== undefined) updatePayload.end_at = changes.endAt

          const { error } = await supabase
            .from('tasks')
            .update(updatePayload)
            .eq('id', id)
            .eq('user_id', user.id)

          if (error) {
            console.warn('[TaskSync] Cloud update failed:', error.message)
          }
        }

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
    [user, enqueueMutation, persistTasks],
  )

  const deleteTask = useCallback(
    async (id: string) => {
      try {
        if (user) {
          const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

          if (error) {
            console.warn('[TaskSync] Cloud delete failed:', error.message)
          }
        }

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
    [user, enqueueMutation, persistTasks],
  )

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        storageError,
        addTask,
        updateTask,
        deleteTask,
        refreshTasks,
      }}
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
