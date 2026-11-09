export type TaskCategory = 'health' | 'study' | 'personal'

export type TaskStatus = 'pending' | 'completed' | 'failed'

export type Task = {
  id: string
  title: string
  description: string
  category: TaskCategory
  startAt: string
  endAt: string
  status: TaskStatus
}

export type NewTask = Omit<Task, 'id' | 'status'>
