/**
 * @file about.tsx
 * 
 * @summary /about page component.
 * 
 * @exports About
 */


// External dependencies
import React from 'react';

// Internal dependencies
import './about.css';


/**
 * About page component.
 *  Provides information about the Printable Maps project,
 *  including features, privacy statement, disclaimer, and changelog.
 * 
 * @returns React element representing the About page.
 */
const About: React.FC = () => {
  return (
    /* Main container and for the About page */
    <div className="about-page">
      <div className="card">

        {/* There is one page title per card */}
        <h1>About Printable Maps</h1>
        
        {/* The entire page is divided into sections */}
        <section className="about-section">
          <h2>Project Description</h2>
          <p>
            Printable Maps is a web application designed to help you create custom, 
            annotated maps that can be exported and printed.
          </p>
          <p>
            The application uses OpenStreetMap data to provide accurate, up-to-date 
            mapping information, and allows you to organize your maps hierarchically 
            from regions down to individual detailed maps.
          </p>
        </section>

        <section className="about-section">
          <h2>Features</h2>
          <ul className="feature-list">
            <li>Create hierarchical map projects (Region → Suburb → Individual maps)</li>
            <li>Define custom boundaries for each map area</li>
            <li>Add annotations with markers, lines, polygons, and text</li>
            <li>Organize annotations into layers for better management</li>
            <li>Set default views for each map</li>
            <li>Export maps as PNG images</li>
            <li>Browser-based - no installation required</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Privacy Statement</h2>
          <p>
            This application stores project data in a database on the server.
            No data is transmitted to external services except for map tile requests
            to OpenStreetMap&apos;s tile servers, which is necessary to display the maps.
          </p>
          <p>
            If you&apos;re running this application locally, all your project data remains 
            on your own system. If deployed on a server, please consult with your 
            server administrator about data storage and backup policies.
          </p>
        </section>

        <section className="about-section">
          <h2>Disclaimer</h2>
          <div className="disclaimer-box">
            <p>
              <strong>Use at Your Own Risk:</strong> This software is provided &quot;as is&quot; 
              without any warranties or guarantees. While we strive to provide a reliable 
              tool, we cannot guarantee that your data will never be lost.
            </p>
            <p>
              <strong>Backup Your Data:</strong> It is your responsibility to maintain 
              backups of your important projects. Export your projects regularly and keep 
              copies in a safe location.
            </p>
            <p>
              <strong>Map Data:</strong> Map tiles and geographic data are provided by 
              OpenStreetMap contributors and are subject to the{' '}
              <a 
                href="https://www.openstreetmap.org/copyright" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                OpenStreetMap copyright
              </a>
              . Please ensure your use complies with their terms.
            </p>
            <p>
              <strong>No Warranty:</strong> The developers of this application accept 
              no liability for any damages, losses, or issues arising from the use of 
              this software.
            </p>
          </div>
        </section>

        <section className="about-section">
          <h2>Changelog</h2>
          <div className="changelog">
            <div className="changelog-entry">
              <h3>Version 1.0.0 (October 2025)</h3>
              <ul>
                <li>Initial release</li>
                <li>Project and map area management</li>
                <li>Boundary definition for regions, suburbs, and individual maps</li>
                <li>Layer-based annotation system</li>
                <li>Multiple annotation types (markers, lines, polygons, text)</li>
                <li>Default view settings</li>
                <li>Map recentering functionality</li>
                <li>About and Help pages</li>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

// Default export
export default About;
