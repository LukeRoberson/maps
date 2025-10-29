/**
 * @file project-list.tsx
 * 
 * @summary Project page component.
 * Provides a list of user projects with options to create, rename, delete, and import projects.
 * 
 * @exports ProjectList
 */


// External dependencies
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Internal dependencies
import { apiClient } from '@/services/api-client';
import type { Project } from '@/types';
import './project-list.css';


/**
 * ProjectList page component.
 * Displays a list of user projects with options to create, rename, delete, and import projects.
 * 
 * @function ProjectList
 * 
 * @remarks
 * API calls using the ApiClient class.
 * 
 * @returns The Project List page component.
 */
const ProjectList: React.FC = () => {
  // State variable containing the list of projects.
  const [projects, setProjects] = useState<Project[]>([]);

  // Flags: Loading and importing states, modals
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // State variable to track if a project is being renamed
  // Clicking "Rename" sets this to the project ID
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);

  // State variable for the new name being edited
  const [editingName, setEditingName] = useState('');

  // State variable for the new project form
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    center_lat: 0,
    center_lon: 0,
    zoom_level: 13,
  });
  
  // Ref for displaying the file input dialog
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Navigation hook from React Router; Allows programmatic navigation
  const navigate = useNavigate();

  // Load projects on component mount only (so it won't reload on every render)
  // This is a React approach to add efficiency
  useEffect(() => {
    loadProjects();
  }, []);

  /**
   * Loads the list of projects from the API and updates the state.
   * Handles errors and sets loading state.
   * 
   * @returns An array of Project objects.
   * @throws Will log an error if the API call fails.
   */
  const loadProjects = async (): Promise<void> => {
    try {
      // API call to fetch projects
      const data = await apiClient.listProjects();

      // Update state with fetched projects
      setProjects(data);

    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      // Set loading to false after data is fetched or on error
      setLoading(false);
    }
  };


  /**
   * @function handleCreateProject
   * 
   * @summary Handles creating a new project.
   * @remarks
   * Calls the API to create the project, updates state, and navigates to the new project page.
   * 
   * @returns void
   */
  const handleCreateProject = async (): Promise<void> => {
    try {
      // Call API to create the new project
      const created = await apiClient.createProject(newProject);

      // Update state with the new project and close the modal
      setProjects([...projects, created]);
      setShowCreateModal(false);
      setNewProject({
        name: '',
        description: '',
        center_lat: 0,
        center_lon: 0,
        zoom_level: 13,
      });

      // Navigate to the newly created project's page
      navigate(`/projects/${created.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };


  /**   
   * @function handleDeleteProject
   * 
   * @summary Handles deleting a project.
   * 
   * @remarks Prompts for confirmation before deletion.
   * 
   * @param id 
   * @returns void
   */
  const handleDeleteProject = async (
    id: number
  ): Promise<void> => {
    // Confirm deletion with the user
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      // Call API to delete the project
      await apiClient.deleteProject(id);

      // Update state to remove the deleted project
      setProjects(projects.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };


  /**   
   * @function startRenaming
   * 
   * @summary Initiates the renaming process for a project.
   * @remarks Called when double clicking the project name.
   * @param project 
   * @returns void
   */
  const startRenaming = (project: Project): void => {
    // Set the project ID being edited and initialize the editing name
    setEditingProjectId(project.id!);
    setEditingName(project.name);
  };


  /**
   * @function cancelRenaming
   * 
   * @summary Cancels the renaming process.
   * @returns void
   */
  const cancelRenaming = (): void => {
    // Clear renaming state
    setEditingProjectId(null);
    setEditingName('');
  };


  /**
   * @function handleRename
   * 
   * @summary Handles renaming a project.
   * @param projectId 
   * @returns void
   */
  const handleRename = async (projectId: number): Promise<void> => {
    // If the name is empty, cancel renaming
    if (!editingName.trim()) {
      cancelRenaming();
      return;
    }

    try {
      // Call API to update the project name
      const updated = await apiClient.updateProject(projectId, {
        name: editingName.trim(),
      });

      // Update the project list in state
      setProjects(projects.map((p) => (p.id === projectId ? updated : p)));
      
      // Clear renaming state
      cancelRenaming();

    } catch (error) {
      console.error('Failed to rename project:', error);
      alert('Failed to rename project. Please try again.');
    }
  };


  /**
   * Handles the import project button click.
   * Triggers the hidden file input to open the file dialog.
   * 
   * @returns void
   */
  const handleImportClick = (): void => {
    fileInputRef.current?.click();
  };


  /**
   * @function handleFileChange
   * 
   * @summary Handles the file input change event for importing a project.
   * @param event 
   * @returns void
   */
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    // Get the selected file
    const file = event.target.files?.[0];

    // If no file selected, return
    if (!file) return;

    // Set importing state flag
    setIsImporting(true);

    try {
      // Read the file content
      const fileContent = await file.text();
      const importData = JSON.parse(fileContent);
      
      // Call API to import the project
      const importedProject = await apiClient.importProject(importData);
      
      // Refresh the project list
      await loadProjects();
      
      // Notify user of success
      alert(`Project "${importedProject.name}" imported successfully!`);
      
      // Navigate to the imported project (change the current url to the imported project)
      navigate(`/projects/${importedProject.id}`);

    } catch (error) {
      console.error('Failed to import project:', error);
      alert('Failed to import project. Please check the file and try again.');
    } finally {
      // Clear importing state flag
      setIsImporting(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  // Show loading state while fetching projects
  if (loading) {
    return <div className="loading">Loading projects...</div>;
  }

  // Main render
  return (
    // Root div
    <div className="project-list-page">

      {/* Page header with title and action buttons */}
      <div className="page-header">
        <h2>My Projects</h2>
        <div className="header-actions">
          {/* Import Project Button */}
          <button
            className="btn btn-secondary"
            onClick={handleImportClick}
            disabled={isImporting}
          >
            {isImporting ? 'Importing...' : 'Import Project'}
          </button>

          {/* New Project Button */}
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + New Project
          </button>
        </div>
      </div>


      {/* File input for importing projects. Calls handleFileChange when a file is chosen */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />


      {/*
        Empty state when no projects exist (length is zero)
          Displays a message prompting the user to create their first project

        List of projects
          Displays each project in a card format with options to open, rename, or delete
      */}
      {projects.length === 0 ? (
        <div className="empty-state card">
          <p>No projects yet. Create your first project to get started!</p>
        </div>
      ) : (
        
        /* A grid of project cards */
        <div className="projects-grid">
          {/* Create a card for each project */}
          {projects.map((project) => (
            
            /* Set a unique key for each project card using project ID */
            <div key={project.id} className="project-card card">
              

              {/*
                Project name - Either enter editing mode, or display the name
                Double-clicking the name also enters editing mode
              */}
              <div className="project-card-header">
                {/*
                  Ternary operator to switch between display and edit mode
                  When clicking "rename", the editingProjectId is set to the project ID
                  This flags that this project is being renamed, and which one it is
                */}
                {editingProjectId === project.id ? (
                  // Input field for renaming the project
                  <input
                    type="text"
                    className="rename-input"
                    
                    // State variable for the current editing name
                    value={editingName}

                    // Use the editingName state variable to track input changes
                    onChange={(e) => setEditingName(e.target.value)}
                    
                    // Handle Enter and Escape keys
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRename(project.id!);
                      } else if (e.key === 'Escape') {
                        cancelRenaming();
                      }
                    }}

                    // React event to handle when the input loses focus
                    // When focus is lost, finalize the renaming
                    onBlur={() => handleRename(project.id!)}

                    // Tell React to focus this input when it is rendered
                    autoFocus
                  />
                ) : (
                  /*
                    Display the project name
                    If double-clicked, enter renaming mode
                  */
                  <h3 onDoubleClick={() => startRenaming(project)}>
                    {project.name}
                  </h3>
                )}
              </div>


              {/* Project description */}
              <p className="project-description">
                {project.description}
              </p>


              {/* Project card footer with action buttons */}
              <div className="project-card-footer">
                {/* Open Project Button */}
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  Open
                </button>

                {/* Rename Button */}
                {editingProjectId !== project.id && (
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => startRenaming(project)}
                  >
                    Rename
                  </button>
                )}

                {/* Delete Project Button */}
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteProject(project.id!)}
                >
                  Delete
                </button>
              </div>

            </div>
          ))}
        </div>
      )}


      {/*
        Create Project Modal
        Hidden by default, shown when showCreateModal is true
      */}
      {showCreateModal && (
        // Hide modal when clicking outside the content area
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Project</h3>

            {/* Project name input */}
            <div className="form-group">
              <label>Project Name</label>
              <input
                type="text"
                value={newProject.name}

                // Update newProject state with new name
                onChange={(e) =>
                  setNewProject({ ...newProject, name: e.target.value })
                }
                placeholder="Enter project name"
              />
            </div>

            {/* Project description input */}
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newProject.description}

                // Update newProject state with new description
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
                placeholder="Enter project description"
                rows={3}
              />
            </div>

            {/* Center latitude and longitude inputs */}
            <div className="form-row">
              {/* Latitude input */}
              <div className="form-group">
                <label>Center Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newProject.center_lat}

                  // Update newProject state with new latitude
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      center_lat: parseFloat(e.target.value),
                    })
                  }
                />
              </div>

              {/* Longitude input */}
              <div className="form-group">
                <label>Center Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newProject.center_lon}

                  // Update newProject state with new longitude
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      center_lon: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* Zoom level input */}
            <div className="form-group">
              <label>Zoom Level</label>
              <input
                type="number"
                min="1"
                max="18"
                value={newProject.zoom_level}

                // Update newProject state with new zoom level
                onChange={(e) =>
                  setNewProject({
                    ...newProject,
                    zoom_level: parseInt(e.target.value),
                  })
                }
              />
            </div>

            {/* Modal action buttons */}
            <div className="modal-actions">
              {/* Cancel Button */}
              <button
                className="btn btn-outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>

              {/* Create Button */}
              <button
                className="btn btn-primary"
                onClick={handleCreateProject}
                disabled={!newProject.name}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Default export
export default ProjectList;
