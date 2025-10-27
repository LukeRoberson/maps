import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api-client';
import type { Project, MapArea } from '@/types';
import './project-view.css';

interface SuburbNode {
  suburb: MapArea;
  individuals: MapArea[];
}

interface RegionNode {
  region: MapArea;
  suburbs: SuburbNode[];
}

const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [regionNodes, setRegionNodes] = useState<RegionNode[]>([]);
  const [expandedRegions, setExpandedRegions] = useState<Set<number>>(new Set());
  const [expandedSuburbs, setExpandedSuburbs] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [editingMapId, setEditingMapId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async (): Promise<void> => {
    if (!projectId) return;

    try {
      const [projectData, allMapAreas] = await Promise.all([
        apiClient.getProject(parseInt(projectId)),
        apiClient.listMapAreas(parseInt(projectId)),
      ]);
      setProject(projectData);

      // Build hierarchy - get all regions
      const regionMaps = allMapAreas.filter((m) => m.area_type === 'region');

      // For each region, build its suburb hierarchy
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

        return {
          region,
          suburbs: suburbNodes,
        };
      });

      setRegionNodes(regionNodeList);

      // Auto-expand regions and suburbs that have children
      const regionsToExpand = new Set<number>();
      const suburbsToExpand = new Set<number>();
      regionNodeList.forEach((regionNode) => {
        if (regionNode.suburbs.length > 0) {
          regionsToExpand.add(regionNode.region.id!);
        }
        regionNode.suburbs.forEach((suburbNode) => {
          if (suburbNode.individuals.length > 0) {
            suburbsToExpand.add(suburbNode.suburb.id!);
          }
        });
      });
      setExpandedRegions(regionsToExpand);
      setExpandedSuburbs(suburbsToExpand);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRegion = async (): Promise<void> => {
    if (!projectId) return;

    const regionName = prompt('Enter a name for the new region:');
    if (!regionName || !regionName.trim()) {
      return;
    }

    try {
      const mapArea = await apiClient.createMapArea({
        project_id: parseInt(projectId),
        name: regionName.trim(),
        area_type: 'region',
      });
      await loadProject(); // Reload to show the new region
      navigate(`/projects/${projectId}/maps/${mapArea.id}`);
    } catch (error) {
      console.error('Failed to create region map:', error);
      alert('Failed to create region. Please try again.');
    }
  };

  const toggleRegion = (regionId: number): void => {
    const newExpanded = new Set(expandedRegions);
    if (newExpanded.has(regionId)) {
      newExpanded.delete(regionId);
    } else {
      newExpanded.add(regionId);
    }
    setExpandedRegions(newExpanded);
  };

  const toggleSuburb = (suburbId: number): void => {
    const newExpanded = new Set(expandedSuburbs);
    if (newExpanded.has(suburbId)) {
      newExpanded.delete(suburbId);
    } else {
      newExpanded.add(suburbId);
    }
    setExpandedSuburbs(newExpanded);
  };

  const startRenaming = (mapArea: MapArea): void => {
    setEditingMapId(mapArea.id!);
    setEditingName(mapArea.name);
  };

  const cancelRenaming = (): void => {
    setEditingMapId(null);
    setEditingName('');
  };

  const handleRename = async (mapAreaId: number): Promise<void> => {
    if (!editingName.trim()) {
      cancelRenaming();
      return;
    }

    try {
      await apiClient.updateMapArea(mapAreaId, {
        name: editingName.trim(),
      });
      
      // Reload the project to reflect changes
      await loadProject();
      cancelRenaming();
    } catch (error) {
      console.error('Failed to rename map area:', error);
      alert('Failed to rename. Please try again.');
    }
  };

  const handleDelete = async (
    mapArea: MapArea,
    type: 'region' | 'suburb' | 'individual'
  ): Promise<void> => {
    let confirmMessage = '';
    
    if (type === 'region') {
      confirmMessage = `Are you sure you want to delete "${mapArea.name}" and all its suburbs and individual maps? This cannot be undone.`;
    } else if (type === 'suburb') {
      confirmMessage = `Are you sure you want to delete "${mapArea.name}" and all its individual maps? This cannot be undone.`;
    } else {
      confirmMessage = `Are you sure you want to delete "${mapArea.name}"? This cannot be undone.`;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await apiClient.deleteMapArea(mapArea.id!);
      // Reload the project to reflect changes
      await loadProject();
    } catch (error) {
      console.error('Failed to delete map area:', error);
      alert('Failed to delete. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading project...</div>;
  }

  if (!project) {
    return <div className="error">Project not found</div>;
  }

  return (
    <div className="project-view-page">
      <div className="page-header">
        <div>
          <h2>{project.name}</h2>
          <p className="project-description">{project.description}</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/')}>
          Back to Projects
        </button>
      </div>

      <div className="project-content">
        <div className="tree-view">
          {/* Add Region Button */}
          <div className="add-region-section">
            <button className="btn btn-primary" onClick={handleCreateRegion}>
              + Add Region
            </button>
          </div>

          {/* Regions */}
          {regionNodes.length === 0 ? (
            <div className="empty-state card">
              <h3>No Regions Yet</h3>
              <p>
                Start by creating a region map for this project. Regions are the
                top-level maps that contain suburbs and individual maps.
              </p>
            </div>
          ) : (
            regionNodes.map((regionNode) => (
              <div key={regionNode.region.id} className="tree-section">
                {/* Region Map */}
                <div className="tree-node region-node">
                  <div className="tree-node-content">
                    <button
                      className="tree-toggle"
                      onClick={() => toggleRegion(regionNode.region.id!)}
                    >
                      {expandedRegions.has(regionNode.region.id!) ? '▼' : '▶'}
                    </button>
                    <span className="tree-icon">🗺️</span>
                    {editingMapId === regionNode.region.id ? (
                      <input
                        type="text"
                        className="tree-rename-input"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRename(regionNode.region.id!);
                          } else if (e.key === 'Escape') {
                            cancelRenaming();
                          }
                        }}
                        onBlur={() => handleRename(regionNode.region.id!)}
                        autoFocus
                      />
                    ) : (
                      <span
                        className="tree-label"
                        onDoubleClick={() => startRenaming(regionNode.region)}
                      >
                        {regionNode.region.name}
                      </span>
                    )}
                    <span className="tree-count">
                      {regionNode.suburbs.length} suburb{regionNode.suburbs.length !== 1 ? 's' : ''}
                    </span>
                    {editingMapId !== regionNode.region.id && (
                      <>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => startRenaming(regionNode.region)}
                        >
                          Rename
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() =>
                            navigate(`/projects/${projectId}/maps/${regionNode.region.id}`)
                          }
                        >
                          Edit Region
                        </button>
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

                {/* Suburbs */}
                {expandedRegions.has(regionNode.region.id!) && (
                  <div className="tree-children">
                    {regionNode.suburbs.length === 0 ? (
                      <div className="empty-tree-message">
                        <p>No suburbs yet. Open the region map to add suburbs.</p>
                      </div>
                    ) : (
                      regionNode.suburbs.map((suburbNode) => (
                        <div key={suburbNode.suburb.id} className="tree-node suburb-node">
                          <div className="tree-node-content">
                            <button
                              className="tree-toggle"
                              onClick={() => toggleSuburb(suburbNode.suburb.id!)}
                            >
                              {expandedSuburbs.has(suburbNode.suburb.id!) ? '▼' : '▶'}
                            </button>
                            <span className="tree-icon">📍</span>
                            {editingMapId === suburbNode.suburb.id ? (
                              <input
                                type="text"
                                className="tree-rename-input"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleRename(suburbNode.suburb.id!);
                                  } else if (e.key === 'Escape') {
                                    cancelRenaming();
                                  }
                                }}
                                onBlur={() => handleRename(suburbNode.suburb.id!)}
                                autoFocus
                              />
                            ) : (
                              <span
                                className="tree-label"
                                onDoubleClick={() => startRenaming(suburbNode.suburb)}
                              >
                                {suburbNode.suburb.name}
                              </span>
                            )}
                            <span className="tree-count">
                              {suburbNode.individuals.length} map{suburbNode.individuals.length !== 1 ? 's' : ''}
                            </span>
                            {editingMapId !== suburbNode.suburb.id && (
                              <>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => startRenaming(suburbNode.suburb)}
                                >
                                  Rename
                                </button>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() =>
                                    navigate(`/projects/${projectId}/maps/${suburbNode.suburb.id}`)
                                  }
                                >
                                  Edit
                                </button>
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
                              {suburbNode.individuals.length === 0 ? (
                                <div className="empty-tree-message">
                                  <p>No individual maps yet. Open this suburb to add them.</p>
                                </div>
                              ) : (
                                suburbNode.individuals.map((individual) => (
                                  <div
                                    key={individual.id}
                                    className="tree-node individual-node"
                                  >
                                    <div className="tree-node-content">
                                      <span className="tree-icon">📄</span>
                                      {editingMapId === individual.id ? (
                                        <input
                                          type="text"
                                          className="tree-rename-input"
                                          value={editingName}
                                          onChange={(e) => setEditingName(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              handleRename(individual.id!);
                                            } else if (e.key === 'Escape') {
                                              cancelRenaming();
                                            }
                                          }}
                                          onBlur={() => handleRename(individual.id!)}
                                          autoFocus
                                        />
                                      ) : (
                                        <span
                                          className="tree-label"
                                          onDoubleClick={() => startRenaming(individual)}
                                        >
                                          {individual.name}
                                        </span>
                                      )}
                                      {editingMapId !== individual.id && (
                                        <>
                                          <button
                                            className="btn btn-sm btn-outline"
                                            onClick={() => startRenaming(individual)}
                                          >
                                            Rename
                                          </button>
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

export default ProjectView;
