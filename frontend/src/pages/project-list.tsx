/**
 * @file project-list.tsx
 * 
 * @summary Project page component.
 * Provides a list of user projects with options to create, rename, delete, and import projects.
 * 
 * @remarks
 * Supporting types and components are in the ../components/project/ directory.
 * 
 * @exports ProjectList
 */


// External dependencies
import React, { useState, useRef } from 'react';

// Internal dependencies
import { useProjectList } from '../components/project/hooks';
import { ProjectCard } from '../components/project/project-card';
import { CreateProjectModal } from '../components/project/create-project-modal';
import './project-list.css';


/**
 * ProjectList page component.
 * Displays a list of user projects with options to create, rename, delete, and import projects.
 * 
 * @function ProjectList
 * 
 * @returns The Project List page component.
 */
const ProjectList: React.FC = () => {
    // Use the custom hook to manage project list state and operations
    const {
        projects,
        loading,
        isImporting,
        createProject,
        deleteProject,
        renameProject,
        importProject,
    } = useProjectList();

    // Local state for modal visibility and editing
    const [showCreateModal, setShowCreateModal] = useState(false);

    // State for tracking which project is being renamed
    const [editingProjectId, setEditingProjectId] = useState<number | null>(null);

    // State for the current name being edited
    const [editingName, setEditingName] = useState('');
  
    // Ref for displaying the file input dialog
    const fileInputRef = useRef<HTMLInputElement>(null);


    /**
     * @function handleFileChange
     * 
     * @summary Handles file input change event for importing a project.
     */
    const handleImportClick = (): void => {
      fileInputRef.current?.click();
    };


    /**
     * @function handleFileChange
     * 
     * @summary Handles file input change event for importing a project.
     * 
     * @param {React.ChangeEvent} event - File input change event
     * @returns {Promise<void>}
     */
    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ): Promise<void> => {
        // Get the selected file
        const file = event.target.files?.[0];

        // If no file selected, return
        if (!file) return;

        try {
            // Read file content as text
            const fileContent = await file.text();

            // Call importProject from the hook
            await importProject(fileContent);
            alert('Project imported successfully!');
        } catch (error) {
            alert('Failed to import project. Please check the file and try again.');
        } finally {
            // Clear the file input value to allow re-uploading the same file if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };


    /**
     * @function handleCreateProject
     * 
     * @summary Handles creating a new project.
     * @returns void
     */
    const handleRename = async (
        projectId: number
    ): Promise<void> => {
        // Validate the new name is not empty
        if (!editingName.trim()) {
            setEditingProjectId(null);
            setEditingName('');
            return;
        }

        try {
            // Call renameProject from the hook
            await renameProject(projectId, editingName.trim());

            // Clear editing state
            setEditingProjectId(null);
            setEditingName('');
        } catch (error) {
            alert('Failed to rename project. Please try again.');
        }
    };


    // While loading, show a loading indicator
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
                    <ProjectCard
                        key={project.id}
                        project={project}
                        isEditing={editingProjectId === project.id}
                        editingName={editingName}

                        // Handlers for renaming and deleting projects
                        onStartRename={() => {
                            setEditingProjectId(project.id!);
                            setEditingName(project.name);
                        }}

                        // Cancel renaming
                        onCancelRename={() => {
                            setEditingProjectId(null);
                            setEditingName('');
                        }}

                        // Submit rename
                        onRename={() => handleRename(project.id!)}

                        // Delete project
                        onDelete={() => deleteProject(project.id!)}

                        // Update editing name state
                        onEditingNameChange={setEditingName}
                    />
                ))}
            </div>
            )}

            {/*
                Create Project Modal
                Hidden by default, shown when showCreateModal is true
            */}
            {showCreateModal && (
                // CreateProjectModal component with onClose and onCreate handlers
                <CreateProjectModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={createProject}
                />
            )}
        </div>
    );
};

export default ProjectList;
