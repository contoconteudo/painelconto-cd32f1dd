import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Project } from '@/types';
import { AppRole } from '@/data/mockData';

interface ProjectContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  userRole: AppRole | null;
  setUserRole: (role: AppRole) => void;
  userProjects: Project[];
  setUserProjects: (projects: Project[]) => void;
  loading: boolean;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
}

// Projeto padrão mockado
const DEFAULT_PROJECT: Project = {
  id: "default",
  name: "Conto Principal",
  description: "Projeto principal da agência",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2025-01-28T00:00:00Z",
};

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(DEFAULT_PROJECT);
  const [projects, setProjects] = useState<Project[]>([DEFAULT_PROJECT]);
  const [userRole, setUserRole] = useState<AppRole | null>("admin");
  const [userProjects, setUserProjects] = useState<Project[]>([DEFAULT_PROJECT]);
  const [loading] = useState(false);

  const refreshProjects = async () => {
    // Em modo mock, não faz nada
    // Em produção, buscaria os projetos do banco de dados
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
