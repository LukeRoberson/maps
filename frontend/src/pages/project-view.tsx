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

// Atoms
import Heading from '../components/atoms/Heading';
import Button from '../components/atoms/Button';

// Organsims
import Card from '../components/organisms/Card';
import TreeNode from '@/components/organisms/TreeNode';

// Hooks
import { useProjectView } from '@/components/project/hooks';

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
        return <div className="status-loading">Loading project...</div>;
    }

    // Render error if project not found
    if (!project) {
        return <div className="status-notfound">Project not found</div>;
    }

    const treeData = {
        editingMapId: editingMapId,
        editingName: editingName,
        setEditingName: setEditingName,
        onRename: handleRename,
        startRenaming: startRenaming,
        onCancelRename: cancelRenaming,
        onDelete: handleDelete,
    }

    // Render the project view
    return (
        // Root container
        <div className="project-view-page">


            {/* Page Header */}
            <div className="project-view-header">
                {/* Project Title and Description */}
                <div>
                    <Heading level={1} text={project.name} />
                    <p className="project-description">{project.description}</p>
                </div>

                {/* Header Actions (buttons) */}
                <div className="project-header-button">
                    {/* Export Project Button */}
                    <Button
                        text="Export Project"
                        onClick={handleExportProject}
                    />

                    {/* Back to Projects Button */}
                    <Button
                        text="Back to Projects"
                        onClick={() => navigate('/')}
                    />
                </div>
            </div>


            {/* Project Content - Tree View */}
            <div className="project-treeview">
                   
                {/* Button section, eg to add a new region */}
                <div className="treeview-button">
                    <Button 
                        text="+ Add Region"
                        type="blue"
                        onClick={handleCreateRegion}
                    />
                </div>

                {/* Tree section, or empty if there are no regions */}
                {sortedRegionNodes.length === 0 ? (
                    /* Empty State for No Regions */
                    <Card 
                        content={[{card: [{
                            kind: 'paragraph',
                            align: 'center',
                            text: 'No regions yet. Create your first region to get started!'
                        }]}]}
                    />
                ) : (
                    <>
                    {/* A div for each region; Other types are nested within */}
                    {sortedRegionNodes.map((regionNode) => (
                        <div className="node-region-align" key={regionNode.region.id}>
                            <TreeNode
                                key={regionNode.region.id}
                                label={regionNode.region.name}
                                type="region"
                                isExpanded={expandedRegions.has(regionNode.region.id!)}
                                toggleExpand={() => toggleRegion(regionNode.region.id!)}
                                childCount={regionNode.suburbs.length}
                                mapArea={regionNode.region}
                                treeData={treeData}
                            />
                            
                            {/* Suburbs, children of Region; Render only if the region is expanded */}
                            {expandedRegions.has(regionNode.region.id!) && regionNode.suburbs.map((suburbNode) => (
                                <div className="node-suburb-align" key={suburbNode.suburb.id}>
                                    <TreeNode
                                        key={suburbNode.suburb.id}
                                        label={suburbNode.suburb.name}
                                        type="suburb"
                                        isExpanded={expandedSuburbs.has(suburbNode.suburb.id!)}
                                        toggleExpand={() => toggleSuburb(suburbNode.suburb.id!)}
                                        childCount={suburbNode.individuals.length}
                                        mapArea={suburbNode.suburb}
                                        treeData={treeData}
                                    />

                                    {/* Individual maps, Children of Suburb - Render only if the suburb is expanded */}
                                    {expandedSuburbs.has(suburbNode.suburb.id!) && suburbNode.individuals.map((individual) => (
                                        <div className="node-individual-align" key={individual.id}>
                                            <TreeNode
                                                key={individual.id}
                                                label={individual.name}
                                                type="individual"
                                                isExpanded={false} // Individual maps are not expandable
                                                mapArea={individual}
                                                treeData={treeData}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))}
                    </>
                )}
            </div>
        </div>
    );
};

// Export the ProjectView component as default
export default ProjectView;
