export interface UserProfile {
  id: string
  email: string
  username: string
}

export interface Project {
  id: string
  name: string
  description: string
  archived: boolean
  owner_id: string
  created_at: string
  updated_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  created_at: string
  user?: Pick<UserProfile, 'id' | 'email' | 'username'>
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  name: string
  status: TaskStatus
  priority: TaskPriority
  project_id: string
  assignee_id: string
  created_at: string
  updated_at: string
}
