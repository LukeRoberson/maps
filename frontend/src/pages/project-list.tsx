/**
 * @file project-list.tsx
 * 
 * @summary Project page component.
 * Provides a list of user projects with options to create, rename, delete, and import projects.
 * 
 * @remarks
 * Uses the useProjectList hook to manage project state and operations.
 * 
 * @exports ProjectList
 */


// External dependencies
import React, { useState, useRef } from 'react';

// Atoms
import Heading from '../components/atoms/Heading';
import Button from '../components/atoms/Button';

// Organisms
import Card from '../components/organisms/Card';
import { CreateProjectModal } from '../components/organisms/CreateProjectModal';
import { ProjectCard } from '@/components/organisms/ProjectCard';

// Hooks
import { useProjectList } from '../hooks/useProjectList';

import './project-list.css'


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

    // State for modal visibility and editing
    const [showCreateModal, setShowCreateModal] = useState(false);

    // State for tracking which project is being renamed
    const [editingProjectId, setEditingProjectId] = useState<number | null>(null);

    // State for the current name being edited
    const [editingName, setEditingName] = useState('');
  
    /*
    Ref for displaying the file input dialog. Used when importing a project.
    Initialised to null. Later set to the file input element.
    */
    const fileInputRef = useRef<HTMLInputElement>(null);


    /**
     * @function handleImportClick
     * 
     * @summary Handles the click event for the "Import Project" button.
     * fileInputRef is pointing to the hidden file input element.
     * This function triggers the click method on the file input element.
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
            console.error('Failed to import project:', error);
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
            console.error('Failed to rename project:', error);

        }
    };


    // While loading, show a loading indicator
    if (loading) {
        return <div className="loading">
            Loading projects...
        </div>;
    }


    // Main render
    return (
        /* Root element */
        <div className="page-wrapper">
            {/* The card/page container */}
            <div className="card-wrapper">


                {/* Page header with title and action buttons */}
                <div className="page-header">
                    <Heading level={1} text="Current Projects" />
                    
                    <div className="action-buttons">
                        {/* Import Project Button */}
                        <Button
                            text={isImporting ? 'Importing...' : 'Import Project'}
                            onClick={handleImportClick}
                            disabled={isImporting}
                            type="blue"
                        />

                        {/* New Project Button */}
                        <Button
                            text="+ New Project"
                            onClick={() => setShowCreateModal(true)}
                            type="green"
                        />
                    </div>
                </div>
                

                {/*
                    File input for importing projects.
                    fileInputRef is the ref that selects this element.
                    The handleImportClick event handler makes this visible.
                    Calls handleFileChange when a file is chosen.
                */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />


                {/*
                    List of projects
                        Displays each project in a card format with options to open, rename, or delete
                        If no projects exist (length is zero), shows a message prompting the user to create their first project
                */}
                {projects.length === 0 ? (
                    /* Empty state when no projects exist */
                    <Card 
                        content={[{card: [{
                            kind: 'paragraph',
                            align: 'center',
                            text: 'No projects yet. Create your first project to get started!'
                        }]}]}
                    />
                ) : (
                    /* A grid of project cards */
                    <div className="project-card">
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
        </div>
    );
};

export default ProjectList;
