/**
 * @file about.tsx
 * 
 * @summary Template for information pages, such as /about and /help.
 * Uses the AboutTemplate to display information about the Printable Maps project, including features, privacy statement, disclaimer, and changelog.
 * CardBoxes are defined for each section of the card content, and then combined into a final CardContent object that is passed to the AboutTemplate.
 * 
 * @exports About - The About page component
 */


// React imports
import React from 'react';

// Component imports
import InformationTemplate from '../Templates/InformationTemplate';

// Type imports
import type { CardContent, CardBox } from '../components/organisms/Card';


// Description section
const descriptionBox: CardBox = {
    card: [
        { kind: 'heading', level: 2, text: "Project Description" },
        { kind: 'paragraph', text: "Printable Maps is a web application designed to help you create custom, annotated maps that can be exported and printed." },
        { kind: 'paragraph', text: "The application uses OpenStreetMap data to provide accurate, up-to-date mapping information, and allows you to organize your maps hierarchically from regions down to individual detailed maps." }
    ]
};


// Features section
const featuresBox: CardBox = {
    card: [
        { kind: 'heading', level: 2, text: "Features" },
        { kind: 'list', ordered: false, items: [
            "Create hierarchical map projects (Region → Suburb → Individual maps)",
            "Define custom boundaries for each map area",
            "Add annotations with markers, lines, polygons, and text",
            "Organize annotations into layers for better management",
            "Set default views for each map",
            "Export maps as PNG images",
            "Browser-based - no installation required"
        ] }
    ]
};


// Privacy statement section
const privacyBox: CardBox = {
    card: [
        { kind: 'heading', level: 2, text: "Privacy Statement" },
        { kind: 'paragraph', text: "This application stores project data in a database on the server. No data is transmitted to external services except for map tile requests to OpenStreetMap's tile servers, which is necessary to display the maps." },
        { kind: 'paragraph', text: "If you're running this application locally, all your project data remains on your own system. If deployed on a server, please consult with your server administrator about data storage and backup policies." }
    ]
};


// Disclaimer section
const disclaimerBox: CardBox = {
    card: [
        { kind: 'heading', level: 2, text: "Disclaimer" },
        { kind: 'labeled', label: "Use at Your Own Risk.", text: "This software is provided \"as is\" without any warranties or guarantees. While we strive to provide a reliable tool, we cannot guarantee that your data will never be lost." },
        { kind: 'labeled', label: "Backup Your Data.", text: "It is your responsibility to maintain backups of your important projects. Export your projects regularly and keep copies in a safe location." },
        { kind: 'labeled', label: "Map Data.", text: "Map tiles and geographic data are provided by OpenStreetMap contributors and are subject to the OpenStreetMap copyright. Please ensure your use complies with their terms (https://www.openstreetmap.org/copyright)." },
        { kind: 'labeled', label: "No Warranty.", text: "The developers of this application accept no liability for any damages, losses, or issues arising from the use of this software." }
    ],
    style: 'emphasis'
};


// Changelog section
const changeLogBox: CardBox = {
    card: [
        { kind: 'heading', level: 2, text: "Changelog" },
        { kind: 'heading', level: 3, text: "Version 1.1.0 - April 2026" },
        { kind: 'list', ordered: false, items: [
            "Added Docker support for easier deployment",
            "Various UI improvements and bug fixes",
            "Fixed API problems when importing a project",
            "Added layer inheritance",
            "Added map styles",
            "Improved map export quality and performance",
            "Added Swagger/OpenAPI documentation for the backend API"
        ] },
        { kind: 'heading', level: 3, text: "Version 1.0.0 - October 2025" },
        { kind: 'list', ordered: false, items: [
            "Initial release",
            "Project and map area management",
            "Boundary definition for regions, suburbs, and individual maps",
            "Layer-based annotation system",
            "Multiple annotation types (markers, lines, polygons, text)",
            "Default view settings",
            "Map recentering functionality",
            "About and Help pages"
        ] }
    ]
};


// Combine all sections into a final CardContent object for the About page
const finalCard: CardContent = {
    title: "About Printable Maps",
    content: [
        descriptionBox,
        featuresBox,
        privacyBox,
        disclaimerBox,
        changeLogBox
    ]
};


/**
 * About page component.
 *  Provides information about the Printable Maps project,
 *  including features, privacy statement, disclaimer, and changelog.
 *  Utilizes the InformationTemplate for consistent layout and styling.
 * 
 * @returns React element representing the About page.
 */
const About: React.FC = () => {
    return <InformationTemplate cardConfig={finalCard} />;
};

// Default export
export default About;
