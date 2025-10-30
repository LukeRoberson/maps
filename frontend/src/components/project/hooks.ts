/**
 * @file project-hooks.ts
 * 
 * @summary Custom hooks for managing projects and operations
 * 
 * @exports useProjectList
 * @exports useProjectView
 */


// External dependencies
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Internal dependencies
import { apiClient } from '@/services/api-client';

// Types
import type { Project, UseProjectListReturn, UseProjectViewReturn } from '@/components/project/types';
import type { MapArea, RegionNode, SuburbNode } from '@/components/map/types';


/**
 * @function useProjectList
 * 
 * @summary Custom hook for managing project list state and operations.
 * 
 * @returns Project list state and operations
 */
export const useProjectList = (): UseProjectListReturn => {
    // State variable containing the list of projects.
    const [projects, setProjects] = useState<Project[]>([]);

    // Flags for loading and importing states.
    const [loading, setLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);

    // Navigation hook from React Router; Allows programmatic navigation
    const navigate = useNavigate();


    /**
     * @function loadProjects
     * 
     * @summary Loads the list of projects from the backend API.
     * @remarks
     * Updates the projects state variable and loading state.
     * 
     * @returns void
     */
    const loadProjects = useCallback(async (): Promise<void> => {
        try {
            // Fetch projects from API
            const data = await apiClient.listProjects();

            // Update state with fetched projects
            setProjects(data);
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setLoading(false);
        }
    }, []);


    /**
     * @function createProject
     * 
     * @summary Creates a new project via the backend API.
     * @remarks
     * On success, adds the new project to the projects state and navigates to its page.
     * 
     * @param projectData - Data for the new project (excluding ID)
     * @returns void
     */
    const createProject = useCallback(async (
        projectData: Omit<Project, 'id'>
    ): Promise<void> => {
        try {
            // Create project via API
            const created = await apiClient.createProject(projectData);

            // Update state and navigate to new project
            setProjects((prev) => [...prev, created]);
            navigate(`/projects/${created.id}`);
        } catch (error) {
            console.error('Failed to create project:', error);
            throw error;
        }
    }, [navigate]);


    /**
     * @function deleteProject
     * 
     * @summary Deletes a project by ID via the backend API.
     * @remarks
     * On success, removes the project from the projects state.
     *
     * @param id - ID of the project to delete
     * @returns void
     */
    const deleteProject = useCallback(async (
        id: number
    ): Promise<void> => {
        // Confirm deletion with the user
        if (!window.confirm('Are you sure you want to delete this project?')) {
            return;
        }

        try {
            // Delete project via API
            await apiClient.deleteProject(id);
            setProjects((prev) => prev.filter((p) => p.id !== id));
        } catch (error) {
            console.error('Failed to delete project:', error);
            throw error;
        }
    }, []);


    /**
     * @function renameProject
     * 
     * @summary Renames a project via the backend API.
     * @remarks
     * On success, updates the project's name in the projects state.
     *
     * @param id - ID of the project to rename
     * @param name - New name for the project
     * @returns void
     */
    const renameProject = useCallback(async (
        id: number,
        name: string
    ): Promise<void> => {
        try {
            // Rename project via API
            const updated = await apiClient.updateProject(id, { name });

            // Update state with renamed project
            setProjects((prev) =>
                prev.map((p) => (p.id === id ? updated : p))
            );
        } catch (error) {
            console.error('Failed to rename project:', error);
            throw error;
        }
    }, []);


    /**
     * @function importProject
     * 
     * @summary Imports a project from file content via the backend API.
     * @remarks
     * On success, adds the imported project to the projects state and navigates to its page.
     *
     * @param fileContent - Content of the project file to import
     * @returns void
     */
    const importProject = useCallback(async (
        fileContent: string
    ): Promise<void> => {
        // Set importing state
        setIsImporting(true);

        try {
            // Import project via API
            const importData = JSON.parse(fileContent);
            const importedProject = await apiClient.importProject(importData);

            // Update state and navigate to imported project
            await loadProjects();
            navigate(`/projects/${importedProject.id}`);
        } catch (error) {
            console.error('Failed to import project:', error);
            throw error;
        } finally {
            // Reset importing state
            setIsImporting(false);
        }
    }, [loadProjects, navigate]);

    // Load projects on component mount only (so it won't reload on every render)
    // This is a React approach to add efficiency
    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    /**
     * Return the project list state and operations.
     */
    return {
        projects,
        loading,
        isImporting,
        loadProjects,
        createProject,
        deleteProject,
        renameProject,
        importProject,
    };
};


/**
 * @function useProjectView
 * 
 * @summary Custom hook for managing project view state and operations.
 * 
 * @param projectId - The ID of the project to load
 * @returns Project view state and operations
 */
