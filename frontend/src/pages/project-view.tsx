/**
 * @file project-view.tsx
 * 
 * @summary Project view page component.
 * Displays the hierarchical tree view of regions, suburbs, and individual maps within a project.
 * 
 * @exports ProjectView
 */


// External dependencies
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Internal dependencies
import { useProjectView } from '@/components/project/hooks';
import { RegionTreeNode } from '@/components/project/region-tree-node';
import type { RegionNode, SuburbNode } from '@/components/map/types';
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

  // Navigation to other pages
  const navigate = useNavigate();

  // Use the custom hook to manage project view state and operations
  const {
    loading,
    project,
    regionNodes,
    expandedRegions,
    expandedSuburbs,
    editingMapId,
    editingName,
    handleCreateRegion,
    toggleRegion,
    toggleSuburb,
    startRenaming,
    cancelRenaming,
    handleRename,
    handleDelete,
    handleExportProject,
    setEditingName,
  } = useProjectView(projectId);

  // Sort region nodes alphabetically
  const sortedRegionNodes = useMemo(() => {
    // Deep copy and sort the region nodes alphabetically
    return regionNodes.map(regionNode => ({
      ...regionNode,
      suburbs: [...regionNode.suburbs]
        .sort((a, b) => a.suburb.name.localeCompare(b.suburb.name))
        .map(suburbNode => ({
          ...suburbNode,
          individuals: [...suburbNode.individuals]
            .sort((a, b) => a.name.localeCompare(b.name))
        }))
    })).sort((a, b) => a.region.name.localeCompare(b.region.name));
  }, [regionNodes]);


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
          {sortedRegionNodes.length === 0 ? (
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
            sortedRegionNodes.map((regionNode) => (
              <RegionTreeNode
                key={regionNode.region.id}
                regionNode={regionNode}
                projectId={projectId!}
                isExpanded={expandedRegions.has(regionNode.region.id!)}
                expandedSuburbs={expandedSuburbs}
                editingMapId={editingMapId}
                editingName={editingName}
                onToggleRegion={toggleRegion}
                onToggleSuburb={toggleSuburb}
                onStartRename={startRenaming}
                onCancelRename={cancelRenaming}
                onRename={handleRename}
                onDelete={handleDelete}
                onEditingNameChange={setEditingName}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};


// Export the ProjectView component as default
export default ProjectView;
