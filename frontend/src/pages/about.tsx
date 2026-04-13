/**
 * @file about.tsx
 * 
 * @summary /about page component.
 * Uses the AboutTemplate to display information about the Printable Maps project, including features, privacy statement, disclaimer, and changelog.
 * 
 * @exports About - The About page component
 */


// React imports
import React from 'react';

// Component imports
import AboutTemplate from '../Templates/AboutTemplate';

// Type imports
import type { CardConfig } from '../components/organisms/Card';
import type { CardSectionConfig } from '../components/Molecules/CardSection';
import type { DisclaimerBoxProps } from '@/components/Molecules/DisclaimerBox';
import type { ChangelogProps } from '@/components/Molecules/Changelog';
import type { FeatureListProps } from '@/components/Molecules/FeatureList';

// CSS imports
import './about.css';


// Description section content
const descriptionSection: CardSectionConfig = {
    title: "Project Description",
    paragraphs: [
        "Printable Maps is a web application designed to help you create custom, annotated maps that can be exported and printed.",
        "The application uses OpenStreetMap data to provide accurate, up-to-date mapping information, and allows you to organize your maps hierarchically from regions down to individual detailed maps.",
    ],
};

// Features section content
const featuresSection: FeatureListProps = {
    title: "Features",
    features: [
        "Create hierarchical map projects (Region → Suburb → Individual maps)",
        "Define custom boundaries for each map area",
        "Add annotations with markers, lines, polygons, and text",
        "Organize annotations into layers for better management",
        "Set default views for each map",
        "Export maps as PNG images",
        "Browser-based - no installation required"
    ]
};

// Privacy statement section content
const privacySection: CardSectionConfig = {
    title: "Privacy Statement",
    paragraphs: [
        "This application stores project data in a database on the server. No data is transmitted to external services except for map tile requests to OpenStreetMap's tile servers, which is necessary to display the maps.",
        "If you're running this application locally, all your project data remains on your own system. If deployed on a server, please consult with your server administrator about data storage and backup policies."
    ]
};

// Disclaimer section content
const disclaimerSection: DisclaimerBoxProps = {
    title: "Disclaimer",
    items: [
        {
            label: "Use at Your Own Risk:",
            content: "This software is provided &quot;as is&quot; without any warranties or guarantees. While we strive to provide a reliable tool, we cannot guarantee that your data will never be lost."
        },
        {
            label: "Backup Your Data:",
            content: "It is your responsibility to maintain backups of your important projects. Export your projects regularly and keep copies in a safe location."
        },
        {
            label: "Map Data:",
            content: "Map tiles and geographic data are provided by OpenStreetMap contributors and are subject to the OpenStreetMap copyright. Please ensure your use complies with their terms (https://www.openstreetmap.org/copyright)."
        },
        {
            label: "No Warranty:",
            content: "The developers of this application accept no liability for any damages, losses, or issues arising from the use of this software."
        }
    ]
};

// Changelog section content
const changeLogSection: ChangelogProps = {
    title: "Changelog",
    entries: [
        {
            version: "1.1.0",
            date: "April 2026",
            changes: [
                "Added Docker support for easier deployment",
                "Various UI improvements and bug fixes",
                "Fixed API problems when importing a project",
                "Added layer inheritance",
                "Added map styles",
                "Improved map export quality and performance",
                "Added Swagger/OpenAPI documentation for the backend API"
            ]
        },
        {
            version: "1.0.0",
            date: "October 2025",
            changes: [
                "Initial release",
                "Project and map area management",
                "Boundary definition for regions, suburbs, and individual maps",
                "Layer-based annotation system",
                "Multiple annotation types (markers, lines, polygons, text)",
                "Default view settings",
                "Map recentering functionality",
                "About and Help pages"
            ]
        }
    ]
};

// Overall card configuration for the About page
const aboutCardConfig: CardConfig = {
    title: "About Printable Maps",
    sections: [
        descriptionSection,
        privacySection
    ],
    features: featuresSection,
    disclaimer: disclaimerSection,
    changelog: changeLogSection,
};



/**
 * About page component.
 *  Provides information about the Printable Maps project,
 *  including features, privacy statement, disclaimer, and changelog.
 *  Utilizes the AboutTemplate for consistent layout and styling.
 * 
 * @returns React element representing the About page.
 */
const About: React.FC = () => {
    return <AboutTemplate cardConfig={aboutCardConfig} />;
};

// Default export
export default About;
