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

function mergeTasks(remoteTasks: Task[], localTasks: Task[]): Task[] {
  const tasksById = new Map(remoteTasks.map((task) => [task.id, task]))
  for (const task of localTasks) {
    tasksById.set(task.id, task)
  }
  return Array.from(tasksById.values())
}

export function TaskProvider({ children }: PropsWithChildren) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const activeUserIdRef = useRef(userId)
  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksUserId, setTasksUserId] = useState<string | null | undefined>(
    undefined,
  )
  const [loading, setLoading] = useState(true)
  const [storageErrorState, setStorageErrorState] = useState<{
    ownerId: string | null
    message: string
  } | null>(null)
  const storageError =
    storageErrorState?.ownerId === userId ? storageErrorState.message : null
  const loadedUserIdRef = useRef<string | null | undefined>(undefined)
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve())

  const persistTasks = useCallback(
    async (updatedTasks: Task[], ownerId: string | null) => {
      await saveTasks(updatedTasks, ownerId)
      if (activeUserIdRef.current === ownerId) {
        setTasks(updatedTasks)
        setTasksUserId(ownerId)
        setStorageErrorState(null)
      }
    },
    [],
  )

  const enqueueMutation = useCallback(
    <T,>(ownerId: string | null, mutation: () => Promise<T>) => {
      if (loadedUserIdRef.current !== ownerId) {
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
    },
    [],
  )

  const refreshTasks = useCallback(async () => {
    try {
      await enqueueMutation(userId, async () => {
        const local = await loadTasks(userId)
        await persistTasks(local, userId)
      })

      if (userId) {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .order('start_at', { ascending: true })

        if (error) {
          console.warn('[TaskSync] Supabase fetch error:', error.message)
        } else if (data) {
          const remoteTasks = (data as SupabaseTaskRow[]).map(mapRowToTask)
          await enqueueMutation(userId, async () => {
            const local = await loadTasks(userId)
            await persistTasks(mergeTasks(remoteTasks, local), userId)
          })
        }
      }
    } catch (error) {
      setStorageErrorState({ ownerId: userId, message: errorMessage(error) })
    }
  }, [enqueueMutation, persistTasks, userId])

  useEffect(() => {
    let active = true
    const ownerId = userId
    activeUserIdRef.current = ownerId
    loadedUserIdRef.current = undefined

    loadTasks(ownerId)
      .then(async (local) => {
        if (!active) return
        setTasks(local)
        setTasksUserId(ownerId)
        loadedUserIdRef.current = ownerId

        if (ownerId) {
          const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', ownerId)
            .order('start_at', { ascending: true })

          if (error) {
            console.warn('[TaskSync] Supabase fetch error:', error.message)
          } else if (data && active) {
            const remoteTasks = (data as SupabaseTaskRow[]).map(mapRowToTask)
            await enqueueMutation(ownerId, async () => {
              if (!active) return
              const latestLocal = await loadTasks(ownerId)
              await persistTasks(mergeTasks(remoteTasks, latestLocal), ownerId)
            })
          }
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setTasksUserId(ownerId)
          setStorageErrorState({ ownerId, message: errorMessage(error) })
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
  }, [enqueueMutation, persistTasks, userId])

  const addTask = useCallback(
    async (input: NewTask) => {
      try {
        const task = createTaskRecord(input)
        await enqueueMutation(userId, async () => {
          const local = await loadTasks(userId)
          await persistTasks([...local, task], userId)
        })

        if (!userId) return task

        let data: SupabaseTaskRow | null
        let error: { message: string } | null
        try {
          const result = await supabase
            .from('tasks')
            .insert({
              user_id: userId,
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
          data = result.data as SupabaseTaskRow | null
          error = result.error
        } catch (cloudError) {
          console.warn(
            '[TaskSync] Cloud insert failed; task was saved locally:',
            errorMessage(cloudError),
          )
          return task
        }

        if (error || !data) {
          console.warn(
            '[TaskSync] Cloud insert failed; task was saved locally:',
            error?.message || 'No task was returned.',
          )
          return task
        }

        const syncedTask = mapRowToTask(data)
        await enqueueMutation(userId, async () => {
          const local = await loadTasks(userId)
          const currentTask = local.find(
            (savedTask) => savedTask.id === task.id,
          )
          if (!currentTask) return

          await persistTasks(
            local.map((savedTask) =>
              savedTask.id === task.id
                ? { ...syncedTask, ...currentTask, id: syncedTask.id }
                : savedTask,
            ),
            userId,
          )
        })

        return syncedTask
      } catch (error) {
        setStorageErrorState({ ownerId: userId, message: errorMessage(error) })
        throw error
      }
    },
    [userId, enqueueMutation, persistTasks],
  )

  const updateTask = useCallback(
    async (id: string, changes: Partial<Omit<Task, 'id'>>) => {
      try {
        await enqueueMutation(userId, async () => {
          const local = await loadTasks(userId)
          const taskExists = local.some((task) => task.id === id)
          if (!taskExists) {
            throw new Error(`Task "${id}" was not found.`)
          }

          await persistTasks(
            local.map((task) =>
              task.id === id ? { ...task, ...changes } : task,
            ),
            userId,
          )
        })

        if (userId) {
          const updatePayload: Record<string, unknown> = {}
          if (changes.title !== undefined) updatePayload.title = changes.title
          if (changes.description !== undefined) updatePayload.description = changes.description
          if (changes.category !== undefined) updatePayload.category = changes.category
          if (changes.priority !== undefined) updatePayload.priority = changes.priority
          if (changes.status !== undefined) updatePayload.status = changes.status
          if (changes.startAt !== undefined) updatePayload.start_at = changes.startAt
          if (changes.endAt !== undefined) updatePayload.end_at = changes.endAt

          try {
            const { error } = await supabase
              .from('tasks')
              .update(updatePayload)
              .eq('id', id)
              .eq('user_id', userId)
            if (error) {
              console.warn('[TaskSync] Cloud update failed:', error.message)
            }
          } catch (error) {
            console.warn(
              '[TaskSync] Cloud update failed; task was saved locally:',
              errorMessage(error),
            )
          }
        }
      } catch (error) {
        setStorageErrorState({ ownerId: userId, message: errorMessage(error) })
        throw error
      }
    },
    [userId, enqueueMutation, persistTasks],
  )

  const deleteTask = useCallback(
    async (id: string) => {
      try {
        await enqueueMutation(userId, async () => {
          const local = await loadTasks(userId)
          await persistTasks(
            local.filter((task) => task.id !== id),
            userId,
          )
        })

        if (userId) {
          try {
            const { error } = await supabase
              .from('tasks')
              .delete()
              .eq('id', id)
              .eq('user_id', userId)
            if (error) {
              console.warn('[TaskSync] Cloud delete failed:', error.message)
            }
          } catch (error) {
            console.warn(
              '[TaskSync] Cloud delete failed; task was deleted locally:',
              errorMessage(error),
            )
          }
        }
      } catch (error) {
        setStorageErrorState({ ownerId: userId, message: errorMessage(error) })
        throw error
      }
    },
    [userId, enqueueMutation, persistTasks],
  )

  const visibleTasks = tasksUserId === userId ? tasks : []

  return (
    <TaskContext.Provider
      value={{
        tasks: visibleTasks,
        loading: loading || tasksUserId !== userId,
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
