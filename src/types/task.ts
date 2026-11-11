export type TaskCategory = 'health' | 'study' | 'personal'

export type TaskPriority = 'low' | 'medium' | 'high'

export type TaskStatus = 'pending' | 'completed' | 'failed'

export type Task = {
  id: string
  title: string
  description: string
  category: TaskCategory
  priority: TaskPriority
  startAt: string
  endAt: string
  status: TaskStatus
}

export type NewTask = Omit<Task, 'id' | 'status'>
