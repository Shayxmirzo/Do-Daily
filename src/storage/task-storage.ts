import AsyncStorage from '@react-native-async-storage/async-storage'
import type {
  NewTask,
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../types/task'

const tasksKeyPrefix = '@do-daily/tasks'
const legacyTasksKey = 'tasks'
const taskScopeMigrationKey = '@do-daily/task-scope-migration-v1'

type StoredTask = Omit<Task, 'priority'> & { priority?: TaskPriority }

function getTasksKey(userId?: string | null): string {
  return userId
    ? `${tasksKeyPrefix}:user:${userId}`
    : `${tasksKeyPrefix}:guest`
}

let taskScopeMigration: Promise<void> | null = null

async function migrateLegacyTasks(): Promise<void> {
  const migrationComplete = await AsyncStorage.getItem(taskScopeMigrationKey)
  if (migrationComplete === 'true') return

  const legacyTasks = await AsyncStorage.getItem(legacyTasksKey)
  if (legacyTasks !== null) {
    const guestTasksKey = getTasksKey()
    const guestTasks = await AsyncStorage.getItem(guestTasksKey)
    if (guestTasks === null) {
      await AsyncStorage.setItem(guestTasksKey, legacyTasks)
    }
    await AsyncStorage.removeItem(legacyTasksKey)
  }

  await AsyncStorage.setItem(taskScopeMigrationKey, 'true')
}

async function ensureTaskScopeMigration(): Promise<void> {
  if (!taskScopeMigration) {
    taskScopeMigration = migrateLegacyTasks().catch((error: unknown) => {
      taskScopeMigration = null
      throw error
    })
  }
  await taskScopeMigration
}

function isTaskCategory(value: unknown): value is TaskCategory {
  return value === 'health' || value === 'study' || value === 'personal'
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return value === 'low' || value === 'medium' || value === 'high'
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === 'pending' || value === 'completed' || value === 'failed'
}

function isStoredTask(value: unknown): value is StoredTask {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const task = value as Record<string, unknown>
  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.description === 'string' &&
    isTaskCategory(task.category) &&
    (task.priority === undefined || isTaskPriority(task.priority)) &&
    typeof task.startAt === 'string' &&
    !Number.isNaN(Date.parse(task.startAt)) &&
    typeof task.endAt === 'string' &&
    !Number.isNaN(Date.parse(task.endAt)) &&
    isTaskStatus(task.status)
  )
}

export async function loadTasks(userId?: string | null): Promise<Task[]> {
  await ensureTaskScopeMigration()
  const savedTasks = await AsyncStorage.getItem(getTasksKey(userId))
  if (savedTasks === null) {
    return []
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(savedTasks)
  } catch {
    throw new Error('Saved tasks could not be read because the stored data is invalid.')
  }

  if (!Array.isArray(parsed) || !parsed.every(isStoredTask)) {
    throw new Error('Saved tasks could not be read because the stored data has an invalid format.')
  }

  return parsed.map((task) => ({ ...task, priority: task.priority ?? 'medium' }))
}

export async function saveTasks(
  tasks: Task[],
  userId?: string | null,
): Promise<void> {
  await ensureTaskScopeMigration()
  await AsyncStorage.setItem(getTasksKey(userId), JSON.stringify(tasks))
}

export async function addSavedTask(
  task: Task,
  userId?: string | null,
): Promise<Task[]> {
  const savedTasks = await loadTasks(userId)
  if (savedTasks.some((savedTask) => savedTask.id === task.id)) {
    throw new Error(`A task with ID "${task.id}" already exists.`)
  }

  const updatedTasks = [...savedTasks, task]
  await saveTasks(updatedTasks, userId)
  return updatedTasks
}

export async function updateSavedTask(
  id: string,
  changes: Partial<Omit<Task, 'id'>>,
  userId?: string | null,
): Promise<Task[]> {
  const tasks = await loadTasks(userId)
  const taskIndex = tasks.findIndex((task) => task.id === id)
  if (taskIndex === -1) {
    throw new Error(`Task "${id}" was not found.`)
  }

  const updatedTasks = tasks.map((task) =>
    task.id === id ? { ...task, ...changes } : task,
  )
  await saveTasks(updatedTasks, userId)
  return updatedTasks
}

export async function deleteSavedTask(
  id: string,
  userId?: string | null,
): Promise<Task[]> {
  const tasks = await loadTasks(userId)
  const updatedTasks = tasks.filter((task) => task.id !== id)
  if (updatedTasks.length !== tasks.length) {
    await saveTasks(updatedTasks, userId)
  }
  return updatedTasks
}

export function createTaskRecord(input: NewTask): Task {
  return {
    ...input,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    status: 'pending',
  }
}
