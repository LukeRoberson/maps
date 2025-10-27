import React, { useState } from 'react';
import './export-dialog.css';

interface ExportDialogProps {
  mapAreaName: string;
  onExport: (options: ExportOptions) => void;
  onCancel: () => void;
}

export interface ExportOptions {
  useDefaultView: boolean;
  includeBoundaries: boolean;
  includeAnnotations: boolean;
  format: 'download' | 'clipboard';
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  mapAreaName,
  onExport,
  onCancel,
}) => {
  const [options, setOptions] = useState<ExportOptions>({
    useDefaultView: true,
    includeBoundaries: true,
    includeAnnotations: true,
    format: 'download',
  });

  const handleExport = (): void => {
    onExport(options);
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
                checked={options.useDefaultView}
                onChange={(e) =>
                  setOptions({ ...options, useDefaultView: e.target.checked })
                }
              />
              <span>Use default view (zoom and position)</span>
            </label>
            <p className="option-description">
              When checked, exports the map at the saved default view. Uncheck
              to export the current visible area.
            </p>
          </div>

          <div className="export-option">
            <label className="export-checkbox-label">
              <input
                type="checkbox"
                checked={options.includeBoundaries}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    includeBoundaries: e.target.checked,
                  })
                }
              />
              <span>Include boundaries</span>
            </label>
            <p className="option-description">
              Include map area boundaries in the export.
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
              Include all annotations and markers in the export.
            </p>
          </div>

          <div className="export-option">
            <label className="export-radio-group">
              <span className="option-label">Export to:</span>
              <div className="radio-options">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="format"
                    checked={options.format === 'download'}
                    onChange={() => setOptions({ ...options, format: 'download' })}
                  />
                  <span>Download as file</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="format"
                    checked={options.format === 'clipboard'}
                    onChange={() => setOptions({ ...options, format: 'clipboard' })}
                  />
                  <span>Copy to clipboard</span>
                </label>
              </div>
            </label>
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
