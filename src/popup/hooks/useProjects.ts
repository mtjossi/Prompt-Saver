import { useState, useEffect, useCallback } from 'react';
import { Project } from '../../lib/types';
import { getProjects, saveProjects, generateId } from '../../lib/storage';

const DEFAULT_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6',
];

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects().then((data) => {
      setProjects(data);
      setLoading(false);
    });
  }, []);

  const addProject = useCallback(
    async (name: string) => {
      const color = DEFAULT_COLORS[projects.length % DEFAULT_COLORS.length];
      const newProject: Project = {
        id: generateId(),
        name,
        color,
        createdAt: Date.now(),
      };
      const updated = [...projects, newProject];
      await saveProjects(updated);
      setProjects(updated);
      return newProject;
    },
    [projects]
  );

  const updateProject = useCallback(
    async (id: string, data: Partial<Project>) => {
      const updated = projects.map((p) => (p.id === id ? { ...p, ...data } : p));
      await saveProjects(updated);
      setProjects(updated);
    },
    [projects]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      const updated = projects.filter((p) => p.id !== id);
      await saveProjects(updated);
      setProjects(updated);
    },
    [projects]
  );

  const importProjects = useCallback(async (newProjects: Project[]) => {
    await saveProjects(newProjects);
    setProjects(newProjects);
  }, []);

  return {
    projects,
    loading,
    addProject,
    updateProject,
    deleteProject,
    importProjects,
  };
}
