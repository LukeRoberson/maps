/**
 * @file app.tsx
 * @summary The main application component that sets up routing and layout.
 * @exports App
 */

// External dependencies
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Internal dependencies
import Layout from './components/layout';

// Page components
import ProjectList from './pages/project-list';
import ProjectView from './pages/project-view';
import MapEditor from './pages/map-editor';
import About from './pages/about';
import Help from './pages/help';


/**
 * The main application component.
 * 
 * @Routes
 * - `/`: Displays the list of projects.
 * - `/projects/:projectId`: Displays a specific project view.
 * - `/projects/:projectId/maps/:mapAreaId`: Displays the map editor for a specific project and map area.
 * - `/about`: Displays information about the application.
 * - `/help`: Displays help information for users.
 * 
 * @returns {React.ReactElement} The rendered application component.
 */
const App: React.FC = (): React.ReactElement => {
  return (
    <Layout>
      <Routes>
        {/* Home page showing project list */}
        <Route path="/" element={<ProjectList />} />
        
        <Route path="/projects/:projectId" element={<ProjectView />} />
        <Route path="/projects/:projectId/maps/:mapAreaId" element={<MapEditor />} />
        
        {/* Helps and about pages */}
        <Route path="/about" element={<About />} />
        <Route path="/help" element={<Help />} />
      </Routes>
    </Layout>
  );
};

// Default export
export default App;
