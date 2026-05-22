-- Drop trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Drop tables with CASCADE (handles policies automatically)
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS is_project_owner(UUID);
DROP FUNCTION IF EXISTS is_project_member(UUID);
DROP FUNCTION IF EXISTS is_project_archived(UUID);
DROP FUNCTION IF EXISTS remove_project_member(UUID, UUID);
DROP FUNCTION IF EXISTS check_profile_exists(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_email_by_username(TEXT);
DROP FUNCTION IF EXISTS is_email_confirmed(UUID);

-- 1. Profiles table (syncs with auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'username');
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Allow anon role to look up email by username (needed for login)
CREATE OR REPLACE FUNCTION get_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM profiles WHERE username = p_username;
  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_email_by_username TO anon, authenticated;

-- Allow anon to check if email or username exists before registration
CREATE OR REPLACE FUNCTION check_profile_exists(p_email TEXT, p_username TEXT)
RETURNS TEXT AS $$
DECLARE
  v_result TEXT;
BEGIN
  SELECT 'email' INTO v_result FROM profiles WHERE email = p_email LIMIT 1;
  IF FOUND THEN RETURN v_result; END IF;
  SELECT 'username' INTO v_result FROM profiles WHERE username = p_username LIMIT 1;
  IF FOUND THEN RETURN v_result; END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_profile_exists TO anon;

-- Check if a user's email is confirmed (for member verification)
CREATE OR REPLACE FUNCTION is_email_confirmed(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = p_user_id AND email_confirmed_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_email_confirmed TO authenticated;

-- Grant base table access to roles (required for RLS policies to work)
GRANT SELECT, UPDATE ON TABLE profiles TO authenticated;

-- 2. Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  description TEXT DEFAULT '' CHECK (char_length(description) <= 500),
  archived BOOLEAN DEFAULT false,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Project members
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- 4. Helper function: check if user is a project member (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION is_project_member(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if user is the project owner (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION is_project_owner(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 5. Helper function: check if project is archived (bypasses RLS)
CREATE OR REPLACE FUNCTION is_project_archived(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT archived FROM public.projects WHERE id = p_project_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 6. Function: remove member and reassign tasks to project owner
CREATE OR REPLACE FUNCTION remove_project_member(p_project_id UUID, p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT owner_id INTO v_owner_id FROM projects WHERE id = p_project_id;
  UPDATE tasks SET assignee_id = v_owner_id
  WHERE project_id = p_project_id AND assignee_id = p_user_id;
  DELETE FROM project_members
  WHERE project_id = p_project_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 200),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Grant base table access
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE projects TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE project_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tasks TO authenticated;
GRANT EXECUTE ON FUNCTION is_project_owner TO authenticated;
GRANT EXECUTE ON FUNCTION is_project_member TO authenticated;
GRANT EXECUTE ON FUNCTION is_project_archived TO authenticated;
GRANT EXECUTE ON FUNCTION remove_project_member TO authenticated;

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Projects: owner can do everything
CREATE POLICY "Project owner can do everything"
  ON projects FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Projects: members can read (uses security definer function to avoid recursion)
CREATE POLICY "Project members can read projects"
  ON projects FOR SELECT TO authenticated
  USING (is_project_member(id));

-- Project members: owner can manage (uses security definer function to avoid recursion)
CREATE POLICY "Project owner can manage members"
  ON project_members FOR ALL TO authenticated
  USING (is_project_owner(project_id))
  WITH CHECK (is_project_owner(project_id));

-- Project members: members can read (uses security definer function to avoid recursion)
CREATE POLICY "Members can read project members"
  ON project_members FOR SELECT TO authenticated
  USING (is_project_member(project_id));

-- Tasks: owner can read all
CREATE POLICY "Owner can read tasks"
  ON tasks FOR SELECT TO authenticated
  USING (is_project_owner(project_id));

-- Tasks: owner can create (except if archived)
CREATE POLICY "Owner can create tasks"
  ON tasks FOR INSERT TO authenticated
  WITH CHECK (is_project_owner(project_id) AND NOT is_project_archived(project_id));

-- Tasks: owner can update (except if archived)
CREATE POLICY "Owner can update tasks"
  ON tasks FOR UPDATE TO authenticated
  USING (is_project_owner(project_id))
  WITH CHECK (is_project_owner(project_id) AND NOT is_project_archived(project_id));

-- Tasks: owner can delete (except if archived)
CREATE POLICY "Owner can delete tasks"
  ON tasks FOR DELETE TO authenticated
  USING (is_project_owner(project_id) AND NOT is_project_archived(project_id));

-- Tasks: members can read all
CREATE POLICY "Members can read tasks"
  ON tasks FOR SELECT TO authenticated
  USING (is_project_member(project_id));

-- Tasks: members can create tasks (for any project member, except if archived)
CREATE POLICY "Members can create tasks"
  ON tasks FOR INSERT TO authenticated
  WITH CHECK (is_project_member(project_id) AND NOT is_project_archived(project_id));

-- Tasks: users can update their own (except if archived)
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE TO authenticated
  USING (assignee_id = auth.uid() AND is_project_member(project_id))
  WITH CHECK (assignee_id = auth.uid() AND is_project_member(project_id) AND NOT is_project_archived(project_id));

-- Tasks: users can delete their own (except if archived)
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE TO authenticated
  USING (assignee_id = auth.uid() AND is_project_member(project_id) AND NOT is_project_archived(project_id));
