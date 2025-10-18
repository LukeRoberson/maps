import React, { useState, useEffect } from 'react';
import { apiClient } from '@/services/api-client';
import type { Layer } from '@/types';
import './layer-manager.css';

interface LayerManagerProps {
  mapAreaId: number;
  onLayersChange?: () => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  activeLayerId?: number | null;
  onActiveLayerChange?: (layerId: number | null) => void;
}

/**
 * Layer management component for creating, editing, and deleting layers.
 * 
 * Provides a UI for managing annotation layers on a map area.
 */
export const LayerManager: React.FC<LayerManagerProps> = ({
  mapAreaId,
  onLayersChange,
  showToast,
  activeLayerId,
  onActiveLayerChange,
}) => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newLayerName, setNewLayerName] = useState<string>('');
  const [editingLayerId, setEditingLayerId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(
    () => {
      loadLayers();
    },
    [mapAreaId]
  );

  const loadLayers = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const loadedLayers = await apiClient.listLayers(mapAreaId);
      setLayers(loadedLayers);
    } catch (error) {
      console.error('Error loading layers:', error);
      showToast?.('Failed to load layers', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLayer = async (): Promise<void> => {
    if (!newLayerName.trim()) {
      showToast?.('Please enter a layer name', 'warning');
      return;
    }

    try {
      await apiClient.createLayer({
        map_area_id: mapAreaId,
        name: newLayerName.trim(),
        layer_type: 'annotation',
        visible: true,
        z_index: layers.length,
        is_editable: true,
        config: {},
      });

      showToast?.(`Layer "${newLayerName}" created`, 'success');
      setNewLayerName('');
      setIsCreating(false);
      await loadLayers();
      onLayersChange?.();
    } catch (error) {
      console.error('Error creating layer:', error);
      showToast?.('Failed to create layer', 'error');
    }
  };

  const handleStartEdit = (
    layer: Layer
  ): void => {
    if (!layer.is_editable) {
      showToast?.('This layer cannot be edited (inherited from parent)', 'warning');
      return;
    }
    setEditingLayerId(layer.id!);
    setEditingName(layer.name);
  };

  const handleSaveEdit = async (
    layerId: number
  ): Promise<void> => {
    if (!editingName.trim()) {
      showToast?.('Please enter a layer name', 'warning');
      return;
    }

    try {
      await apiClient.updateLayer(layerId, {
        name: editingName.trim(),
      });

      showToast?.('Layer name updated', 'success');
      setEditingLayerId(null);
      setEditingName('');
      await loadLayers();
      onLayersChange?.();
    } catch (error) {
      console.error('Error updating layer:', error);
      showToast?.('Failed to update layer', 'error');
    }
  };

  const handleCancelEdit = (): void => {
    setEditingLayerId(null);
    setEditingName('');
  };

  const handleDeleteLayer = async (
    layer: Layer
  ): Promise<void> => {
    if (!layer.is_editable) {
      showToast?.('This layer cannot be deleted (inherited from parent)', 'warning');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete layer "${layer.name}"? This will also delete all annotations in this layer.`)) {
      return;
    }

    try {
      await apiClient.deleteLayer(layer.id!);
      showToast?.(`Layer "${layer.name}" deleted`, 'success');
      await loadLayers();
      onLayersChange?.();
    } catch (error) {
      console.error('Error deleting layer:', error);
      showToast?.('Failed to delete layer', 'error');
    }
  };

  const handleToggleVisibility = async (
    layer: Layer
  ): Promise<void> => {
    try {
      await apiClient.updateLayer(layer.id!, {
        visible: !layer.visible,
      });

      await loadLayers();
      onLayersChange?.();
    } catch (error) {
      console.error('Error toggling layer visibility:', error);
      showToast?.('Failed to toggle layer visibility', 'error');
    }
  };

  const editableLayers = layers.filter(l => l.is_editable);
  const inheritedLayers = layers.filter(l => !l.is_editable);

  return (
    <div className="layer-manager">
      <div
        className="layer-manager-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3>Layers</h3>
        <span className="toggle-icon">
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {isExpanded && (
        <div className="layer-manager-content">
          {isLoading ? (
            <div className="loading">Loading layers...</div>
          ) : (
            <>
              {editableLayers.length === 0 && !isCreating && (
                <div className="no-layers">
                  No layers yet. Create one to get started.
                </div>
              )}

              {editableLayers.length > 0 && (
                <div className="layers-section">
                  <h4>Map Layers</h4>
                  <ul className="layer-list">
                    {editableLayers.map((layer) => (
                      <li key={layer.id} className="layer-item">
                        {editingLayerId === layer.id ? (
                          <div className="layer-edit-form">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveEdit(layer.id!);
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                              className="layer-name-input"
                              autoFocus
                            />
                            <div className="layer-edit-actions">
                              <button
                                onClick={() => handleSaveEdit(layer.id!)}
                                className="btn-save"
                                title="Save"
                              >
                                ✓
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="btn-cancel"
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="layer-info">
                              <button
                                onClick={() => onActiveLayerChange?.(layer.id!)}
                                className={`btn-select ${activeLayerId === layer.id ? 'active' : ''}`}
                                title={activeLayerId === layer.id ? 'Active layer' : 'Set as active layer'}
                              >
                                {activeLayerId === layer.id ? '●' : '○'}
                              </button>
                              <button
                                onClick={() => handleToggleVisibility(layer)}
                                className={`btn-visibility ${layer.visible ? 'visible' : 'hidden'}`}
                                title={layer.visible ? 'Hide layer' : 'Show layer'}
                              >
                                {layer.visible ? '👁' : '👁‍🗨'}
                              </button>
                              <span 
                                className={`layer-name ${activeLayerId === layer.id ? 'active' : ''}`}
                                onClick={() => onActiveLayerChange?.(layer.id!)}
                                style={{ cursor: 'pointer' }}
                              >
                                {layer.name}
                              </span>
                            </div>
                            <div className="layer-actions">
                              <button
                                onClick={() => handleStartEdit(layer)}
                                className="btn-edit"
                                title="Edit name"
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => handleDeleteLayer(layer)}
                                className="btn-delete"
                                title="Delete layer"
                              >
                                🗑
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {inheritedLayers.length > 0 && (
                <div className="layers-section">
                  <h4>Inherited Layers</h4>
                  <ul className="layer-list">
                    {inheritedLayers.map((layer) => (
                      <li key={layer.id} className="layer-item inherited">
                        <div className="layer-info">
                          <button
                            onClick={() => handleToggleVisibility(layer)}
                            className={`btn-visibility ${layer.visible ? 'visible' : 'hidden'}`}
                            title={layer.visible ? 'Hide layer' : 'Show layer'}
                          >
                            {layer.visible ? '👁' : '👁‍🗨'}
                          </button>
                          <span className="layer-name">{layer.name}</span>
                          <span className="inherited-badge">inherited</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isCreating ? (
                <div className="layer-create-form">
                  <input
                    type="text"
                    value={newLayerName}
                    onChange={(e) => setNewLayerName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateLayer();
                      } else if (e.key === 'Escape') {
                        setIsCreating(false);
                        setNewLayerName('');
                      }
                    }}
                    placeholder="Enter layer name..."
                    className="layer-name-input"
                    autoFocus
                  />
                  <div className="layer-create-actions">
                    <button
                      onClick={handleCreateLayer}
                      className="btn-save"
                      title="Create"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setNewLayerName('');
                      }}
                      className="btn-cancel"
                      title="Cancel"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="btn-add-layer"
                >
                  + Add Layer
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
