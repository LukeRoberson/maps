import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">🗺️ Printable Maps</h1>
          <nav className="header-nav">
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Projects
            </Link>
            <Link 
              to="/help" 
              className={`nav-link ${location.pathname === '/help' ? 'active' : ''}`}
            >
              Help
            </Link>
            <Link 
              to="/about" 
              className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}
            >
              About
            </Link>
          </nav>
        </div>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
