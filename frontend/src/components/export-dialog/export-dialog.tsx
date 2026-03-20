import React, { useState } from 'react';
import './export-dialog.css';

interface ExportDialogProps {
  mapAreaName: string;
  onExport: (options: ExportOptions) => void;
  onCancel: () => void;
}

export interface ExportOptions {
  includeBoundary: boolean;
  includeAnnotations: boolean;
  zoom: number | null; // null = auto
  lineWidthMultiplier: number;
}

const MIN_ZOOM = 14;
const MAX_ZOOM = 19;
const DEFAULT_ZOOM = 17;
const LINE_WIDTH_OPTIONS = [
  { value: 0.5, label: '0.5× (thin)' },
  { value: 1, label: '1× (normal)' },
  { value: 1.5, label: '1.5×' },
  { value: 2, label: '2× (thick)' },
  { value: 3, label: '3× (very thick)' },
];

const ExportDialog: React.FC<ExportDialogProps> = ({
  mapAreaName,
  onExport,
  onCancel,
}) => {
  const [options, setOptions] = useState<ExportOptions>({
    includeBoundary: true,
    includeAnnotations: true,
    zoom: null,
    lineWidthMultiplier: 1,
  });
  const [useAutoZoom, setUseAutoZoom] = useState(true);
  const [manualZoom, setManualZoom] = useState(DEFAULT_ZOOM);

  const handleExport = (): void => {
    onExport({
      ...options,
      zoom: useAutoZoom ? null : manualZoom,
    });
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog export-dialog">
        <h3>Export Map</h3>
        <p className="export-subtitle">Export "{mapAreaName}" as PNG image</p>

        <div className="export-options">
          <div className="export-option">
            <label className="export-checkbox-label">
              <input
                type="checkbox"
                checked={options.includeBoundary}
                onChange={(e) =>
                  setOptions({ ...options, includeBoundary: e.target.checked })
                }
              />
              <span>Include boundary outline</span>
            </label>
            <p className="option-description">
              Draw the map area boundary on the export.
            </p>
          </div>

          <div className="export-option">
            <label className="export-checkbox-label">
              <input
                type="checkbox"
                checked={options.includeAnnotations}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    includeAnnotations: e.target.checked,
                  })
                }
              />
              <span>Include annotations</span>
            </label>
            <p className="option-description">
              Include all annotations, markers, and labels in the export.
            </p>
          </div>

          <div className="export-option">
            <label className="export-checkbox-label">
              <input
                type="checkbox"
                checked={useAutoZoom}
                onChange={(e) => setUseAutoZoom(e.target.checked)}
              />
              <span>Auto zoom level</span>
            </label>
            <p className="option-description">
              Automatically choose the best zoom for readable street names.
            </p>
            {!useAutoZoom && (
              <div className="zoom-control">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => setManualZoom(Math.max(MIN_ZOOM, manualZoom - 1))}
                  disabled={manualZoom <= MIN_ZOOM}
                >
                  −
                </button>
                <span className="zoom-value">{manualZoom}</span>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => setManualZoom(Math.min(MAX_ZOOM, manualZoom + 1))}
                  disabled={manualZoom >= MAX_ZOOM}
                >
                  +
                </button>
                <span className="zoom-hint">
                  Higher = more detail, larger file
                </span>
              </div>
            )}
          </div>

          <div className="export-option">
            <label className="export-select-label" htmlFor="line-width-select">
              Line width
            </label>
            <p className="option-description">
              Scale annotation and boundary line widths in the exported PNG.
            </p>
            <select
              id="line-width-select"
              className="export-select"
              value={options.lineWidthMultiplier}
              onChange={(e) =>
                setOptions({ ...options, lineWidthMultiplier: Number(e.target.value) })
              }
            >
              {LINE_WIDTH_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="dialog-actions">
          <button className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-success" onClick={handleExport}>
            Export PNG
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
