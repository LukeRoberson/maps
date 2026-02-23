/**
 * @file create-project-modal.tsx
 * 
 * @summary Modal component for creating a new project.
 * 
 * @exports CreateProjectModal
 */


// External dependencies
import React, { useState, useEffect } from 'react';

// Services
import { apiClient } from '@/services/api-client';

// Types
import type { Project, CreateProjectModalProps } from '@/components/project/types';


/**
 * Modal for creating a new project with form inputs.
 * 
 * @param props - Component props
 * @returns Create project modal component
 */
export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  onClose,
  onCreate,
}) => {
    // Local state for config defaults
    const [configDefaults, setConfigDefaults] = useState<{
        center_lat: number;
        center_lon: number;
        zoom_level: number;
    } | null>(null);

    // Local state for form data (new project details)
    const [formData, setFormData] = useState<Partial<Omit<Project, 'id'>>>({
        name: '',
        description: '',
        // Don't set lat/lon/zoom here - let backend use config defaults
    });

    // Local state for string input values to allow partial input like "-" or "123."
    const [latInput, setLatInput] = useState<string>('');
    const [lonInput, setLonInput] = useState<string>('');
    const [zoomInput, setZoomInput] = useState<string>('');

    // Fetch config defaults on mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const config = await apiClient.getConfig();
                setConfigDefaults(config.default_map);
                
                // Set input fields to show the defaults
                setLatInput(config.default_map.center_lat.toString());
                setLonInput(config.default_map.center_lon.toString());
                setZoomInput(config.default_map.zoom_level.toString());
            } catch (error) {
                console.error('Failed to fetch config:', error);
            }
        };
        
        fetchConfig();
    }, []);


    /**
     * @function handleSubmit
     * 
     * @summary Handles form submission to create a new project.
     * @remarks
     * Calls the onCreate prop with form data and closes the modal on success.
     * Only sends lat/lon/zoom if user explicitly provided values.
     * 
     * @returns void
     */
    const handleSubmit = async (): Promise<void> => {
        try {
        await onCreate(formData as Omit<Project, 'id'>);
        onClose();
        } catch (error) {
        // Error already logged in hook
        }
    };

    /**
     * Main render of the modal component.
     */
    return (
        // Parent overlay div to capture clicks outside modal
        <div className="modal-overlay" onClick={onClose}>
            {/* Modal content card */}
            <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
                <h3>Create New Project</h3>

                {/* Project name input */}
                <div className="form-group">
                <label>Project Name</label>
                <input
                    type="text"
                    value={formData.name}
                    
                    // Update formData state with new project name
                    onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter project name"
                />
                </div>

                {/* Project description input */}
                <div className="form-group">
                <label>Description</label>
                <textarea
                    value={formData.description}

                    // Update formData state with new project description
                    onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter project description"
                    rows={3}
                />
                </div>

                {/* Center latitude and longitude inputs */}
                <div className="form-row">
                    {/* Latitude input */}
                    <div className="form-group">
                        <label>Center Latitude</label>
                        <input
                        type="text"
                        value={latInput}
                        placeholder={configDefaults ? `Default: ${configDefaults.center_lat}` : 'Loading...'}

                        // Update formData state with new latitude
                        onChange={(e) => {
                            const value = e.target.value;
                            setLatInput(value);
                            
                            // Only set in formData if value is valid
                            if (value === '') {
                                // Remove from formData to use backend default
                                const { center_lat, ...rest } = formData;
                                setFormData(rest);
                            } else if (/^-?\d*\.?\d*$/.test(value)) {
                                const parsed = parseFloat(value);
                                if (!isNaN(parsed)) {
                                    setFormData({
                                        ...formData,
                                        center_lat: parsed,
                                    });
                                }
                            }
                        }}
                        />
                    </div>

                    {/* Longitude input */}
                    <div className="form-group">
                        <label>Center Longitude</label>
                        <input
                        type="text"
                        value={lonInput}
                        placeholder={configDefaults ? `Default: ${configDefaults.center_lon}` : 'Loading...'}

                        // Update formData state with new longitude
                        onChange={(e) => {
                            const value = e.target.value;
                            setLonInput(value);
                            
                            // Only set in formData if value is valid
                            if (value === '') {
                                // Remove from formData to use backend default
                                const { center_lon, ...rest } = formData;
                                setFormData(rest);
                            } else if (/^-?\d*\.?\d*$/.test(value)) {
                                const parsed = parseFloat(value);
                                if (!isNaN(parsed)) {
                                    setFormData({
                                        ...formData,
                                        center_lon: parsed,
                                    });
                                }
                            }
                        }}
                        />
                    </div>
                </div>

                {/* Zoom level input */}
                <div className="form-group">
                    <label>Zoom Level</label>
                    <input
                        type="text"
                        value={zoomInput}
                        placeholder={configDefaults ? `Default: ${configDefaults.zoom_level}` : 'Loading...'}

                        // Update formData state with new zoom level
                        onChange={(e) => {
                            const value = e.target.value;
                            setZoomInput(value);
                            
                            // Only set in formData if value is valid
                            if (value === '') {
                                // Remove from formData to use backend default
                                const { zoom_level, ...rest } = formData;
                                setFormData(rest);
                            } else {
                                const parsed = parseFloat(value);
                                if (!isNaN(parsed) && parsed >= 1 && parsed <= 18) {
                                    setFormData({
                                        ...formData,
                                        zoom_level: parsed,
                                    });
                                }
                            }
                        }}
                    />
                </div>

                {/* Modal action buttons */}
                <div className="modal-actions">
                    {/* Cancel Button */}
                    <button className="btn btn-outline" onClick={onClose}>
                        Cancel
                    </button>

                    {/* Create Button */}
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={!formData.name}
                    >
                        Create
                    </button>
                </div>

            </div>
        </div>
    );
};
