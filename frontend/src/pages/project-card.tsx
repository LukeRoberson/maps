/**
 * @file project-card.tsx
 * 
 * @summary Component for displaying a single project card.
 * 
 * @exports ProjectCard
 */


// External dependencies
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Internal dependencies
import type { Project } from '@/types';


/**
 * Props for ProjectCard component.
 */
interface ProjectCardProps {
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
 * Displays a single project card with options to open, rename, or delete.
 * 
 * @remarks
 * Includes functions that can be passed in as props for renaming and deleting projects.
 * 
 * @param props - Component props
 * @returns Project card component
 */
export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isEditing,
  editingName,
  onStartRename,
  onCancelRename,
  onRename,
  onDelete,
  onEditingNameChange,
}) => {
    // Navigation hook from React Router; Allows programmatic navigation
    const navigate = useNavigate();


    /**     
     * @function handleKeyDown
     * 
     * @summary Handles key down events in the rename input.
     * @remarks
     * Submits rename on Enter, cancels on Escape.
     *
     * @param e - Keyboard event
     * @returns void
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            // Call onRename prop with the new name
            onRename(editingName);
        } else if (e.key === 'Escape') {
            // Call onCancelRename prop to cancel renaming
            onCancelRename();
        }
    };


    /**
     * Main render of the project card component.
     */
    return (
        // A single project card container
        <div className="project-card card">
            <div className="project-card-header">
                {/* 
                    Project name or rename input
                    If isEditing is true, show input field
                    Otherwise, show project name heading
                */}
                {isEditing ? (
                    <input
                        type="text"
                        className="rename-input"
                        value={editingName}

                        // Update editing name on change; Use onEditingNameChange prop
                        onChange={(e) => onEditingNameChange(e.target.value)}

                        // Handle key down events for Enter/Escape
                        onKeyDown={handleKeyDown}

                        // On blur (lose focus), submit the rename
                        onBlur={() => onRename(editingName)}

                        // Autofocus the input when it appears
                        autoFocus
                    />
                ) : (
                    // Project name heading with double-click to rename
                    <h3 onDoubleClick={onStartRename}>{project.name}</h3>
                )}
            </div>

            {/* Project description */}
            <p className="project-description">
                {project.description}
            </p>

            {/* Footer with action buttons */}
            <div className="project-card-footer">
                {/* Open project button */}
                <button
                    className="btn btn-primary"
                    // Navigate to project page on click
                    onClick={() => navigate(`/projects/${project.id}`)}
                >
                    Open
                </button>

                {/* Rename button, hidden when editing */}
                {!isEditing && (
                    <button
                        className="btn btn-sm btn-outline"
                        // Start renaming on click
                        onClick={onStartRename}
                    >
                        Rename
                    </button>
                )}

                {/* Delete project button */}
                <button
                    className="btn btn-danger"
                    onClick={onDelete}
                >
                    Delete
                </button>
            </div>
        </div>
    );
};
