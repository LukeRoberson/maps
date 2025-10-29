/**
 * @file use-project-list.ts
 * 
 * @summary Custom hook for managing project list state and operations.
 * 
 * @exports useProjectList
 */


// External dependencies
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Internal dependencies
import { apiClient } from '@/services/api-client';
import type { Project } from '@/types';


/**
 * Return type for useProjectList hook.
 * 
 * @property {Project[]} projects - List of projects.
 * @property {boolean} loading - Loading state for project list.
 * @property {boolean} isImporting - Importing state for project import.
 * @property {() => Promise<void>} loadProjects - Function to load projects.
 * @property {(projectData: Omit<Project, 'id'>) => Promise<void>} createProject - Function to create a new project.
 * @property {(id: number) => Promise<void>} deleteProject - Function to delete a project by ID.
 * @property {(id: number, name: string) => Promise<void>} renameProject - Function to rename a project.
 * @property {(fileContent: string) => Promise<void>} importProject - Function to import a project from file content.
 */
interface UseProjectListReturn {
  projects: Project[];
  loading: boolean;
  isImporting: boolean;
  loadProjects: () => Promise<void>;
  createProject: (projectData: Omit<Project, 'id'>) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  renameProject: (id: number, name: string) => Promise<void>;
  importProject: (fileContent: string) => Promise<void>;
}


/**
 * @function useProjectList
 * 
 * @summary Custom hook for managing project list state and operations.
 * 
 * @returns Project list state and operations
 */
export const useProjectList = (): UseProjectListReturn => {
    // State variable containing the list of projects.
    const [projects, setProjects] = useState<Project[]>([]);

    // Flags for loading and importing states.
    const [loading, setLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);

    // Navigation hook from React Router; Allows programmatic navigation
    const navigate = useNavigate();


    /**
     * @function loadProjects
     * 
     * @summary Loads the list of projects from the backend API.
     * @remarks
     * Updates the projects state variable and loading state.
     * 
     * @returns void
     */
    const loadProjects = useCallback(async (): Promise<void> => {
        try {
            // Fetch projects from API
            const data = await apiClient.listProjects();

            // Update state with fetched projects
            setProjects(data);
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setLoading(false);
        }
    }, []);


    /**
     * @function createProject
     * 
     * @summary Creates a new project via the backend API.
     * @remarks
     * On success, adds the new project to the projects state and navigates to its page.
     * 
     * @param projectData - Data for the new project (excluding ID)
     * @returns void
     */
    const createProject = useCallback(async (
        projectData: Omit<Project, 'id'>
    ): Promise<void> => {
        try {
            // Create project via API
            const created = await apiClient.createProject(projectData);

            // Update state and navigate to new project
            setProjects((prev) => [...prev, created]);
            navigate(`/projects/${created.id}`);
        } catch (error) {
            console.error('Failed to create project:', error);
            throw error;
        }
    }, [navigate]);


    /**
     * @function deleteProject
     * 
     * @summary Deletes a project by ID via the backend API.
     * @remarks
     * On success, removes the project from the projects state.
     *
     * @param id - ID of the project to delete
     * @returns void
     */
    const deleteProject = useCallback(async (
        id: number
    ): Promise<void> => {
        // Confirm deletion with the user
        if (!window.confirm('Are you sure you want to delete this project?')) {
            return;
        }

        try {
            // Delete project via API
            await apiClient.deleteProject(id);
            setProjects((prev) => prev.filter((p) => p.id !== id));
        } catch (error) {
            console.error('Failed to delete project:', error);
            throw error;
        }
    }, []);


    /**
     * @function renameProject
     * 
     * @summary Renames a project via the backend API.
     * @remarks
     * On success, updates the project's name in the projects state.
     *
     * @param id - ID of the project to rename
     * @param name - New name for the project
     * @returns void
     */
    const renameProject = useCallback(async (
        id: number,
        name: string
    ): Promise<void> => {
        try {
            // Rename project via API
            const updated = await apiClient.updateProject(id, { name });

            // Update state with renamed project
            setProjects((prev) =>
                prev.map((p) => (p.id === id ? updated : p))
            );
        } catch (error) {
            console.error('Failed to rename project:', error);
            throw error;
        }
    }, []);


    /**
     * @function importProject
     * 
     * @summary Imports a project from file content via the backend API.
     * @remarks
     * On success, adds the imported project to the projects state and navigates to its page.
     *
     * @param fileContent - Content of the project file to import
     * @returns void
     */
    const importProject = useCallback(async (
        fileContent: string
    ): Promise<void> => {
        // Set importing state
        setIsImporting(true);

        try {
            // Import project via API
            const importData = JSON.parse(fileContent);
            const importedProject = await apiClient.importProject(importData);

            // Update state and navigate to imported project
            await loadProjects();
            navigate(`/projects/${importedProject.id}`);
        } catch (error) {
            console.error('Failed to import project:', error);
            throw error;
        } finally {
            // Reset importing state
            setIsImporting(false);
        }
    }, [loadProjects, navigate]);

    // Load projects on component mount only (so it won't reload on every render)
    // This is a React approach to add efficiency
    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    /**
     * Return the project list state and operations.
     */
    return {
        projects,
        loading,
        isImporting,
        loadProjects,
        createProject,
        deleteProject,
        renameProject,
        importProject,
    };
};