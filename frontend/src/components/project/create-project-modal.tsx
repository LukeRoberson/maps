/**
 * @file create-project-modal.tsx
 * 
 * @summary Modal component for creating a new project.
 * 
 * @exports CreateProjectModal
 */


// External dependencies
import React, { useState } from 'react';

// Types
import type { Project, CreateProjectModalProps } from '@/components/project/project-types';


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
    // Local state for form data (new project details)
    const [formData, setFormData] = useState<Omit<Project, 'id'>>({
        name: '',
        description: '',
        center_lat: 0,
        center_lon: 0,
        zoom_level: 13,
    });


    /**
     * @function handleSubmit
     * 
     * @summary Handles form submission to create a new project.
     * @remarks
     * Calls the onCreate prop with form data and closes the modal on success.
     * 
     * @returns void
     */
    const handleSubmit = async (): Promise<void> => {
        try {
        await onCreate(formData);
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
                        type="number"
                        step="0.0001"
                        value={formData.center_lat}

                        // Update formData state with new latitude
                        onChange={(e) =>
                            setFormData({
                            ...formData,
                            center_lat: parseFloat(e.target.value),
                            })
                        }
                        />
                    </div>

                    {/* Longitude input */}
                    <div className="form-group">
                        <label>Center Longitude</label>
                        <input
                        type="number"
                        step="0.0001"
                        value={formData.center_lon}

                        // Update formData state with new longitude
                        onChange={(e) =>
                            setFormData({
                            ...formData,
                            center_lon: parseFloat(e.target.value),
                            })
                        }
                        />
                    </div>
                </div>

                {/* Zoom level input */}
                <div className="form-group">
                    <label>Zoom Level</label>
                    <input
                        type="number"
                        min="1"
                        max="18"
                        value={formData.zoom_level}

                        // Update formData state with new zoom level
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                zoom_level: parseInt(e.target.value),
                            })
                        }
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
