/**
 * @file help.tsx
 * 
 * @summary /help page component.
 * 
 * @exports Help
 */


// External dependencies
import React from 'react';

// Internal dependencies
import './help.css';


/**
 * Help page component.
 * Provides user documentation and guidance on using the Printable Maps application.
 * 
 * @returns React element representing the Help page.
 */
const Help: React.FC = () => {
  return (
    /* Main container for the Help page */
    <div className="help-page">
      {/* Everything is nested in the card */}
      <div className="card">
        <h1>Help & Documentation</h1>

        {/* Each section covers a different aspect of using the app */}
        <section className="help-section">
          <h2>Getting Started</h2>
          <p>
            Printable Maps helps you create custom annotated maps organized in a 
            hierarchical structure. Start by creating a project, then build your 
            map hierarchy from regions down to detailed individual maps.
          </p>
        </section>

        {/* Work flow diagram illustrating the map hierarchy */}
        <section className="help-section">
          <h2>Understanding the Map Hierarchy</h2>
          <div className="hierarchy-diagram">
            <div className="hierarchy-level">
              <strong>Project</strong>
              <p>The top-level container for all your maps</p>
            </div>
            <div className="hierarchy-arrow">↓</div>
            
            <div className="hierarchy-level">
              <strong>Region Maps</strong>
              <p>Large areas (e.g., a city, district, or county)</p>
            </div>
            <div className="hierarchy-arrow">↓</div>
            
            <div className="hierarchy-level">
              <strong>Suburb Maps</strong>
              <p>Subdivisions within a region (e.g., neighborhoods or suburbs)</p>
            </div>
            <div className="hierarchy-arrow">↓</div>
            
            <div className="hierarchy-level">
              <strong>Individual Maps</strong>
              <p>Detailed maps of specific areas within suburbs</p>
            </div>
          </div>
          
          <p className="note">
            <strong>Note:</strong> Each level must be contained within its parent&apos;s 
            boundary. You can have multiple regions in a project, multiple suburbs 
            in a region, and multiple individual maps in a suburb.
          </p>
        </section>

        {/* How to create and manage projects */}
        <section className="help-section">
          <h2>Creating a Project</h2>
          <ol className="step-list">
            <li>Click &quot;New Project&quot; on the Projects page</li>
            <li>Enter a name and description for your project</li>
            <li>Set the default center coordinates (latitude/longitude)</li>
            <li>Choose a default zoom level (13 is recommended for neighborhoods)</li>
            <li>Click &quot;Create&quot; to save your project</li>
          </ol>
        </section>

        <section className="help-section">
          <h2>Working with Maps</h2>
          
          <h3>Defining Boundaries</h3>
          <p>
            Each map area needs a boundary to define its geographical extent:
          </p>
          <ol className="step-list">
            <li>Open a map area (region, suburb, or individual map)</li>
            <li>Click &quot;Define Boundary&quot; or &quot;Edit Boundary&quot;</li>
            <li>Use the drawing tools to create a polygon or rectangle</li>
            <li>You can edit vertices by clicking &quot;Edit boundary&quot; and dragging points</li>
            <li>Click &quot;Save Boundary&quot; when finished</li>
          </ol>
          <p className="note">
            <strong>Tip:</strong> Child map boundaries (suburbs or individual maps) 
            must be entirely within their parent&apos;s boundary. The parent boundary is 
            shown with dashed red lines for reference.
          </p>

          <h3>Setting Default Views</h3>
          <p>
            Each map can have a default view (center position and zoom level):
          </p>
          <ol className="step-list">
            <li>Pan and zoom the map to your desired view</li>
            <li>Click &quot;Set Default View&quot; to save the current view</li>
            <li>Use &quot;Recenter to Default&quot; to return to the saved view</li>
          </ol>

          {/* Instructions for creating child maps */}
          <h3>Creating Child Maps</h3>
          <ul className="feature-list">
            <li>
              <strong>In a Region:</strong> Click &quot;Add Suburb&quot; to create a suburb map
            </li>
            <li>
              <strong>In a Suburb:</strong> Click &quot;Add Individual Map&quot; to create a 
              detailed map
            </li>
            <li>Draw the boundary for the new map within the parent&apos;s boundary</li>
            <li>Enter a name for the new map area</li>
          </ul>
        </section>

        <section className="help-section">
          <h2>Working with Layers</h2>
          <p>
            Layers help you organize annotations and control which elements are 
            visible or editable:
          </p>
          
          <h3>Layer Types</h3>
          <ul className="feature-list">
            <li>
              <strong>Inherited Layers:</strong> Layers from parent maps (read-only)
            </li>
            <li>
              <strong>Editable Layers:</strong> Layers you can modify on the current map
            </li>
          </ul>

          <h3>Managing Layers</h3>
          <ol className="step-list">
            <li>Use the Layer Manager sidebar to view all layers</li>
            <li>Click &quot;New Layer&quot; to create a new layer</li>
            <li>Toggle visibility with the eye icon</li>
            <li>Select a layer to make it active for adding annotations</li>
            <li>Reorder layers by dragging (affects which annotations appear on top)</li>
          </ol>
        </section>

        {/* Instructions for creating annotations on the map */}
        <section className="help-section">
          <h2>Creating Annotations</h2>
          <p>
            Annotations allow you to mark and label points of interest on your maps:
          </p>

          {/* Displayed as a flexible grid */}
          <h3>Annotation Types</h3>
          <div className="annotation-types">
            <div className="annotation-type">
              <strong>📍 Markers</strong>
              <p>Point locations with labels</p>
            </div>
            
            <div className="annotation-type">
              <strong>📏 Lines</strong>
              <p>Paths, routes, or linear features</p>
            </div>
            
            <div className="annotation-type">
              <strong>⬜ Polygons</strong>
              <p>Areas with optional labels</p>
            </div>
            
            <div className="annotation-type">
              <strong>📝 Text</strong>
              <p>Custom text annotations</p>
            </div>
          </div>

          <h3>Adding Annotations</h3>
          <ol className="step-list">
            <li>Select a layer in the Layer Manager (must be editable)</li>
            <li>Use the drawing tools on the map to create your annotation</li>
            <li>For markers and polygons, enter a label when prompted</li>
            <li>For text annotations, enter your text after placing it</li>
            <li>The annotation is automatically saved</li>
          </ol>

          <h3>Editing and Deleting Annotations</h3>
          <ul className="feature-list">
            <li>Click &quot;Edit annotations&quot; button on the map to enable edit mode</li>
            <li>Click an annotation to edit its position or shape</li>
            <li>Drag vertices to reshape polygons or lines</li>
            <li>Use the trash icon to delete annotations</li>
            <li>You can only edit annotations in the currently selected layer</li>
          </ul>
          
          <p className="note">
            <strong>Note:</strong> Annotations in inherited layers (from parent maps) 
            cannot be edited. They are shown for reference only.
          </p>
        </section>

        {/* Keyboard shortcuts for common actions */}
        <section className="help-section">
          <h2>Keyboard Shortcuts</h2>
          <div className="shortcuts">
            <div className="shortcut">
              <kbd>Esc</kbd>
              <span>Cancel current drawing operation</span>
            </div>
            
            <div className="shortcut">
              <kbd>Enter</kbd>
              <span>Confirm text input when renaming</span>
            </div>
            
            <div className="shortcut">
              <kbd>Double-click</kbd>
              <span>Rename map area (on title)</span>
            </div>
          </div>
        </section>

        <section className="help-section">
          <h2>Tips & Best Practices</h2>
          <ul className="tips-list">
            <li>
              <strong>Start with boundaries:</strong> Define your region boundaries 
              before creating suburb maps
            </li>
            <li>
              <strong>Use layers strategically:</strong> Group related annotations 
              in the same layer for easier management
            </li>
            <li>
              <strong>Set default views:</strong> Save default views for quick 
              navigation to important areas
            </li>
            <li>
              <strong>Name things clearly:</strong> Use descriptive names for maps 
              and layers to stay organized
            </li>
            <li>
              <strong>Plan your hierarchy:</strong> Think about your map organization 
              before creating many child maps
            </li>
            <li>
              <strong>Regular exports:</strong> Once export functionality is available, 
              export your maps regularly as backups
            </li>
          </ul>
        </section>

        <section className="help-section">
          <h2>Common Issues</h2>
          
          <div className="issue">
            <h3>Can&apos;t create annotations</h3>
            <p>
              Make sure you have selected an editable layer in the Layer Manager. 
              You cannot add annotations without an active layer selected.
            </p>
          </div>

          <div className="issue">
            <h3>Boundary won&apos;t save</h3>
            <p>
              For suburb and individual map boundaries, ensure your boundary is 
              entirely within the parent map&apos;s boundary. The system will reject 
              boundaries that extend outside their parent.
            </p>
          </div>

          <div className="issue">
            <h3>Can&apos;t edit an annotation</h3>
            <p>
              You can only edit annotations in the currently selected layer. 
              Annotations from inherited (parent) layers are read-only. Select 
              the correct layer and ensure it&apos;s editable.
            </p>
          </div>

          <div className="issue">
            <h3>Map tiles not loading</h3>
            <p>
              This usually indicates an internet connection issue or problems 
              reaching OpenStreetMap&apos;s tile servers. Check your connection and 
              try refreshing the page.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

// Default export
export default Help;
