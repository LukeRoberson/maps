/**
 * @file TreeNode.tsx
 * 
 * @summary TreeNode component.
 *  A reusable tree node component.
 * 
 * @exports TreeNode - The TreeNode component itself.
 */


import { useNavigate, useParams } from 'react-router-dom';

// Atoms
import Button from '../atoms/Button';

// Types
import type { MapArea } from '../map/types';

import './TreeNode.css';


/**
 * @template TreeData
 * @summary Data passed to TreeNode for managing editing and actions.
 * @remark
 * Contains helper functions, as well as state for the currently editing map and its name.
 * 
 * @property {number | null} editingMapId - The ID of the map currently being edited, or null if none.
 * @property {string} editingName - The current name being edited for the map.
 * @property {function(string): void} setEditingName - Function to update the editing name state.
 * @property {function(number): void} onRename - Function to call when renaming a map, takes the map ID.
 * @property {function(MapArea): void} startRenaming - Function to call to start renaming a map, takes the MapArea object.
 * @property {function(): void} onCancelRename - Function to call to cancel the renaming process.
 * @property {function(MapArea, 'region' | 'suburb' | 'individual'): void} onDelete - Function to call to delete a map area, takes the MapArea and its type.
 */
type TreeData = {
    editingMapId: number | null;
    editingName: string;
    setEditingName: (name: string) => void;
    onRename: (mapID: number) => void;
    startRenaming: (mapArea: MapArea) => void;
    onCancelRename: () => void;
    onDelete: (mapArea: MapArea, type: 'region' | 'suburb' | 'individual') => void;
}


/**
 * @template TreeNodeProps
 * @summary Props for the TreeNode component.
 * 
 * @property {string} label - The display label for the tree node.
 * @property {'region' | 'suburb' | 'individual'} type - The type of the node, which determines its styling and behavior.
 * @property {boolean} isExpanded - Whether the node is currently expanded to show its children.
 * @property {function(): void} [toggleExpand] - Optional function to toggle the expanded state of the node, only applicable for region and suburb types.
 * @property {number} [childCount] - Optional count of child nodes, used for display purposes for region and suburb types.
 * @property {MapArea} mapArea - The MapArea object associated with this node, used for navigation and actions.
 * @property {TreeData} treeData - The TreeData object containing state and functions for managing editing and actions on the tree nodes.
 */
type TreeNodeProps = {
    label: string;
    type: 'region' | 'suburb' | 'individual';
    isExpanded: boolean;
    toggleExpand?: () => void;
    childCount?: number;
    mapArea: MapArea;
    treeData: TreeData;
};


/**
 * @function TreeNode
 * @summary A node in the project tree view, representing a map area
 * @remarks
 * This components works for all three levels of the tree (region, suburb, individual).
 * Classes and icons are adjusted based on the type of node.
 *
 * @param {label} props.label - The display label for the tree node.
 * @param {type} props.type - The type of the node, which determines its styling and behavior.
 * @param {isExpanded} props.isExpanded - Whether the node is currently expanded to show its children.
 * @param {toggleExpand} props.toggleExpand - Optional function to toggle the expanded state of the node, only applicable for region and suburb types.
 * @param {childCount} props.childCount - Optional count of child nodes, used for display purposes for region and suburb types.
 * @param {mapArea} props.mapArea - The MapArea object associated with this node, used for navigation and actions.
 * @param {treeData} props.treeData - The TreeData object containing state and functions for managing editing and actions on the tree nodes.
 * 
 * @returns {JSX.Element} The rendered tree node component.
 */
const TreeNode: React.FC<TreeNodeProps> = ({ label, type, isExpanded, toggleExpand, childCount = 0, mapArea, treeData }) => {
    const navigate = useNavigate();
    const projectId = useParams().projectId ? useParams().projectId : '0';
    
    // Tune settings based on the type of node (region, suburb, individual)
    let nodeStyle: string = '';
    let iconType: string = '';
    let childMaps: string = '';
    
    if (type === 'region') {
        nodeStyle += 'node-region';
        iconType = '🗺️';
        childMaps = childCount + ' suburb' + (childCount > 1 ? 's' : '');
    } else if (type === 'suburb') {
        nodeStyle += 'node-suburb';
        iconType = '📍';
        childMaps = childCount + ' map' + (childCount > 1 ? 's' : '');
    } else {
        nodeStyle += 'node-map';
        iconType = '📄';
    }
    
    
    /**
     * @function handleKeyDown
     * @summary Handles key down events in the rename input.
     * @remarks
     * Submits rename on Enter, cancels on Escape.
     *
     * @param {React.KeyboardEvent<HTMLInputElement>} e - The keyboard event.
     * @returns {void}
     */
    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>
    ): void => {
        if (e.key === 'Enter') {
            treeData.onRename(mapArea.id!);
        } else if (e.key === 'Escape') {
            treeData.onCancelRename();
        }
    };


    return (
        // The box around the node
        <div className="node-box">
            
            {/* The node itself; Region, Suburb, or Map */}
            <div className={nodeStyle}>

                {/*
                  * Contents of the node
                  * - Expand/collapse button for regions and suburbs
                  * - Icon based on type
                  * - Map label or an input for renaming
                  * - Child count 'badge' for regions and suburbs
                  * - Action buttons for rename and delete
                */}
                <div className="node-content">
                    {/* expand/collapse button, region and suburb only */}
                    {toggleExpand && (
                        <Button
                            text={isExpanded ? '▼' : '▶'}
                            type="icon"
                            size="small"
                            onClick={toggleExpand}
                        />
                    )}

                    {/* The node's icon */}
                    <span className="node-icon">{iconType}</span>
                    
                    {/* The label or rename input */}
                    {treeData.editingMapId === mapArea?.id ? (
                        /* Input for renaming, shown only when this node is being edited */
                        <input
                            type="text"
                            className="node-rename"
                            value={treeData.editingName}
                            onKeyDown={handleKeyDown}

                            // Update the name state on change
                            onChange={(e) => treeData.setEditingName(e.target.value)}
                            
                            // When clicking outside the input, submit rename
                            onBlur={() => treeData.onRename(mapArea.id!)}
                            autoFocus
                        />
                    ) : (
                        /* The node's label; Clicking it navigates to the map's page */
                        <span
                            className="node-label"
                            onClick={() => navigate(`/projects/${projectId}/maps/${mapArea.id}`)}
                        >
                            {label}
                        </span>
                    )}

                    {/* Show child count for regions and suburbs if they have children */}
                    {childCount > 0 && <span className="node-child-badge">{childMaps}</span>}

                    {/* Action buttons - Only show if this node isn't currently being renamed */}
                    {treeData.editingMapId !== mapArea?.id && (
                        <>
                            {/* Rename Map button */}
                            <Button
                                text="Rename"
                                type="blue"
                                size="small"
                                onClick={() => treeData.startRenaming(mapArea)}
                            />

                            {/* Delete button */}
                            <Button
                                text="Delete"
                                type="red"
                                size="small"
                                onClick={() => treeData.onDelete(mapArea, type)}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TreeNode;
