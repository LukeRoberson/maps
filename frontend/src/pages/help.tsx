/**
 * @file help.tsx
 * 
 * @summary /help page component.
 * 
 * @exports Help
 */


// External dependencies
import React from 'react';

// Internal dependencies
import InformationTemplate from '../Templates/InformationTemplate';
import type { CardContent, CardBox } from '../components/organisms/Card';
import './help.css';


// Getting Started section
const gettingStartedBox: CardBox = {
    card: [
        { kind: 'heading', level: 2, text: "Getting Started" },
        { kind: 'paragraph', text: "Printable Maps helps you create custom annotated maps organized in a hierarchical structure. Start by creating a project, then build your map hierarchy from regions down to detailed individual maps." },
    ]
};


// Map Hierarchy section
const hierarchyBox: CardBox = {
    card: [
        { kind: 'heading', level: 2, text: "Understanding the Map Hierarchy" },
        { kind: 'labeled', style: 'box', label: "Project", text: "The top-level container for all your maps" },
        { kind: 'paragraph', align: 'center', large: true, text: "↓" },
        { kind: 'labeled', style: 'box', label: "Region Maps", text: "Large areas (e.g., a city, district, or county)" },
        { kind: 'paragraph', align: 'center', large: true, text: "↓" },
        { kind: 'labeled', style: 'box', label: "Suburb Maps", text: "Subdivisions within a region (e.g., neighborhoods or suburbs)" },
        { kind: 'paragraph', align: 'center', large: true, text: "↓" },
        { kind: 'labeled', style: 'box', label: "Individual Maps", text: "Detailed maps of specific areas within suburbs" },
        { kind: 'labeled', style: 'emphasis', label: "Note:", text: "Each level must be contained within its parent's boundary. You can have multiple regions in a project, multiple suburbs in a region, and multiple individual maps in a suburb." }
    ]
};


// Creating a project
const creatingProjectBox: CardBox = {
    card: [
        { kind: 'heading', level: 2, text: "Creating a Project" },
        { kind: 'list', ordered: true, items: [
            "Go to the Projects page and click 'New Project'",
            "Enter a name and description for your project",
            "Set the default center coordinates (latitude/longitude)",
            "Choose a default zoom level (13 is recommended for neighborhoods)",
            "Click 'Create' to save your project"
        ]}
    ]
};


// Working with maps
const workingWithMapsBox: CardBox = {
    card: [
        { kind: 'heading', level: 2, text: "Working with Maps" },
        { kind: 'heading', level: 3, text: "Defining Boundaries" },
        { kind: 'paragraph', text: "Each map area needs a boundary to define its geographical extent." },
        { kind: 'list', ordered: true, items: [
            "Open a map area (region, suburb, or individual map)",
            "Click 'Define Boundary' or 'Edit Boundary'",
            "Use the drawing tools to create a polygon or rectangle",
            "You can edit vertices by clicking 'Edit boundary' and dragging points",
            "Click 'Save Boundary' when finished"
        ]},
        { kind: 'heading', level: 3, text: "Setting Default Views" },
        { kind: 'paragraph', text: "Each map can have a default view (center position and zoom level)." },
        { kind: 'list', ordered: true, items: [
            "Pan and zoom the map to your desired view",
            "Click 'Set Default View' to save the current view",
            "Use 'Recenter to Default' to return to the saved view"
        ]},
        { kind: 'heading', level: 3, text: "Creating Child Maps" },
        { kind: 'list', ordered: true, items: [
            "In a Region: Click 'Add Suburb' to create a suburb map",
            "In a Suburb: Click 'Add Individual Map' to create a detailed map",
            "Draw the boundary for the new map within the parent’s boundary",
            "Enter a name for the new map area"
        ]},
    ]
};


// Working with layers
const workingWithLayersBox: CardBox = {
    card: [
        { kind: 'heading', level: 2, text: "Working with Layers" },
        { kind: 'paragraph', text: "Layers help you organize annotations and control which elements are visible or editable" },
        { kind: 'heading', level: 3, text: "Layer Types" },
        { kind: 'list', ordered: false, items: [
            "Inherited Layers: Layers from parent maps (read-only)",
            "Editable Layers: Layers you can modify on the current map"
        ]},
        { kind: 'heading', level: 3, text: "Managing Layers" },
        { kind: 'list', ordered: true, items: [
            "Use the Layer Manager sidebar to view all layers",
            "Click 'New Layer' to create a new layer",
            "Toggle visibility with the eye icon",
            "Select a layer to make it active for adding annotations",
            "Reorder layers by dragging (affects which annotations appear on top)"
        ]}
    ]
};


// Working with annotations
const workingWithAnnotationsBox: CardBox = {
    card: [
        { kind: 'heading', level: 2, text: "Working with Annotations" },
        { kind: 'paragraph', text: "Annotations allow you to mark points of interest on your maps." },
        { kind: 'heading', level: 3, text: "Annotation Types" },
        { kind: 'list', ordered: false, items: [
            "Markers: Point locations with labels",
            "Lines: Paths, routes, or linear features",
            "Polygons: Areas with optional labels",
            "Text: Custom text annotations"
        ]},
        { kind: 'heading', level: 3, text: "Adding Annotations" },
        { kind: 'list', ordered: true, items: [
            "Select an editable layer in the Layer Manager",
            "Use the drawing tools on the map to create your annotation",
            "For markers and polygons, enter a label when prompted",
            "For text annotations, enter your text after placing it",
            "The annotation is automatically saved"
        ]},
        { kind: 'heading', level: 3, text: "Editing and Deleting Annotations" },
        { kind: 'list', ordered: true, items: [
            "Click 'Edit annotations' button on the map to enable edit mode",
            "Click an annotation to edit its position or shape",
            "Drag vertices to reshape polygons or lines",
            "Use the trash icon to delete annotations",
            "You can only edit annotations in the currently selected layer"
        ]},
        { kind: 'labeled', style: 'emphasis', label: "Note:", text: "Annotations in inherited layers (from parent maps) cannot be edited. They are shown for reference only." }
    ]
};



// Combine all sections into a final CardContent object for the About page
const finalCard: CardContent = {
    title: "Help & Documentation",
    content: [
        gettingStartedBox,
        hierarchyBox,
        creatingProjectBox,
        workingWithMapsBox,
        workingWithLayersBox,
        workingWithAnnotationsBox
    ]
};



const Help: React.FC = () => {
    return (
        <InformationTemplate cardConfig={finalCard}/>
    );
}


// Default export
export default Help;
