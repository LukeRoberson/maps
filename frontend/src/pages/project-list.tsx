import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api-client';
import type { Project } from '@/types';
import './project-list.css';

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    center_lat: 0,
    center_lon: 0,
    zoom_level: 13,
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async (): Promise<void> => {
    try {
      const data = await apiClient.listProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (): Promise<void> => {
    try {
      const created = await apiClient.createProject(newProject);
      setProjects([...projects, created]);
      setShowCreateModal(false);
      setNewProject({
        name: '',
        description: '',
        center_lat: 0,
        center_lon: 0,
        zoom_level: 13,
      });
      navigate(`/projects/${created.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleDeleteProject = async (
    id: number
  ): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await apiClient.deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const startRenaming = (project: Project): void => {
    setEditingProjectId(project.id!);
    setEditingName(project.name);
  };

  const cancelRenaming = (): void => {
    setEditingProjectId(null);
    setEditingName('');
  };

  const handleRename = async (projectId: number): Promise<void> => {
    if (!editingName.trim()) {
      cancelRenaming();
      return;
    }

    try {
      const updated = await apiClient.updateProject(projectId, {
        name: editingName.trim(),
      });
      setProjects(projects.map((p) => (p.id === projectId ? updated : p)));
      cancelRenaming();
    } catch (error) {
      console.error('Failed to rename project:', error);
      alert('Failed to rename project. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading projects...</div>;
  }

  return (
    <div className="project-list-page">
      <div className="page-header">
        <h2>My Projects</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state card">
          <p>No projects yet. Create your first project to get started!</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div key={project.id} className="project-card card">
              <div className="project-card-header">
                {editingProjectId === project.id ? (
                  <input
                    type="text"
                    className="rename-input"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRename(project.id!);
                      } else if (e.key === 'Escape') {
                        cancelRenaming();
                      }
                    }}
                    onBlur={() => handleRename(project.id!)}
                    autoFocus
                  />
                ) : (
                  <h3 onDoubleClick={() => startRenaming(project)}>
                    {project.name}
                  </h3>
                )}
              </div>
              <p className="project-description">{project.description}</p>
              <div className="project-card-footer">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  Open
                </button>
                {editingProjectId !== project.id && (
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => startRenaming(project)}
                  >
                    Rename
                  </button>
                )}
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteProject(project.id!)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Project</h3>
            <div className="form-group">
              <label>Project Name</label>
              <input
                type="text"
                value={newProject.name}
                onChange={(e) =>
                  setNewProject({ ...newProject, name: e.target.value })
                }
                placeholder="Enter project name"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
                placeholder="Enter project description"
                rows={3}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Center Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newProject.center_lat}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      center_lat: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Center Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newProject.center_lon}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      center_lon: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label>Zoom Level</label>
              <input
                type="number"
                min="1"
                max="18"
                value={newProject.zoom_level}
                onChange={(e) =>
                  setNewProject({
                    ...newProject,
                    zoom_level: parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateProject}
                disabled={!newProject.name}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
