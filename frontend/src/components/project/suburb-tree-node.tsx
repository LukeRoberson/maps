/**
 * @file suburb-tree-node.tsx
 * 
 * @summary Component for displaying a suburb map in the tree view.
 * 
 * @exports SuburbTreeNode
 */


// External dependencies
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Internal dependencies
import { IndividualTreeNode } from './individual-tree-node';

// Types
import type { SuburbTreeNodeProps } from '@/components/project/types';


/**
 * @function SuburbTreeNode
 * 
 * @summary Displays a suburb map in the tree view with its individual maps.
 * @remarks
 * Shows the suburb name, individual map count, and options to rename, edit, or delete.
 * Includes collapsible section for individual maps.
 * 
 * @param props - Component props
 * @returns Suburb map tree node component
 */
export const SuburbTreeNode: React.FC<SuburbTreeNodeProps> = ({
  suburbNode,
  projectId,
  isExpanded,
  editingMapId,
  editingName,
  onToggle,
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
      onRename(suburbNode.suburb.id!);
    } else if (e.key === 'Escape') {
      // Escape cancels renaming
      onCancelRename();
    }
  };


  /**
   * Main render of the suburb tree node component.
   */
  return (
    <div key={suburbNode.suburb.id} className="tree-node suburb-node">
      
      {/* Suburb Map */}
      <div className="tree-node-content">
        {/* expand/collapse button for the suburb */}
        <button
          className="tree-toggle"
          onClick={() => onToggle(suburbNode.suburb.id!)}
        >
          {isExpanded ? '▼' : '▶'}
        </button>

        {/*
          Suburb icon and heading
          Display name or input for renaming
        */}
        <span className="tree-icon">📍</span>
        {editingMapId === suburbNode.suburb.id ? (
          <input
            type="text"
            className="tree-rename-input"
            value={editingName}

            // Update name state on change
            onChange={(e) => onEditingNameChange(e.target.value)}

            // Handle Enter and Escape keys
            onKeyDown={handleKeyDown}

            // When clicking outside the input, submit rename
            onBlur={() => onRename(suburbNode.suburb.id!)}
            autoFocus
          />

        ) : (
          // Just the suburb name, click to open, double-click to rename
          <span
            className="tree-label"
            onClick={() => navigate(`/projects/${projectId}/maps/${suburbNode.suburb.id}`)}
            onDoubleClick={() => onStartRename(suburbNode.suburb)}
            style={{ cursor: 'pointer' }}
          >
            {suburbNode.suburb.name}
          </span>
        )}

        {/* Individual map count label */}
        <span className="tree-count">
          {suburbNode.individuals.length} map{suburbNode.individuals.length !== 1 ? 's' : ''}
        </span>

        {/* Show buttons when not in editing state */}
        {editingMapId !== suburbNode.suburb.id && (
          <>
            {/* Rename Suburb button */}
            <button
              className="btn btn-sm btn-outline"
              onClick={() => onStartRename(suburbNode.suburb)}
            >
              Rename
            </button>

            {/* Open Suburb button */}
            <button
              className="btn btn-sm btn-primary"
              onClick={() =>
                navigate(`/projects/${projectId}/maps/${suburbNode.suburb.id}`)
              }
            >
              Open
            </button>

            {/* Delete Suburb button */}
            <button
              className="btn btn-sm btn-danger"
              onClick={() => onDelete(suburbNode.suburb, 'suburb')}
            >
              Delete
            </button>
          </>
        )}
      </div>

      {/* Individual Maps */}
      {isExpanded && (
        <div className="tree-children">

          {/* Ternary: Show individual maps or empty message */}
          {suburbNode.individuals.length === 0 ? (
            <div className="empty-tree-message">
              <p>No individual maps yet. Open this suburb to add them.</p>
            </div>

          ) : (
            suburbNode.individuals.map((individual) => (
              <IndividualTreeNode
                key={individual.id}
                individual={individual}
                projectId={projectId}
                editingMapId={editingMapId}
                editingName={editingName}
                onStartRename={onStartRename}
                onCancelRename={onCancelRename}
                onRename={onRename}
                onDelete={onDelete}
                onEditingNameChange={onEditingNameChange}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
