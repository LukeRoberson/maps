/**
 * @file NavBar.tsx
 * 
 * @summary NavBar component.
 *  The main navigation bar for the application, providing links to different pages.
 * 
 * @exports NavBar
 */

import { Link, useLocation } from 'react-router-dom';

import './NavBar.css';


/**
 * NavBar component.
 * 
 * @returns React element representing the navigation bar.
 */
const NavBar: React.FC = () => {
    const location = useLocation();

    return (
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
    )
}

export default NavBar;
