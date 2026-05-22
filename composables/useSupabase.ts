import type { UserProfile, Project, ProjectMember, Task } from '~/types'

export const useSupabase = () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()

  const getProfile = async (userId?: string): Promise<UserProfile | null> => {
    const id = userId || user.value?.id
    if (!id) return null
    const { data } = await client.from('profiles').select('id, email, username').eq('id', id).single()
    return data
  }

  const getEmailByUsername = async (username: string): Promise<string | null> => {
    const { data } = await client.rpc('get_email_by_username', {
      p_username: username,
    } as never)
    return data as string | null
  }

  const isEmailConfirmed = async (userId: string): Promise<boolean> => {
    const { data } = await client.rpc('is_email_confirmed', {
      p_user_id: userId,
    } as never)
    return !!data
  }

  const getProjects = async (): Promise<Project[]> => {
    const { data } = await client.from('projects').select('*').order('created_at', { ascending: false })
    return data || []
  }

  const getProject = async (id: string): Promise<Project | null> => {
    const { data } = await client.from('projects').select('*').eq('id', id).single()
    return data
  }

  const createProject = async (project: Pick<Project, 'name' | 'description'>): Promise<Project | null> => {
    const { data } = await client
      .from('projects')
      .insert({ name: project.name, description: project.description, owner_id: user.value?.id } as never)
      .select()
      .single()
    return data
  }

  const updateProject = async (
    id: string,
    updates: Partial<Pick<Project, 'name' | 'description' | 'archived'>>,
  ): Promise<Project | null> => {
    const { data } = await client
      .from('projects')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single()
    return data
  }

  const deleteProject = async (id: string): Promise<void> => {
    await client.from('projects').delete().eq('id', id)
  }

  const getProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
    const { data: members } = await client
      .from('project_members')
      .select('id, project_id, user_id, created_at, user:user_id(id, email, username)')
      .eq('project_id', projectId)
    return (members as unknown as ProjectMember[]) || []
  }

  const addProjectMember = async (projectId: string, userId: string): Promise<void> => {
    await client.from('project_members').insert({ project_id: projectId, user_id: userId } as never)
  }

  const removeProjectMember = async (projectId: string, userId: string): Promise<void> => {
    await client.rpc('remove_project_member', {
      p_project_id: projectId,
      p_user_id: userId,
    } as never)
  }

  const getTasks = async (projectId: string): Promise<Task[]> => {
    const { data } = await client
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    return data || []
  }

  const createTask = async (
    task: { name: string; priority: string; assignee_id: string },
    projectId: string,
  ): Promise<Task | null> => {
    const { data } = await client
      .from('tasks')
      .insert({
        name: task.name,
        priority: task.priority,
        assignee_id: task.assignee_id,
        project_id: projectId,
      } as never)
      .select()
      .single()
    return data
  }

  const updateTask = async (
    id: string,
    updates: Partial<Pick<Task, 'name' | 'status' | 'priority' | 'assignee_id'>>,
  ): Promise<Task | null> => {
    const { data } = await client
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single()
    return data
  }

  const deleteTask = async (id: string): Promise<void> => {
    await client.from('tasks').delete().eq('id', id)
  }

  return {
    client,
    user,
    getProfile,
    getEmailByUsername,
    isEmailConfirmed,
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    getProjectMembers,
    addProjectMember,
    removeProjectMember,
    getTasks,
    createTask,
    updateTask,
    deleteTask,
  }
}
