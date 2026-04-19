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

// Organisms
import Form from './Form';

// Types
import type { CreateProjectInput } from '@/hooks/useProjectList';

import './CreateProjectModal.css';


/**
 * Type for CreateProjectModal component props.
 * 
 * @property onClose - Function to call when the modal should be closed.
 * @property onCreate - Function to call with new project data when the form is submitted.
 */
type CreateProjectModalProps = {
    onClose: () => void;
    onCreate: (data: CreateProjectInput) => Promise<void>;
}


/**
 * Modal for creating a new project with form inputs.
 * 
 * @param onClose - Function to call when the modal should be closed.
 * @param onCreate - Function to call with new project data when the form is submitted.
 * @returns Create project modal component
 */
export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
    onClose,
    onCreate,
}) => {

    // State for text fields in the form
    const [formData, setFormData] = useState<{
        name: string;
        description: string;
    }>({
        name: '',
        description: '',
    });

    // State for number fields in the form (stored as strings in a form)
    const [formValues, setFormValues] = useState<{
        center_lat?: string;
        center_lon?: string;
        zoom_level?: string;
    }>({});

    /*
     * Some of the values in the form have defaults that we want to show in the input fields.
     * We fetch the config from the backend to get these defaults, and then set them in state to show in the form.
     * This useEffect runs once on component mount to fetch the config and set the default values.
     */
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // API call to fetch config, which includes default map settings for new projects
                const config = await apiClient.getConfig();
                
                // Set input fields (state) to show the defaults
                setFormValues({
                    center_lat: config.default_map.center_lat.toString(),
                    center_lon: config.default_map.center_lon.toString(),
                    zoom_level: config.default_map.zoom_level.toString(),
                });
            } catch (error) {
                console.error('Failed to fetch default values from backend:', error);
            }
        };
        
        fetchConfig();
    }, []);


    /**
     * @function handleSubmit
     * @summary Handles form submission to create a new project.
     * 
     * @remarks
     * The Project type represents the structure of the project.
     * The form values are in two different states (formData for text fields and formValues for number fields).
     * These need to be merged together and the number fields need to be parsed before sending to the onCreate function.
     * 
     * @returns void
     */
    const handleSubmit = async (): Promise<void> => {
        // Build project data object. This is based on the 'CreateProjectInput' type.
        const payload: CreateProjectInput = {...formData};

        /* 
         * Now add the optional numeric fields from formValues state.
         * These are parsed to numbers, and checked for validity.
         * If parsing fails, they will be set to undefined, allowing the backend to use defaults.
         */
        if (formValues.center_lat) {
            const parsedLat = parseFloat(formValues.center_lat);
            if (Number.isFinite(parsedLat)) payload.center_lat = parsedLat;
        }
        if (formValues.center_lon) {
            const parsedLon = parseFloat(formValues.center_lon);
            if (Number.isFinite(parsedLon)) payload.center_lon = parsedLon;
        }
        if (formValues.zoom_level) {
            const parsedZoom = parseFloat(formValues.zoom_level);
            if (Number.isFinite(parsedZoom)) payload.zoom_level = parsedZoom;
        }

        try {
            await onCreate(payload);
            onClose();
        } catch (error) {
            console.error('Failed to create project:', error);
            alert('Failed to create project. Please try again.');
        }
    };

    /**
     * Main render of the modal component.
     */
    return (
        /* Parent overlay div.
         * Styles the look behind the modal.
         * Captures clicks outside the modal to close it.
         */
        <div className="modal-parent" onClick={onClose}>
            
            {/* The modal itself */}
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <Form
                    heading="Create New Project"

                    fields={[
                        {
                            label: 'Project Name',
                            value: formData.name || '',
                            onChange: (value) => setFormData({ ...formData, name: value }),
                        },
                        {
                            label: 'Project Description',
                            fieldtype: 'textarea',
                            value: formData.description || '',
                            onChange: (value) => setFormData({ ...formData, description: value }),
                        },
                        {
                            label: 'Center Latitude',
                            type: 'number',
                            value: formValues.center_lat !== undefined ? formValues.center_lat : '',
                            onChange: (value) => {
                                setFormValues((prev) => ({ ...prev, center_lat: value }));
                            }
                        },
                        {
                            label: 'Center Longitude',
                            type: 'number',
                            value: formValues.center_lon !== undefined ? formValues.center_lon : '',
                            onChange: (value) => {
                                setFormValues((prev) => ({ ...prev, center_lon: value }));
                            }
                        },
                        {
                            label: 'Zoom Level',
                            type: 'number',
                            value: formValues.zoom_level !== undefined ? formValues.zoom_level : '',
                            onChange: (value) => {
                                setFormValues((prev) => ({ ...prev, zoom_level: value }));
                            }
                        }
                    ]}

                    buttons={[
                        {
                            text: 'Cancel',
                            onClick: onClose,
                            type: 'clear',
                        },
                        {
                            text: 'Create',
                            onClick: handleSubmit,
                            disabled: !formData.name,
                            type: 'blue',
                        }
                    ]}
                />
            </div>
        </div>
    );
};
