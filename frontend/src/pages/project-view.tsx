import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api-client';
import type { Project, MapArea } from '@/types';
import './project-view.css';

interface SuburbNode {
  suburb: MapArea;
  individuals: MapArea[];
}

const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [region, setRegion] = useState<MapArea | null>(null);
  const [suburbNodes, setSuburbNodes] = useState<SuburbNode[]>([]);
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

      // Build hierarchy
      const regionMap = allMapAreas.find((m) => m.area_type === 'region');
      setRegion(regionMap || null);

      if (regionMap) {
        // Get suburbs that belong to region
        const suburbMaps = allMapAreas.filter(
          (m) => m.area_type === 'suburb' && m.parent_id === regionMap.id
        );

        // For each suburb, get its individual maps
        const nodes: SuburbNode[] = suburbMaps.map((suburb) => ({
          suburb,
          individuals: allMapAreas.filter(
            (m) => m.area_type === 'individual' && m.parent_id === suburb.id
          ),
        }));

        setSuburbNodes(nodes);
        
        // Auto-expand suburbs that have individual maps
        const toExpand = new Set<number>();
        nodes.forEach(node => {
          if (node.individuals.length > 0) {
            toExpand.add(node.suburb.id!);
          }
        });
        setExpandedSuburbs(toExpand);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRegion = async (): Promise<void> => {
    if (!projectId) return;

    try {
      const mapArea = await apiClient.createMapArea({
        project_id: parseInt(projectId),
        name: 'Region Map',
        area_type: 'region',
      });
      navigate(`/projects/${projectId}/maps/${mapArea.id}`);
    } catch (error) {
      console.error('Failed to create region map:', error);
    }
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
    type: 'suburb' | 'individual'
  ): Promise<void> => {
    const confirmMessage =
      type === 'suburb'
        ? `Are you sure you want to delete "${mapArea.name}" and all its individual maps? This cannot be undone.`
        : `Are you sure you want to delete "${mapArea.name}"? This cannot be undone.`;

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
        {!region ? (
          <div className="empty-state card">
            <h3>Create Region Map</h3>
            <p>
              Start by creating the region map for this project. This will be
              the top-level map that contains all other subdivisions.
            </p>
            <button className="btn btn-primary" onClick={handleCreateRegion}>
              Create Region Map
            </button>
          </div>
        ) : (
          <div className="tree-view">
            {/* Region Map */}
            <div className="tree-node region-node">
              <div className="tree-node-content">
                <span className="tree-icon">🗺️</span>
                {editingMapId === region.id ? (
                  <input
                    type="text"
                    className="tree-rename-input"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRename(region.id!);
                      } else if (e.key === 'Escape') {
                        cancelRenaming();
                      }
                    }}
                    onBlur={() => handleRename(region.id!)}
                    autoFocus
                  />
                ) : (
                  <span
                    className="tree-label"
                    onDoubleClick={() => startRenaming(region)}
                  >
                    {region.name}
                  </span>
                )}
                {editingMapId !== region.id && (
                  <>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => startRenaming(region)}
                    >
                      Rename
                    </button>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => navigate(`/projects/${projectId}/maps/${region.id}`)}
                    >
                      Edit Region
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Suburbs */}
            {suburbNodes.length === 0 ? (
              <div className="empty-tree-message">
                <p>No suburbs yet. Open the region map to add suburbs.</p>
              </div>
            ) : (
              <div className="tree-children">
                {suburbNodes.map((node) => (
                  <div key={node.suburb.id} className="tree-node suburb-node">
                    <div className="tree-node-content">
                      <button
                        className="tree-toggle"
                        onClick={() => toggleSuburb(node.suburb.id!)}
                      >
                        {expandedSuburbs.has(node.suburb.id!)
                          ? '▼'
                          : '▶'}
                      </button>
                      <span className="tree-icon">📍</span>
                      {editingMapId === node.suburb.id ? (
                        <input
                          type="text"
                          className="tree-rename-input"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRename(node.suburb.id!);
                            } else if (e.key === 'Escape') {
                              cancelRenaming();
                            }
                          }}
                          onBlur={() => handleRename(node.suburb.id!)}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="tree-label"
                          onDoubleClick={() => startRenaming(node.suburb)}
                        >
                          {node.suburb.name}
                        </span>
                      )}
                      <span className="tree-count">
                        {node.individuals.length} map{node.individuals.length !== 1 ? 's' : ''}
                      </span>
                      {editingMapId !== node.suburb.id && (
                        <>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => startRenaming(node.suburb)}
                          >
                            Rename
                          </button>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() =>
                              navigate(`/projects/${projectId}/maps/${node.suburb.id}`)
                            }
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(node.suburb, 'suburb')}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>

                    {/* Individual Maps */}
                    {expandedSuburbs.has(node.suburb.id!) && (
                      <div className="tree-children">
                        {node.individuals.length === 0 ? (
                          <div className="empty-tree-message">
                            <p>No individual maps yet. Open this suburb to add them.</p>
                          </div>
                        ) : (
                          node.individuals.map((individual) => (
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectView;
