/**
 * @file region-tree-node.tsx
 * 
 * @summary Component for displaying a region map in the tree view.
 * 
 * @exports RegionTreeNode
 */


// External dependencies
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Internal dependencies
import { SuburbTreeNode } from './suburb-tree-node';

// Types
import type { RegionTreeNodeProps } from '@/components/project/types';


/**
 * @function RegionTreeNode
 * 
 * @summary Displays a region map in the tree view with its suburbs and individual maps.
 * @remarks
 * Shows the region name, suburb count, and options to rename, edit, or delete.
 * Includes collapsible section for suburbs and their individual maps.
 * 
 * @param props - Component props
 * @returns Region map tree node component
 */
export const RegionTreeNode: React.FC<RegionTreeNodeProps> = ({
  regionNode,
  projectId,
  isExpanded,
  expandedSuburbs,
  editingMapId,
  editingName,
  onToggleRegion,
  onToggleSuburb,
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
      onRename(regionNode.region.id!);
    } else if (e.key === 'Escape') {
      // Escape cancels renaming
      onCancelRename();
    }
  };


  /**
   * Main render of the region tree node component.
   */
  return (
    // Root of the map hierarchy
    <div key={regionNode.region.id} className="tree-section">
      {/* Region Map */}
      <div className="tree-node region-node">
        <div className="tree-node-content">
          
          {/* expand/collapse button for the region*/}
          <button
            className="tree-toggle"
            onClick={() => onToggleRegion(regionNode.region.id!)}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          
          {/*
            Region icon and heading
            If in an editing state, show input for renaming the region
          */}
          <span className="tree-icon">🗺️</span>
          {editingMapId === regionNode.region.id ? (
            <input
              type="text"
              className="tree-rename-input"
              value={editingName}
              
              // Update name state on change
              onChange={(e) => onEditingNameChange(e.target.value)}

              // Handle Enter and Escape keys
              onKeyDown={handleKeyDown}

              // When clicking outside the input, submit rename
              onBlur={() => onRename(regionNode.region.id!)}
              autoFocus
            />
          ) : (
            <span
              className="tree-label"
              onDoubleClick={() => onStartRename(regionNode.region)}
            >
              {/* Region Name */}
              {regionNode.region.name}
            </span>
          )}

          {/* Suburb count label */}
          <span className="tree-count">
            {regionNode.suburbs.length} suburb{regionNode.suburbs.length !== 1 ? 's' : ''}
          </span>

          {/* Show buttons when not in editing state */}
          {editingMapId !== regionNode.region.id && (
            <>
              {/* Rename button */}
              <button
                className="btn btn-sm btn-outline"
                onClick={() => onStartRename(regionNode.region)}
              >
                Rename
              </button>

              {/* Edit Region button */}
              <button
                className="btn btn-sm btn-outline"
                onClick={() =>
                  navigate(`/projects/${projectId}/maps/${regionNode.region.id}`)
                }
              >
                Edit Region
              </button>

              {/* Delete Region button */}
              <button
                className="btn btn-sm btn-danger"
                onClick={() => onDelete(regionNode.region, 'region')}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Suburbs and their children */}
      {isExpanded && (
        <div className="tree-children">
          {/* Ternary: Show suburbs or empty message */}
          {regionNode.suburbs.length === 0 ? (
            <div className="empty-tree-message">
              <p>No suburbs yet. Open the region map to add suburbs.</p>
            </div>

          ) : (
            // Map over suburbs under this region
            regionNode.suburbs.map((suburbNode) => (
              <SuburbTreeNode
                key={suburbNode.suburb.id}
                suburbNode={suburbNode}
                projectId={projectId}
                isExpanded={expandedSuburbs.has(suburbNode.suburb.id!)}
                editingMapId={editingMapId}
                editingName={editingName}
                onToggle={onToggleSuburb}
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
