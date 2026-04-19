/**
 * @file ProjectCard.tsx
 * 
 * @summary Component for displaying a single project card.
 * 
 * @exports ProjectCard
 */


// External dependencies
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Types
import type { Project } from '@/hooks/useProjectView';
import type { CardBox } from '@/components/organisms/Card';

// Atoms
import Button from '../atoms/Button';

// Molecules
import EditableHeading from '../Molecules/EditableHeading';

// Organisms
import Card from './Card';


/**
 * Props for ProjectCard component.
 */
type ProjectCardProps = {
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
 * @param project - The project data to display in the card
 * @param isEditing - Whether the project name is currently being edited
 * @param editingName - The current value of the project name being edited
 * @param onStartRename - Function to call when starting to rename the project
 * @param onCancelRename - Function to call when cancelling the rename operation
 * @param onRename - Function to call with the new name when renaming the project
 * @param onDelete - Function to call when deleting the project
 * @param onEditingNameChange - Function to call when the editing name input changes
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
    // Navigation hook
    const navigate = useNavigate();

    // The settings for the editable heading component for the project name.
    const headingSettings = {
        condition: isEditing,
        editBox: {
            value: editingName,
            onChangeFunction: (newValue: string) => onEditingNameChange(newValue),
            successFunction: () => onRename(editingName),
            cancelFunction: onCancelRename,
        },
        heading: {
            level: 2,
            text: project.name,
        },
        button: {
            text: '✏️',
            onClick: onStartRename,
            type: 'icon',
        },
    } satisfies React.ComponentProps<typeof EditableHeading>;

    // Button to open the project, navigates to the project page when clicked
    const buttonOpen = {
        text: 'Open',
        onClick: () => navigate(`/projects/${project.id}`),
        type: 'blue' as const,
    } satisfies React.ComponentProps<typeof Button>;

    // Button to delete the project, calls the onDelete function passed in as a prop
    const buttonDelete = {
        text: 'Delete',
        onClick: onDelete,
        type: 'red' as const,
    } satisfies React.ComponentProps<typeof Button>;

    // The content box for the project card, includes the editable heading, project description, and action buttons
    const projectBox: CardBox = {
        card: [
            { kind: 'editable-heading', settings: headingSettings },
            { kind: 'paragraph', text: project.description },
            { kind: 'button', settings: [buttonOpen, buttonDelete] },
        ]
    };

    return (
        <Card {...{content: [projectBox]}} />
    );
};
