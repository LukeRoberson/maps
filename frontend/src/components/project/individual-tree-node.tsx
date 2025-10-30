/**
 * @file individual-tree-node.tsx
 * 
 * @summary Component for displaying an individual map in the tree view.
 * 
 * @exports IndividualTreeNode
 */


// External dependencies
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Types
import type { IndividualTreeNodeProps } from '@/components/project/types';


/**
 * @function IndividualTreeNode
 * 
 * @summary Displays an individual map in the tree view.
 * @remarks
 * Shows the map name with options to rename, open, or delete.
 * 
 * @param props - Component props
 * @returns Individual map tree node component
 */
export const IndividualTreeNode: React.FC<IndividualTreeNodeProps> = ({
  individual,
  projectId,
  editingMapId,
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
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (e.key === 'Enter') {
      // Enter commits the rename
      onRename(individual.id!);
    } else if (e.key === 'Escape') {
      // Escape cancels renaming
      onCancelRename();
    }
  };


  /**
   * Main render of the individual tree node component.
   */
  return (
    /* Individual Map Node */
    <div
      key={individual.id}
      className="tree-node individual-node"
    >
      <div className="tree-node-content">
        
        {/* Map icon and name or rename input */}
        <span className="tree-icon">📄</span>
        {editingMapId === individual.id ? (
          <input
            type="text"
            className="tree-rename-input"
            value={editingName}

            // Update name state on change
            onChange={(e) => onEditingNameChange(e.target.value)}

            // Handle Enter and Escape keys
            onKeyDown={handleKeyDown}

            // When clicking outside the input, submit rename
            onBlur={() => onRename(individual.id!)}
            autoFocus
          />

        ) : (
          /* Map name, double-click to rename */
          <span
            className="tree-label"
            onDoubleClick={() => onStartRename(individual)}
          >
            {individual.name}
          </span>
        )}

        {/* Show buttons when not in editing state */}
        {editingMapId !== individual.id && (
          <>
            {/* Rename Map button */}
            <button
              className="btn btn-sm btn-outline"
              onClick={() => onStartRename(individual)}
            >
              Rename
            </button>

            {/* Open button */}
            <button
              className="btn btn-sm btn-primary"
              onClick={() =>
                navigate(
                  `/projects/${projectId}/maps/${individual.id}`
                )
              }
            >
              Open
            </button>

            {/* Delete button */}
            <button
              className="btn btn-sm btn-danger"
              onClick={() => onDelete(individual, 'individual')}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};
