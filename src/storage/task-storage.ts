import AsyncStorage from '@react-native-async-storage/async-storage'
import type {
  NewTask,
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../types/task'

const tasksKey = 'tasks'

type StoredTask = Omit<Task, 'priority'> & { priority?: TaskPriority }

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

export async function loadTasks(): Promise<Task[]> {
  const savedTasks = await AsyncStorage.getItem(tasksKey)
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

export async function saveTasks(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(tasksKey, JSON.stringify(tasks))
}

export async function addSavedTask(task: Task): Promise<Task[]> {
  const savedTasks = await loadTasks()
  if (savedTasks.some((savedTask) => savedTask.id === task.id)) {
    throw new Error(`A task with ID "${task.id}" already exists.`)
  }

  const updatedTasks = [...savedTasks, task]
  await saveTasks(updatedTasks)
  return updatedTasks
}

export async function updateSavedTask(
  id: string,
  changes: Partial<Omit<Task, 'id'>>,
): Promise<Task[]> {
  const tasks = await loadTasks()
  const taskIndex = tasks.findIndex((task) => task.id === id)
  if (taskIndex === -1) {
    throw new Error(`Task "${id}" was not found.`)
  }

  const updatedTasks = tasks.map((task) =>
    task.id === id ? { ...task, ...changes } : task,
  )
  await saveTasks(updatedTasks)
  return updatedTasks
}

export async function deleteSavedTask(id: string): Promise<Task[]> {
  const tasks = await loadTasks()
  const updatedTasks = tasks.filter((task) => task.id !== id)
  if (updatedTasks.length !== tasks.length) {
    await saveTasks(updatedTasks)
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
