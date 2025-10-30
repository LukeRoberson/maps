/**
 * @file project-view.tsx
 * 
 * @summary Project view page component.
 * Displays the hierarchical tree view of regions, suburbs, and individual maps within a project.
 * 
 * @exports ProjectView
 */


// External dependencies
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Internal dependencies
import { apiClient } from '@/services/api-client';
import type { Project } from '@/components/project/project-types';
import type { MapArea, RegionNode, SuburbNode } from '@/components/map/map-types';
import './project-view.css';


/**
 * @function ProjectView
 * 
 * @summary Project view page component.
 * Displays the hierarchical tree view of regions, suburbs, and individual maps within a project.
 * 
 * @returns Map information and hierarchical tree view component.
 */
const ProjectView: React.FC = () => {
  // Get the projectId from URL parameters
  const { projectId } = useParams<{ projectId: string }>();

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

  // Load project data on component mount or when projectId changes
  useEffect(() => {
    loadProject();
  }, [projectId]);


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
  const loadProject = async (): Promise<void> => {
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
  };


  /**
   * @function handleCreateRegion
   * 
   * @summary Handles creating a new region map.
   * @returns 
   */
  const handleCreateRegion = async (): Promise<void> => {
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
  };


  /**
   * @function toggleRegion
   * 
   * @summary Toggles the expansion state of a region in the tree view.
   * @param {number} regionId - ID of the region to toggle.
   */
  const toggleRegion = (regionId: number): void => {
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
  };


  /**
   * @function toggleSuburb
   * 
   * @summary Toggles the expansion state of a suburb in the tree view.
   * @param {number} suburbId - ID of the suburb to toggle.
   */
  const toggleSuburb = (suburbId: number): void => {
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
  };


  /**
   * @function startRenaming
   * 
   * @summary Initiates the renaming operation for a map area.
   * @param {MapArea} mapArea - The map to rename.
   */
  const startRenaming = (mapArea: MapArea): void => {
    // Set the editing state with the map area's ID and current name
    setEditingMapId(mapArea.id!);
    setEditingName(mapArea.name);
  };


  /**
   * @function cancelRenaming
   * 
   * @summary Cancels the renaming operation and clears editing state.
   * @returns void
   */
  const cancelRenaming = (): void => {
    // Clear editing state
    setEditingMapId(null);
    setEditingName('');
  };


  /**
   * @function handleRename
   * 
   * @summary Handles renaming a map area (region, suburb, or individual).
   * @param {number} mapAreaId - ID of the map area to rename.
   * @returns void
   */
  const handleRename = async (mapAreaId: number): Promise<void> => {
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
  };


  /**
   * @function handleDelete
   * 
   * @summary Handles deleting a map area (region, suburb, or individual).
   * @param {MapArea} mapArea - The map to delete.
   * @param {union[string]} type - The type of map area ('region', 'suburb', or 'individual').
   * @returns void
   */
  const handleDelete = async (
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
  };


  /**
   * @function handleExportProject
   * 
   * @summary Handles exporting the current project.
   * @returns void
   */
  const handleExportProject = async (): Promise<void> => {
    // Validate projectId
    if (!projectId) return;

    try {
      // API call
      await apiClient.exportProject(parseInt(projectId));
    } catch (error) {
      console.error('Failed to export project:', error);
      alert('Failed to export project. Please try again.');
    }
  };


  // Render loading state
  if (loading) {
    return <div className="loading">Loading project...</div>;
  }

  // Render error if project not found
  if (!project) {
    return <div className="error">Project not found</div>;
  }

  // Render the project view
  return (
    // Root container
    <div className="project-view-page">

      {/* Page Header */}
      <div className="page-header">
        {/* Project Title and Description */}
        <div>
          <h2>{project.name}</h2>
          <p className="project-description">{project.description}</p>
        </div>

        {/* Header Actions (buttons) */}
        <div className="header-actions">
          {/* Export Project Button */}
          <button 
            className="btn btn-secondary" 
            onClick={handleExportProject}
            title="Export project as backup file"
          >
            Export Project
          </button>

          {/* Back to Projects Button */}
          <button
            className="btn btn-outline"
            onClick={() => navigate('/')}
          >
            Back to Projects
          </button>

        </div>
      </div>


      {/* Project Content - Tree View */}
      <div className="project-content">
        <div className="tree-view">
          
          {/* Add Region Button */}
          <div className="add-region-section">
            <button className="btn btn-primary" onClick={handleCreateRegion}>
              + Add Region
            </button>
          </div>

          {/*
            Regions
            Ternary: Show regions or empty state
          */}
          {regionNodes.length === 0 ? (
            /* Empty State for No Regions */
            <div className="empty-state card">
              <h3>No Regions Yet</h3>
              <p>
                Start by creating a region map for this project. Regions are the
                top-level maps that contain suburbs and individual maps.
              </p>
            </div>

          ) : (
            // Regions hierarchy
            regionNodes.map((regionNode) => (
              // Root of the map hierarchy
              <div key={regionNode.region.id} className="tree-section">
                {/* Region Map */}
                <div className="tree-node region-node">
                  <div className="tree-node-content">
                    
                    {/* expand/collapse button for the region*/}
                    <button
                      className="tree-toggle"
                      onClick={() => toggleRegion(regionNode.region.id!)}
                    >
                      {expandedRegions.has(regionNode.region.id!) ? '▼' : '▶'}
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
                        onChange={(e) => setEditingName(e.target.value)}

                        // Handle Enter and Escape keys
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            // Enter commits the rename
                            handleRename(regionNode.region.id!);
                          } else if (e.key === 'Escape') {
                            // Escape cancels renaming
                            cancelRenaming();
                          }
                        }}

                        // When clicking outside the input, submit rename
                        onBlur={() => handleRename(regionNode.region.id!)}
                        autoFocus
                      />
                    ) : (
                      <span
                        className="tree-label"
                        onDoubleClick={() => startRenaming(regionNode.region)}
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
                          onClick={() => startRenaming(regionNode.region)}
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
                          onClick={() => handleDelete(regionNode.region, 'region')}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Suburbs and their children */}
                {expandedRegions.has(regionNode.region.id!) && (
                  <div className="tree-children">
                    {/* Ternary: Show suburbs or empty message */}
                    {regionNode.suburbs.length === 0 ? (
                      <div className="empty-tree-message">
                        <p>No suburbs yet. Open the region map to add suburbs.</p>
                      </div>

                    ) : (
                      // Map over suburbs under this region
                      regionNode.suburbs.map((suburbNode) => (
                        <div key={suburbNode.suburb.id} className="tree-node suburb-node">
                          
                          {/* Suburb Map */}
                          <div className="tree-node-content">
                            {/* expand/collapse button for the suburb */}
                            <button
                              className="tree-toggle"
                              onClick={() => toggleSuburb(suburbNode.suburb.id!)}
                            >
                              {expandedSuburbs.has(suburbNode.suburb.id!) ? '▼' : '▶'}
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
                                onChange={(e) => setEditingName(e.target.value)}

                                // Handle Enter and Escape keys
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    // Enter commits the rename
                                    handleRename(suburbNode.suburb.id!);
                                  } else if (e.key === 'Escape') {
                                    // Escape cancels renaming
                                    cancelRenaming();
                                  }
                                }}

                                // When clicking outside the input, submit rename
                                onBlur={() => handleRename(suburbNode.suburb.id!)}
                                autoFocus
                              />

                            ) : (
                              // Just the suburb name, double-click to rename
                              <span
                                className="tree-label"
                                onDoubleClick={() => startRenaming(suburbNode.suburb)}
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
                                  onClick={() => startRenaming(suburbNode.suburb)}
                                >
                                  Rename
                                </button>

                                {/* Edit Suburb button */}
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() =>
                                    navigate(`/projects/${projectId}/maps/${suburbNode.suburb.id}`)
                                  }
                                >
                                  Edit
                                </button>

                                {/* Delete Suburb button */}
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDelete(suburbNode.suburb, 'suburb')}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>

                          {/* Individual Maps */}
                          {expandedSuburbs.has(suburbNode.suburb.id!) && (
                            <div className="tree-children">

                              {/* Ternary: Show individual maps or empty message */}
                              {suburbNode.individuals.length === 0 ? (
                                <div className="empty-tree-message">
                                  <p>No individual maps yet. Open this suburb to add them.</p>
                                </div>

                              ) : (
                                suburbNode.individuals.map((individual) => (
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
                                          onChange={(e) => setEditingName(e.target.value)}

                                          // Handle Enter and Escape keys
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              // Enter commits the rename
                                              handleRename(individual.id!);
                                            } else if (e.key === 'Escape') {
                                              // Escape cancels renaming
                                              cancelRenaming();
                                            }
                                          }}

                                          // When clicking outside the input, submit rename
                                          onBlur={() => handleRename(individual.id!)}
                                          autoFocus
                                        />

                                      ) : (
                                        /* Map name, double-click to rename */
                                        <span
                                          className="tree-label"
                                          onDoubleClick={() => startRenaming(individual)}
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
                                            onClick={() => startRenaming(individual)}
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
                                            onClick={() => handleDelete(individual, 'individual')}
                                          >
                                            Delete
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};


// Export the ProjectView component as default
export default ProjectView;