export const useProjectView = (
  projectId: string | undefined
): UseProjectViewReturn => {
  // Flag for loading state
  const [loading, setLoading] = useState(true);

  // State for the current project
  const [project, setProject] = useState<Project | null>(null);
  
  // State to manage the map hierarchy
  const [regionNodes, setRegionNodes] = useState<RegionNode[]>([]);
  const [expandedRegions, setExpandedRegions] = useState<Set<number>>(new Set());
  const [expandedSuburbs, setExpandedSuburbs] = useState<Set<number>>(new Set());

  // State for tracking which map (if any) is being renamed
  const [editingName, setEditingName] = useState('');
  const [editingMapId, setEditingMapId] = useState<number | null>(null);

  // Navigation to other pages
  const navigate = useNavigate();


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
   * 
   * @returns void
   */
  const loadProject = useCallback(async (): Promise<void> => {
    // Validate projectId
    if (!projectId) return;

    try {
      // API calls to get project and all map areas
      const [projectData, allMapAreas] = await Promise.all([
        apiClient.getProject(parseInt(projectId)),
        apiClient.listMapAreas(parseInt(projectId)),
      ]);

      // Update the project state with the loaded project data
      setProject(projectData);


      /**
       * @constant regionMaps
       * 
       * @summary Filters all map areas to get only region type maps.
       */
      const regionMaps = allMapAreas.filter((m) => m.area_type === 'region');


      /**
       * @function regionNodeList
       * 
       * @summary Builds the list of RegionNodes with their suburbs and individual maps.
       * @returns List of RegionNodes.
       */
      const regionNodeList: RegionNode[] = regionMaps.map((region) => {
        // Get suburbs that belong to this region
        const suburbMaps = allMapAreas.filter(
          (m) => m.area_type === 'suburb' && m.parent_id === region.id
        );

        // For each suburb, get its individual maps
        const suburbNodes: SuburbNode[] = suburbMaps.map((suburb) => ({
          suburb,
          individuals: allMapAreas.filter(
            (m) => m.area_type === 'individual' && m.parent_id === suburb.id
          ),
        }));

        // Return a list of region nodes with their suburbs
        return {
          region,
          suburbs: suburbNodes,
        };
      });


      // Update the region nodes state with the list of region nodes
      setRegionNodes(regionNodeList);

      // Create sets of regions and suburbs that have children
      // These form the hierarchy expansion state
      const regionsToExpand = new Set<number>();
      const suburbsToExpand = new Set<number>();
      
      // Loop through region nodes to get child maps
      regionNodeList.forEach((regionNode) => {
        // If there are suburbs in a region, add this region to expand set
        if (regionNode.suburbs.length > 0) {
          regionsToExpand.add(regionNode.region.id!);
        }

        // If there are individual maps in a suburb, add this suburb to expand set
        regionNode.suburbs.forEach((suburbNode) => {
          if (suburbNode.individuals.length > 0) {
            suburbsToExpand.add(suburbNode.suburb.id!);
          }
        });
      });

      // Update the expansion states
      setExpandedRegions(regionsToExpand);
      setExpandedSuburbs(suburbsToExpand);

    } catch (error) {
      console.error('Failed to load project:', error);
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
    // Validate projectId
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
   * @function toggleRegion
   * 
   * @summary Toggles the expansion state of a region in the tree view.
   * @param {number} regionId - ID of the region to toggle.
   */
  const toggleRegion = useCallback((
    regionId: number
  ): void => {
    // Create a new set to avoid mutating state directly
    const newExpanded = new Set(expandedRegions);

    // Handle toggle logic
    if (newExpanded.has(regionId)) {
      // If already expanded, remove from set to collapse
      newExpanded.delete(regionId);
    } else {
      // If collapsed, add to set to expand
      newExpanded.add(regionId);
    }

    // Update the expansion state
    setExpandedRegions(newExpanded);
  }, [expandedRegions]);


  /**
   * @function toggleSuburb
   * 
   * @summary Toggles the expansion state of a suburb in the tree view.
   * @param {number} suburbId - ID of the suburb to toggle.
   */
  const toggleSuburb = useCallback((
    suburbId: number
  ): void => {
    // Create a new set to avoid mutating state directly
    const newExpanded = new Set(expandedSuburbs);

    // Handle toggle logic
    if (newExpanded.has(suburbId)) {
      // If already expanded, remove from set to collapse
      newExpanded.delete(suburbId);
    } else {
      // If collapsed, add to set to expand
      newExpanded.add(suburbId);
    }

    // Update the expansion state
    setExpandedSuburbs(newExpanded);
  }, [expandedSuburbs]);


  /**
   * @function startRenaming
   * 
   * @summary Initiates the renaming operation for a map area.
   * @param {MapArea} mapArea - The map to rename.
   */
  const startRenaming = useCallback((
    mapArea: MapArea
  ): void => {
    // Set the editing state with the map area's ID and current name
    setEditingMapId(mapArea.id!);
    setEditingName(mapArea.name);
  }, []);


  /**
   * @function cancelRenaming
   * 
   * @summary Cancels the renaming operation and clears editing state.
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
   * @param {number} mapAreaId - ID of the map area to rename.
   * @returns void
   */
  const handleRename = useCallback(async (
    mapAreaId: number
  ): Promise<void> => {
    // Validate the new name is not empty
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
    type: 'region' | 'suburb' | 'individual'
  ): Promise<void> => {
    // Customize confirmation message based on map area type
    let confirmMessage = '';
    if (type === 'region') {
      confirmMessage = `Are you sure you want to delete "${mapArea.name}" and all its suburbs and individual maps? This cannot be undone.`;
    } else if (type === 'suburb') {
      confirmMessage = `Are you sure you want to delete "${mapArea.name}" and all its individual maps? This cannot be undone.`;
    } else {
      confirmMessage = `Are you sure you want to delete "${mapArea.name}"? This cannot be undone.`;
    }

    // Show confirmation dialog, return if cancelled
    if (!confirm(confirmMessage)) {
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
    // Validate projectId
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
    toggleRegion,
    toggleSuburb,
    startRenaming,
    cancelRenaming,
    handleRename,
    handleDelete,
    handleExportProject,
    setEditingName,
  };
};
