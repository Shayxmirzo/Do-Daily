import AsyncStorage from '@react-native-async-storage/async-storage'
import type { NewTask, Task, TaskCategory, TaskStatus } from '../types/task'

const tasksKey = 'tasks'

function isTaskCategory(value: unknown): value is TaskCategory {
  return value === 'health' || value === 'study' || value === 'personal'
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === 'pending' || value === 'completed' || value === 'failed'
}

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const task = value as Record<string, unknown>
  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.description === 'string' &&
    isTaskCategory(task.category) &&
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

  if (!Array.isArray(parsed) || !parsed.every(isTask)) {
    throw new Error('Saved tasks could not be read because the stored data has an invalid format.')
  }

  return parsed
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
