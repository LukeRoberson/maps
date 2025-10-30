/**
 * @file project.ts
 * 
 * @summary Type definitions for projects.
 * 
 * @exports Project
 * @exports CreateProjectModalProps
 * @exports ProjectCardProps
 * @exports UseProjectListReturn
 */


/**
 * Represents a project containing multiple maps.
 * 
 * @remarks
 * Defines the core structure of a project.
 * 
 * @property {number} [id] - Unique identifier for the project. Optional.
 * @property {string} name - Name of the project.
 * @property {string} description - Description of the project.
 * @property {number} center_lat - Default center latitude for the project maps.
 * @property {number} center_lon - Default center longitude for the project maps.
 * @property {number} zoom_level - Default zoom level for the project maps.
 * @property {string} [tile_layer] - Optional tile layer URL template. Optional.
 * @property {string} [created_at] - Timestamp of project creation. Optional.
 * @property {string} [updated_at] - Timestamp of last project update. Optional.
 */
export interface Project {
  id?: number;
  name: string;
  description: string;
  center_lat: number;
  center_lon: number;
  zoom_level: number;
  tile_layer?: string;
  created_at?: string;
  updated_at?: string;
}


/**
 * Props for CreateProjectModal component.
 * 
 * @property {() => void} onClose - Callback to close the modal.
 * @property {(project: Omit<Project, 'id'>) => Promise<void>} onCreate - 
 *  Callback to create a new project with the provided details.
 */
export interface CreateProjectModalProps {
  onClose: () => void;
  onCreate: (project: Omit<Project, 'id'>) => Promise<void>;
}


/**
 * Props for ProjectCard component.
 */
export interface ProjectCardProps {
  project: Project;
  isEditing: boolean;
  editingName: string;
  onStartRename: () => void;
  onCancelRename: () => void;
  onRename: (name: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onEditingNameChange: (name: string) => void;
}


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
export interface UseProjectListReturn {
  projects: Project[];
  loading: boolean;
  isImporting: boolean;
  loadProjects: () => Promise<void>;
  createProject: (projectData: Omit<Project, 'id'>) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  renameProject: (id: number, name: string) => Promise<void>;
  importProject: (fileContent: string) => Promise<void>;
}
