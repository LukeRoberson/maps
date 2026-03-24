import React, { useState } from 'react';
import { TILE_LAYER_OPTIONS } from '@/constants/tile-layers';
import './map-settings-panel.css';

interface MapSettingsPanelProps {
  defaultLat: number | null;
  defaultLng: number | null;
  defaultZoom: number | null;
  onSetDefaultView?: () => void;
  currentTileLayerId?: string | null;
  onTileLayerChange?: (layerId: string) => void;
}

export const MapSettingsPanel: React.FC<MapSettingsPanelProps> = ({
  defaultLat,
  defaultLng,
  defaultZoom,
  onSetDefaultView,
  currentTileLayerId,
  onTileLayerChange,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div className="map-settings-panel">
      <div
        className="map-settings-header"
        onClick={() => setIsExpanded(prev => !prev)}
      >
        <h3>Settings</h3>
        <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className="map-settings-content">
          {onTileLayerChange && (
            <div className="map-settings-field">
              <label className="map-settings-label" htmlFor="map-style-select">
                Default Map Style
              </label>
              <select
                id="map-style-select"
                className="map-settings-select"
                value={currentTileLayerId ?? ''}
                onChange={e => onTileLayerChange(e.target.value)}
              >
                {TILE_LAYER_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="map-settings-row">
            <span className="map-settings-label">Latitude</span>
            <span className="map-settings-value">
              {defaultLat !== null ? defaultLat?.toFixed(6) : '—'}
            </span>
          </div>
          <div className="map-settings-row">
            <span className="map-settings-label">Longitude</span>
            <span className="map-settings-value">
              {defaultLng !== null ? defaultLng?.toFixed(6) : '—'}
            </span>
          </div>
          <div className="map-settings-row">
            <span className="map-settings-label">Zoom</span>
            <span className="map-settings-value">
              {defaultZoom !== null ? defaultZoom : '—'}
            </span>
          </div>
          {onSetDefaultView && (
            <div className="map-settings-actions">
              <button
                className="btn btn-secondary"
                onClick={onSetDefaultView}
                title="Set current map view as default for this map"
              >
                Set Default View
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
