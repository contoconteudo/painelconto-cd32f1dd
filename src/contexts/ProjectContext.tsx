import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, User, UserRole } from '@/types';

interface ProjectContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  userRole: UserRole | null;
  setUserRole: (role: UserRole) => void;
  userProjects: Project[];
  setUserProjects: (projects: Project[]) => void;
  loading: boolean;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user role and projects on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        // Fetch user role
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        if (rolesError) throw rolesError;

        const role = roles.length > 0 ? roles[0].role : 'user';
        setUserRole(role as UserRole);

        // Fetch projects
        await refreshProjects();
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const refreshProjects = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Fetch all projects if admin, or only user projects if not
      let projectsData: Project[] = [];
      if (userRole === 'admin') {
        const { data, error } = await supabase.from('projects').select('*');
        if (error) throw error;
        projectsData = data as Project[];
      } else {
        const { data, error } = await supabase
          .from('user_projects')
          .select(`
            project_id,
            projects (*)
          `)
          .eq('user_id', user.id);
        if (error) throw error;
        projectsData = data.map(up => up.projects) as Project[];
      }

      setProjects(projectsData);
      setUserProjects(projectsData);

      // Set the first project as current if none is set
      if (projectsData.length > 0 && !currentProject) {
        setCurrentProject(projectsData[0]);
      }
    } catch (error) {
      console.error('Error refreshing projects:', error);
    }
  };

  const value: ProjectContextType = {
    currentProject,
    setCurrentProject,
    projects,
    setProjects,
    userRole,
    setUserRole,
    userProjects,
    setUserProjects,
    loading,
    refreshProjects,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};