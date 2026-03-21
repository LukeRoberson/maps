import React, { useState, useEffect } from 'react';
import { apiClient } from '@/services/api-client';
import type { Layer } from '@/components/layer/types';
import {
  DEFAULT_ANNOTATION_COLOR,
  DEFAULT_LINE_THICKNESS,
  COLOR_OPTIONS,
  THICKNESS_OPTIONS,
} from '@/constants/drawing';
import './layer-manager.css';

interface LayerManagerProps {
  mapAreaId: number;
  areaType?: 'region' | 'suburb' | 'individual';
  onLayersChange?: () => void;
  onSyntheticLayerVisibilityChange?: (layerId: number, visible: boolean) => void;
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
  areaType,
  onLayersChange,
  onSyntheticLayerVisibilityChange,
  showToast,
  activeLayerId,
  onActiveLayerChange,
}) => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newLayerName, setNewLayerName] = useState<string>('');
  const [newLayerColor, setNewLayerColor] = useState<string>(DEFAULT_ANNOTATION_COLOR);
  const [editingLayerId, setEditingLayerId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [editingColor, setEditingColor] = useState<string>(DEFAULT_ANNOTATION_COLOR);
  const [editingThickness, setEditingThickness] = useState<number>(DEFAULT_LINE_THICKNESS);
  const [newLayerThickness, setNewLayerThickness] = useState<number>(DEFAULT_LINE_THICKNESS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const colorOptions = COLOR_OPTIONS;
  const thicknessOptions = THICKNESS_OPTIONS;

  useEffect(
    () => {
      loadLayers();
    },
    [mapAreaId, areaType]
  );

  const loadLayers = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const loadedLayers = await apiClient.listLayers(mapAreaId);
      
      // Add synthetic "Peer Maps" layer for individual maps
      let layersToSet = loadedLayers;
      if (areaType === 'individual') {
        // Preserve current synthetic visibility instead of resetting on reload.
        const existingPeerMapsLayer = layers.find(
          l => l.id === -1 && l.map_area_id === mapAreaId
        );

        const peerMapsLayer: Layer = {
          id: -1, // Synthetic ID for peer maps layer
          map_area_id: mapAreaId,
          name: 'Peer Maps',
          layer_type: 'boundary',
          visible: existingPeerMapsLayer?.visible ?? true,
          z_index: 0,
          is_editable: false,
          config: { color: DEFAULT_ANNOTATION_COLOR },
        };
        layersToSet = [...loadedLayers, peerMapsLayer];
      }
      
      setLayers(layersToSet);
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
        config: { color: newLayerColor, line_thickness: newLayerThickness },
      });

      showToast?.(`Layer "${newLayerName}" created`, 'success');
      setNewLayerName('');
      setNewLayerColor(DEFAULT_ANNOTATION_COLOR);
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
    setEditingColor((layer.config as any)?.color || DEFAULT_ANNOTATION_COLOR);
    setEditingThickness((layer.config as any)?.line_thickness || DEFAULT_LINE_THICKNESS);
  };

  const handleSaveEdit = async (
    layerId: number
  ): Promise<void> => {
    const layer = layers.find(l => l.id === layerId);
    
    // For annotation layers, validate name
    if (layer?.layer_type === 'annotation' && !editingName.trim()) {
      showToast?.('Please enter a layer name', 'warning');
      return;
    }

    try {
      const updates: Partial<Layer> = {
        config: { color: editingColor, line_thickness: editingThickness },
      };
      
      // Only update name for annotation layers
      if (layer?.layer_type === 'annotation') {
        updates.name = editingName.trim();
      }
      
      await apiClient.updateLayer(layerId, updates);

      showToast?.('Layer updated', 'success');
      setEditingLayerId(null);
      setEditingName('');
      setEditingColor(DEFAULT_ANNOTATION_COLOR);
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
    setEditingColor(DEFAULT_ANNOTATION_COLOR);
    setEditingThickness(DEFAULT_LINE_THICKNESS);
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
    // Skip API call for synthetic layers (negative IDs)
    if (layer.id! < 0) {
      // For synthetic layers, just update local state
      const newVisible = !layer.visible;
      setLayers(prev => prev.map(l =>
        l.id === layer.id ? { ...l, visible: newVisible } : l
      ));
      // Notify parent of synthetic layer visibility change
      onSyntheticLayerVisibilityChange?.(layer.id!, newVisible);
      return;
    }

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

  const boundaryLayers = layers.filter(l => l.layer_type === 'boundary' && l.is_editable);
  const annotationLayers = layers.filter(l => l.layer_type === 'annotation' && l.is_editable);
  const inheritedBoundaryLayers = layers.filter(l => l.layer_type === 'boundary' && !l.is_editable);
  const inheritedAnnotationLayers = layers.filter(l => l.layer_type === 'annotation' && !l.is_editable);

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
              {boundaryLayers.length > 0 && (
                <div className="layers-section">
                  <h4>Boundary Layers</h4>
                  <ul className="layer-list">
                    {boundaryLayers.map((layer) => (
                      <li key={layer.id} className="layer-item boundary-layer">
                        {editingLayerId === layer.id ? (
                          <div className="layer-edit-form">
                            <span className="layer-name-readonly">{layer.name}</span>
                            <select
                              value={editingColor}
                              onChange={(e) => setEditingColor(e.target.value)}
                              className="layer-color-select"
                              title="Select color"
                            >
                              {colorOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <select
                              value={editingThickness}
                              onChange={(e) => setEditingThickness(Number(e.target.value))}
                              className="layer-thickness-select"
                              title="Select line thickness"
                            >
                              {thicknessOptions.map((t) => (
                                <option key={t} value={t}>{t}px</option>
                              ))}
                            </select>
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
                              <div 
                                className="layer-color-indicator"
                                style={{ backgroundColor: (layer.config as any)?.color || '#e74c3c' }}
                                title="Layer color"
                              />
                              <button
                                onClick={() => handleToggleVisibility(layer)}
                                className={`btn-visibility ${layer.visible ? 'visible' : 'hidden'}`}
                                title={layer.visible ? 'Hide boundary' : 'Show boundary'}
                              >
                                {layer.visible ? '👁' : '👁‍🗨'}
                              </button>
                              <span className="layer-name">{layer.name}</span>
                            </div>
                            <div className="layer-actions">
                              <button
                                onClick={() => handleStartEdit(layer)}
                                className="btn-edit"
                                title="Edit style"
                              >
                                ✎
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {inheritedBoundaryLayers.length > 0 && (
                <div className="layers-section">
                  <h4>Inherited Boundary Layers</h4>
                  <ul className="layer-list">
                    {inheritedBoundaryLayers.map((layer) => (
                      <li key={layer.id} className="layer-item inherited boundary-layer">
                        <div className="layer-info">
                          <div 
                            className="layer-color-indicator"
                            style={{ backgroundColor: (layer.config as any)?.color || '#e74c3c' }}
                            title="Layer color"
                          />
                          <button
                            onClick={() => handleToggleVisibility(layer)}
                            className={`btn-visibility ${layer.visible ? 'visible' : 'hidden'}`}
                            title={layer.visible ? 'Hide boundary' : 'Show boundary'}
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

              {annotationLayers.length === 0 && !isCreating && (
                <div className="no-layers">
                  No annotation layers yet. Create one to get started.
                </div>
              )}

              {annotationLayers.length > 0 && (
                <div className="layers-section">
                  <h4>Annotation Layers</h4>
                  <ul className="layer-list">
                    {annotationLayers.map((layer) => (
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
                            <select
                              value={editingColor}
                              onChange={(e) => setEditingColor(e.target.value)}
                              className="layer-color-select"
                              title="Select color"
                            >
                              {colorOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <select
                              value={editingThickness}
                              onChange={(e) => setEditingThickness(Number(e.target.value))}
                              className="layer-thickness-select"
                              title="Select line thickness"
                            >
                              {thicknessOptions.map((t) => (
                                <option key={t} value={t}>{t}px</option>
                              ))}
                            </select>
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
                              <div 
                                className="layer-color-indicator"
                                style={{ backgroundColor: (layer.config as any)?.color || '#2ecc71' }}
                                title="Layer color"
                              />
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

              {inheritedAnnotationLayers.length > 0 && (
                <div className="layers-section">
                  <h4>Inherited Annotation Layers</h4>
                  <ul className="layer-list">
                    {inheritedAnnotationLayers.map((layer) => (
                      <li key={layer.id} className="layer-item inherited">
                        <div className="layer-info">
                          <div 
                            className="layer-color-indicator"
                            style={{ backgroundColor: (layer.config as any)?.color || '#2ecc71' }}
                            title="Layer color"
                          />
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
                        setNewLayerColor('#2ecc71');
                        setNewLayerThickness(3);
                      }
                    }}
                    placeholder="Enter layer name..."
                    className="layer-name-input"
                    autoFocus
                  />
                  <select
                    value={newLayerColor}
                    onChange={(e) => setNewLayerColor(e.target.value)}
                    className="layer-color-select"
                    title="Select color"
                  >
                    {colorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newLayerThickness}
                    onChange={(e) => setNewLayerThickness(Number(e.target.value))}
                    className="layer-thickness-select"
                    title="Select line thickness"
                  >
                    {thicknessOptions.map((t) => (
                      <option key={t} value={t}>{t}px</option>
                    ))}
                  </select>
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
                        setNewLayerColor('#2ecc71');
                        setNewLayerThickness(3);
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
