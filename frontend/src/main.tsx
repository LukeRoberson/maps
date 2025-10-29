/**
 * @file main.tsx
 * @summary The entry point for the React application.
 * @description This file initializes the React application and renders the main App component
 *              within a BrowserRouter to enable client-side routing.
 * 
 * @notes
 *  Strict Mode is disabled due to incompatibility with Leaflet's map container
 *    initialization in React 19. Leaflet doesn't handle React's double-mount behavior
 *    in development mode. Re-enable once Leaflet has better React 19 support.
 * 
 * @exports none
 * 
 * @imports
 * - React: The core React library for building user interfaces.
 * - ReactDOM: The React DOM library for rendering React components to the DOM.
 * - BrowserRouter: A component from react-router-dom that enables client-side routing.
 * - App: The main application component that contains the routing logic.
 * - global.css: Global CSS styles for the application.
 */

// External dependencies
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Internal dependencies
import App from './app';
import './styles/global.css';


/**
 * Initialize and render the React application.
 * The App component is wrapped in a BrowserRouter to enable routing.
 * 
 * @notes
 * This targets a <div> with the ID 'root' in the index.html file.
 * The future flags enable upcoming React Router features that aren't mainstream yet.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <App />
  </BrowserRouter>
);
