import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/layout';
import ProjectList from './pages/project-list';
import ProjectView from './pages/project-view';
import MapEditor from './pages/map-editor';

const App: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/projects/:projectId" element={<ProjectView />} />
        <Route
          path="/projects/:projectId/maps/:mapAreaId"
          element={<MapEditor />}
        />
      </Routes>
    </Layout>
  );
};

export default App;
