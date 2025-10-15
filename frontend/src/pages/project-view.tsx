import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api-client';
import type { Project, MapHierarchy } from '@/types';
import './project-view.css';

const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [hierarchy, setHierarchy] = useState<MapHierarchy | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async (): Promise<void> => {
    if (!projectId) return;

    try {
      const [projectData, hierarchyData] = await Promise.all([
        apiClient.getProject(parseInt(projectId)),
        apiClient.getMapHierarchy(parseInt(projectId)),
      ]);
      setProject(projectData);
      setHierarchy(hierarchyData);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaster = async (): Promise<void> => {
    if (!projectId) return;

    try {
      const mapArea = await apiClient.createMapArea({
        project_id: parseInt(projectId),
        name: 'Master Map',
        area_type: 'master',
      });
      navigate(`/projects/${projectId}/maps/${mapArea.id}`);
    } catch (error) {
      console.error('Failed to create master map:', error);
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
        {!hierarchy?.master ? (
          <div className="empty-state card">
            <h3>Create Master Map</h3>
            <p>
              Start by creating the master map for this project. This will be
              the top-level map that contains all other subdivisions.
            </p>
            <button className="btn btn-primary" onClick={handleCreateMaster}>
              Create Master Map
            </button>
          </div>
        ) : (
          <div className="map-hierarchy">
            <div className="hierarchy-section">
              <h3>Master Map</h3>
              <div className="map-card card">
                <h4>{hierarchy.master.name}</h4>
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    navigate(
                      `/projects/${projectId}/maps/${hierarchy.master?.id}`
                    )
                  }
                >
                  Edit
                </button>
              </div>
            </div>

            {hierarchy.suburbs.length > 0 && (
              <div className="hierarchy-section">
                <h3>Suburbs</h3>
                <div className="maps-grid">
                  {hierarchy.suburbs.map((suburb) => (
                    <div key={suburb.id} className="map-card card">
                      <h4>{suburb.name}</h4>
                      <button
                        className="btn btn-primary"
                        onClick={() =>
                          navigate(`/projects/${projectId}/maps/${suburb.id}`)
                        }
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hierarchy.individuals.length > 0 && (
              <div className="hierarchy-section">
                <h3>Individual Maps</h3>
                <div className="maps-grid">
                  {hierarchy.individuals.map((individual) => (
                    <div key={individual.id} className="map-card card">
                      <h4>{individual.name}</h4>
                      <button
                        className="btn btn-primary"
                        onClick={() =>
                          navigate(
                            `/projects/${projectId}/maps/${individual.id}`
                          )
                        }
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectView;
