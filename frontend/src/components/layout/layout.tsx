import React from 'react';
import './layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">🗺️ Printable Maps</h1>
          <nav className="header-nav">
            <a href="/" className="nav-link">
              Projects
            </a>
          </nav>
        </div>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
