import React from 'react';
import './about.css';

const About: React.FC = () => {
  return (
    <div className="about-page">
      <div className="card">
        <h1>About Printable Maps</h1>
        
        <section className="about-section">
          <h2>Project Description</h2>
          <p>
            Printable Maps is a web application designed to help you create custom, 
            annotated maps that can be exported and printed. Whether you're planning 
            a neighborhood event, documenting local landmarks, or creating reference 
            materials, this tool provides an intuitive interface for map creation and 
            annotation.
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
            <li>Export maps as PNG images (coming soon)</li>
            <li>Browser-based - no installation required</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Privacy Statement</h2>
          <p>
            This application stores all project data locally in your browser's storage 
            or on the server you're running it from. No data is transmitted to external 
            services except for map tile requests to OpenStreetMap's tile servers, which 
            is necessary to display the maps.
          </p>
          <p>
            If you're running this application locally, all your project data remains 
            on your own system. If deployed on a server, please consult with your 
            server administrator about data storage and backup policies.
          </p>
        </section>

        <section className="about-section">
          <h2>Disclaimer</h2>
          <div className="disclaimer-box">
            <p>
              <strong>Use at Your Own Risk:</strong> This software is provided "as is" 
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

        <section className="about-section">
          <h2>Technology Stack</h2>
          <ul className="tech-list">
            <li><strong>Frontend:</strong> React, TypeScript, Leaflet</li>
            <li><strong>Backend:</strong> Python, Flask</li>
            <li><strong>Database:</strong> SQLite</li>
            <li><strong>Map Data:</strong> OpenStreetMap</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Open Source</h2>
          <p>
            This project is open source and welcomes contributions. Please check the 
            repository for more information on how to contribute or report issues.
          </p>
        </section>
      </div>
    </div>
  );
};

export default About;
