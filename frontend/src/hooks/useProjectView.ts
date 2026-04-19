/**
 * @file useProjectView.ts
 * 
 * @summary Custom hook for managing project view state and operations.
 * 
 * @exports useProjectView
 */


// External dependencies
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Internal dependencies
import { apiClient } from '@/services/api-client';

// Types
import type { MapArea, RegionNode, SuburbNode } from '@/components/map/types';


/**
 * Represents a project containing multiple maps.
 * 
 * @remarks
 * Defines the core structure of a project.
 * 
 * @property {number} [id] - Unique identifier for the project. Assigned by the backend.
 * @property {string} name - Name of the project.
 * @property {string} description - Description of the project.
 * @property {number} center_lat - Default center latitude for maps in the project.
 * @property {number} center_lon - Default center longitude for maps in the project.
 * @property {number} zoom_level - Default zoom level for maps in the project.
 * @property {string} [tile_layer] - Optional tile layer URL template.
 * @property {string} [created_at] - Timestamp of project creation.
 * @property {string} [updated_at] - Timestamp of last project update.
 */
export type Project = {
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
 * @interface UseProjectViewReturn
 * 
 * @summary Return type for useProjectView hook.
 */
type UseProjectViewReturn = {
    loading: boolean;
    project: Project | null;
    regionNodes: RegionNode[];
    expandedRegions: Set<number>;
    expandedSuburbs: Set<number>;
    editingMapId: number | null;
    editingName: string;
    loadProject: () => Promise<void>;
    handleCreateRegion: () => Promise<void>;
    toggleNodeExpansion: (mapId: number, mapType: 'region' | 'suburb') => void;
    startRenaming: (mapArea: MapArea) => void;
    cancelRenaming: () => void;
    handleRename: (mapAreaId: number) => Promise<void>;
    handleDelete: (mapArea: MapArea, type: 'region' | 'suburb' | 'individual') => Promise<void>;
    handleExportProject: () => Promise<void>;
    setEditingName: (name: string) => void;
}


/**
 * @function useProjectView
 * 
 * @summary A stateful view of the project.
 * @description Contains the main logic for the project view, as well as state management.
 *
 * @param projectId - The ID of the project to load
 * @returns Project view state and operations
 */
export const useProjectView = (
    projectId: string | undefined
): UseProjectViewReturn => {
    const navigate = useNavigate();

    // Flag for loading state
    const [loading, setLoading] = useState(true);

    // State for tracking which map (if any) is being renamed, as well as its name during editing
    const [editingName, setEditingName] = useState('');
    const [editingMapId, setEditingMapId] = useState<number | null>(null);

    // State representing the current project
    const [project, setProject] = useState<Project | null>(null);
    
    /*
     * State to manage the map hierarchy.
     * RegionNode is an array of regions, the parent level of the hierarchy.
     * Each entry contains:
     * - region: An object representing the region map area (id, name, etc.)
     * - suburbs: An array of suburb nodes that are the children of the region
     * SuburbNode contains:
     * - suburb: An object representing the suburb map area
     * - individuals: An array of individual map areas that are children of the suburb
     */
    const [regionNodes, setRegionNodes] = useState<RegionNode[]>([]);

    /*
     * State to manage which regions and suburbs are expanded in the tree view.
     * These are sets containing the IDs of regions or suburbs
     * If a region or suburb's ID is in the corresponding set, it is expanded in the tree view and its children are visible.
     */
    const [expandedRegions, setExpandedRegions] = useState<Set<number>>(new Set());
    const [expandedSuburbs, setExpandedSuburbs] = useState<Set<number>>(new Set());


    /**
     * @function loadProject
     * 
     * @summary Loads project and builds a hierarchical tree of regions, suburbs, and individual maps.
     * @remarks
     * 1. Fetches project details
     * 2. Fetches maps in the project
     * 3. Creates an array of RegionNodes, containing region maps
     * 4. Creates an array of SuburbNodes, which contain suburb maps under each region
     * 5. Creates an expansion set to store regions that have children
     * 6. Creates an expansion set to store suburbs that have children
     * 7. Updates state with the region and suburb sets (these control tree expansion, the hierarchy)
     * 
     * The 'expansion sets' are used to track which regions and suburbs are expanded in the tree view.
     * This function is memoized, and will be updated if the projectId changes (e.g. navigating to a different project).
     * 
     * @returns void
     */
    const loadProject = useCallback(async (): Promise<void> => {
        if (!projectId) return;

        try {
            // API: Get project information as well as all map areas
            const [projectData, allMapAreas] = await Promise.all([
                apiClient.getProject(parseInt(projectId)),
                apiClient.listMapAreas(parseInt(projectId)),
            ]);

            // Update the project state with the loaded project data
            setProject(projectData);

            // An array containing only the region maps
            const regionMaps = allMapAreas.filter((m) => m.area_type === 'region');


            /**
             * @constant regionNodeList
             * 
             * @summary Builds the list of RegionNodes, which is the main hierarchical structure for the project view.
             * @remarks
             * 1. Maps (iterates) through each region map.
             * 2. Extracts a list of suburbs that belong to that region, using a filter.
             * 3. Maps (iterates) through each suburb in the list
             *  - Create a SuburbNode for each suburb
             *  - Adds a list of individual maps that belong to that suburb, using another filter
             */
            const regionNodeList: RegionNode[] = regionMaps.map((region) => {
                // Get a list of all suburbs that belong to this region
                const suburbMaps = allMapAreas.filter(
                    (m) => m.area_type === 'suburb' && m.parent_id === region.id
                );

                // Build suburb nodes for the region, and include individual maps for each suburb
                const suburbNodes: SuburbNode[] = suburbMaps.map((suburb) => ({
                    suburb,
                    individuals: allMapAreas.filter(
                        (m) => m.area_type === 'individual' && m.parent_id === suburb.id
                    ),
                }));

                // Finish with an array of region nodes -> suburb nodes -> individual maps
                return {
                    region,
                    suburbs: suburbNodes,
                };
            });


            // Update the region nodes state with the list of region nodes
            setRegionNodes(regionNodeList);


            /*
             * Create sets of regions and suburbs that have children.
             * This is to track which regions and suburbs are expanded in the tree view.
             * If a region/suburb ID is listed, then it is expanded and its children are visible in the tree.
             */
            const regionsWithChildren = new Set<number>();
            const suburbsWithChildren = new Set<number>();
            
            // Loop through region nodes to find which ones have suburbs
            regionNodeList.forEach((regionNode) => {
                if (regionNode.suburbs.length > 0) {
                    regionsWithChildren.add(regionNode.region.id!);
                }

                // Loop through suburb nodes to find which ones have individual maps
                regionNode.suburbs.forEach((suburbNode) => {
                    if (suburbNode.individuals.length > 0) {
                        suburbsWithChildren.add(suburbNode.suburb.id!);
                    }
                });
            });

            // Update the states of expanded regions and suburbs.
            setExpandedRegions(regionsWithChildren);
            setExpandedSuburbs(suburbsWithChildren);

        } catch (error) {
            console.error('Failed to load project:', error);
            alert('Failed to load project.');

        } finally {
            // Clear loading state
            setLoading(false);
        }
    }, [projectId]);


    /**
     * @function handleCreateRegion
     * 
     * @summary Handles creating a new region map.
     * @returns void
     */
    const handleCreateRegion = useCallback(async (): Promise<void> => {
        if (!projectId) return;

        // Prompt for region name, and validate
        const regionName = prompt('Enter a name for the new region:');
        if (!regionName || !regionName.trim()) {
            return;
        }

        try {
            // API call to create region map
            const mapArea = await apiClient.createMapArea({
                project_id: parseInt(projectId),
                name: regionName.trim(),
                area_type: 'region',
            });

            // Reload project to reflect new region
            await loadProject();

            // Navigate to the new region map's edit page
            navigate(`/projects/${projectId}/maps/${mapArea.id}`);
        
        } catch (error) {
            console.error('Failed to create region map:', error);
            alert('Failed to create region. Please try again.');
        }
      }, [projectId, loadProject, navigate]);


    /**
     * @function toggleNodeExpansion
     * 
     * @summary Toggles the expansion state of a region or suburb in the tree view.
     * @param {number} mapId - ID of the map area to toggle.
     * @param {'region' | 'suburb'} mapType - The type of map area ('region' or 'suburb').
     */
      const toggleNodeExpansion = useCallback((
        mapId: number,
        mapType: 'region' | 'suburb'
    ): void => {
        // Create a new set, based on type, to avoid mutating state directly
        const sourceSet = mapType === 'region' ? expandedRegions : expandedSuburbs;
        const newExpanded = new Set(sourceSet);

        // Toggle the presence of the mapId in the set
        if (newExpanded.has(mapId)) {
            newExpanded.delete(mapId);
        } else {
            newExpanded.add(mapId);
        }

        // Update the appropriate state based on the map type
        if (mapType === 'region') {
            setExpandedRegions(newExpanded);
        } else {
            setExpandedSuburbs(newExpanded);
        }
    }, [expandedRegions, expandedSuburbs]);


    /**
     * @function startRenaming
     * 
     * @summary Initiates the renaming operation for a map area.
     * @remarks
     * Does not perform the rename itself, just sets state as needed.
     * 
     * @param {MapArea} mapArea - The map to rename.
     */
    const startRenaming = useCallback((
        mapArea: MapArea
    ): void => {
        /*
         * Set the editing state for the map area being renamed.
         * Set the name in the editing state to the current name of the map area.
         * These states will be used by the Input fields.
         */
        // Set the editing state with the map area's ID and current name
        setEditingMapId(mapArea.id!);
        setEditingName(mapArea.name);
    }, []);


    /**
     * @function cancelRenaming
     * 
     * @summary Cancels the renaming operation by clearing the editing state.
     * @returns void
     */
    const cancelRenaming = useCallback((): void => {
        // Clear editing state
        setEditingMapId(null);
        setEditingName('');
    }, []);


    /**
     * @function handleRename
     * 
     * @summary Handles renaming a map area (region, suburb, or individual).
     * 
     * @param {number} mapAreaId - ID of the map area to rename.
     * @returns void
     */
    const handleRename = useCallback(async (
        mapAreaId: number
    ): Promise<void> => {
        // Validate the new name (in state) is not empty
        if (!editingName.trim()) {
            cancelRenaming();
            return;
        }

        try {
            // API call to update map area name
            await apiClient.updateMapArea(mapAreaId, {
                name: editingName.trim(),
            });
            
            // Reload the project to reflect changes
            await loadProject();

            // Clear editing state
            cancelRenaming();
        } catch (error) {
            console.error('Failed to rename map area:', error);
            alert('Failed to rename. Please try again.');
        }
    }, [editingName, loadProject, cancelRenaming]);


    /**
     * @function handleDelete
     * 
     * @summary Handles deleting a map area (region, suburb, or individual).
     * @param {MapArea} mapArea - The map to delete.
     * @param {union[string]} type - The type of map area ('region', 'suburb', or 'individual').
     * @returns void
     */
    const handleDelete = useCallback(async (
        mapArea: MapArea,
    ): Promise<void> => {
        // Show confirmation dialog, return if cancelled
        if (!confirm("Are you sure you want to delete this map and any child maps? This action cannot be undone.")) {
            return;
        }

        try {
            // API call to delete the map area
            await apiClient.deleteMapArea(mapArea.id!);

            // Reload the project to reflect changes
            await loadProject();
        } catch (error) {
            console.error('Failed to delete map area:', error);
            alert('Failed to delete. Please try again.');
        }
    }, [loadProject]);


    /**
     * @function handleExportProject
     * 
     * @summary Handles exporting the current project.
     * @returns void
     */
    const handleExportProject = useCallback(async (): Promise<void> => {
        if (!projectId) return;

        try {
            // API call
            await apiClient.exportProject(parseInt(projectId));
        
        } catch (error) {
            console.error('Failed to export project:', error);
            alert('Failed to export project. Please try again.');
        }
    }, [projectId]);


    // Load project data on component mount or when projectId changes
    useEffect(() => {
        loadProject();
    }, [loadProject]);


    return {
        loading,
        project,
        regionNodes,
        expandedRegions,
        expandedSuburbs,
        editingMapId,
        editingName,
        loadProject,
        handleCreateRegion,
        toggleNodeExpansion,
        startRenaming,
        cancelRenaming,
        handleRename,
        handleDelete,
        handleExportProject,
        setEditingName,
    };
};
