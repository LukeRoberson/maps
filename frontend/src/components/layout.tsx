/**
 * @file layout.tsx
 * 
 * @summary Layout component.
 *  Includes a header with navigation links and a main content area.
 * 
 * @exports Layout
 */

// External dependencies
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// Internal dependencies
import './layout.css';


/**
 * Type definition for Layout component props.
 *  React.Node is used to represent any renderable React content.
 * 
 * @param {LayoutProps} props - The component props.
 */
interface LayoutProps {
  children: React.ReactNode;
}


/**
 * Layout component that wraps around page content.
 *  Takes child components as props and renders them.
 * 
 * @param {LayoutProps} props - The component props (children).
 * @returns {JSX.Element} The rendered Layout component.
 */
const Layout: React.FC<LayoutProps> = ({ children }: LayoutProps): React.ReactElement => {
  /*
  Get current location (active route)
  Used to highlight the active navigation link in the navbar
  */
  const location = useLocation();

  return (
    <div className="layout">
      {/* Header with navigation links */}
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">🗺️ Printable Maps</h1>
          
          {/* 
            Navigation bar
            The 'active' class is applied to the link that matches the current route
          */}
          <nav className="header-nav">
            {/* Projects page */}
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Projects
            </Link>
            
            {/* Help page */}
            <Link 
              to="/help" 
              className={`nav-link ${location.pathname === '/help' ? 'active' : ''}`}
            >
              Help
            </Link>
            
            {/* About page */}
            <Link 
              to="/about" 
              className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}
            >
              About
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content area */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

// Default export
export default Layout;
