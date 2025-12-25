
import { Project, CodeFile } from '../types';

const PROJECTS_KEY = 'cursor_projects';

// Helper to simulate network latency for realistic feel
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const CloudService = {
  getProjects: async (): Promise<Project[]> => {
    await delay(300); // Simulate fetch
    try {
      const data = localStorage.getItem(PROJECTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Cloud DB Error:", e);
      return [];
    }
  },

  saveProject: async (project: Project): Promise<Project[]> => {
    await delay(400); // Simulate write
    try {
      const projectsStr = localStorage.getItem(PROJECTS_KEY);
      let projects: Project[] = projectsStr ? JSON.parse(projectsStr) : [];
      
      const index = projects.findIndex(p => p.id === project.id);
      if (index > -1) {
        projects[index] = { ...project, updatedAt: Date.now() };
      } else {
        projects.push({ ...project, updatedAt: Date.now() });
      }
      
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
      return projects;
    } catch (e) {
      console.error("Cloud Save Error:", e);
      throw new Error("Could not save project.");
    }
  },

  deleteProject: async (projectId: string): Promise<Project[]> => {
    await delay(300);
    try {
      const projectsStr = localStorage.getItem(PROJECTS_KEY);
      let projects: Project[] = projectsStr ? JSON.parse(projectsStr) : [];
      projects = projects.filter(p => p.id !== projectId);
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
      return projects;
    } catch (e) {
       console.error("Cloud Delete Error:", e);
       throw new Error("Could not delete project.");
    }
  },

  // Auto-save mechanism for editor
  syncProjectFiles: (projectId: string, files: CodeFile[]) => {
    try {
      const projectsStr = localStorage.getItem(PROJECTS_KEY);
      if (!projectsStr) return;
      
      const projects: Project[] = JSON.parse(projectsStr);
      const index = projects.findIndex(p => p.id === projectId);
      
      if (index > -1) {
        projects[index].files = files;
        projects[index].updatedAt = Date.now();
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
      }
    } catch (e) {
      console.error("Auto-sync failed", e);
    }
  }
};
