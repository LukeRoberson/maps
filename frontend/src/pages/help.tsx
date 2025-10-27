import React from 'react';
import './help.css';

const Help: React.FC = () => {
  return (
    <div className="help-page">
      <div className="card">
        <h1>Help & Documentation</h1>

        <section className="help-section">
          <h2>Getting Started</h2>
          <p>
            Printable Maps helps you create custom annotated maps organized in a 
            hierarchical structure. Start by creating a project, then build your 
            map hierarchy from regions down to detailed individual maps.
          </p>
        </section>

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
            <strong>Note:</strong> Each level must be contained within its parent's 
            boundary. You can have multiple regions in a project, multiple suburbs 
            in a region, and multiple individual maps in a suburb.
          </p>
        </section>

        <section className="help-section">
          <h2>Creating a Project</h2>
          <ol className="step-list">
            <li>Click "New Project" on the Projects page</li>
            <li>Enter a name and description for your project</li>
            <li>Set the default center coordinates (latitude/longitude)</li>
            <li>Choose a default zoom level (13 is recommended for neighborhoods)</li>
            <li>Click "Create" to save your project</li>
          </ol>
        </section>

        <section className="help-section">
          <h2>Working with Map Areas</h2>
          
          <h3>Defining Boundaries</h3>
          <p>
            Each map area needs a boundary to define its geographical extent:
          </p>
          <ol className="step-list">
            <li>Open a map area (region, suburb, or individual map)</li>
            <li>Click "Define Boundary" or "Edit Boundary"</li>
            <li>Use the drawing tools to create a polygon or rectangle</li>
            <li>You can edit vertices by clicking "Edit annotations" and dragging points</li>
            <li>Click "Save Boundary" when finished</li>
          </ol>
          <p className="note">
            <strong>Tip:</strong> Child map boundaries (suburbs or individual maps) 
            must be entirely within their parent's boundary. The parent boundary is 
            shown with dashed red lines for reference.
          </p>

          <h3>Setting Default Views</h3>
          <p>
            Each map can have a default view (center position and zoom level):
          </p>
          <ol className="step-list">
            <li>Pan and zoom the map to your desired view</li>
            <li>Click "Set Default View" to save the current view</li>
            <li>Use "Recenter to Default" to return to the saved view</li>
          </ol>

          <h3>Creating Child Maps</h3>
          <ul className="feature-list">
            <li>
              <strong>In a Region:</strong> Click "Add Suburb" to create a suburb map
            </li>
            <li>
              <strong>In a Suburb:</strong> Click "Add Individual Map" to create a 
              detailed map
            </li>
            <li>Draw the boundary for the new map within the parent's boundary</li>
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
            <li>Click "New Layer" to create a new layer</li>
            <li>Toggle visibility with the eye icon</li>
            <li>Select a layer to make it active for adding annotations</li>
            <li>Reorder layers by dragging (affects which annotations appear on top)</li>
          </ol>
        </section>

        <section className="help-section">
          <h2>Creating Annotations</h2>
          <p>
            Annotations allow you to mark and label points of interest on your maps:
          </p>

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
            <li>Click "Edit annotations" button on the map to enable edit mode</li>
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
            <h3>Can't create annotations</h3>
            <p>
              Make sure you have selected an editable layer in the Layer Manager. 
              You cannot add annotations without an active layer selected.
            </p>
          </div>

          <div className="issue">
            <h3>Boundary won't save</h3>
            <p>
              For suburb and individual map boundaries, ensure your boundary is 
              entirely within the parent map's boundary. The system will reject 
              boundaries that extend outside their parent.
            </p>
          </div>

          <div className="issue">
            <h3>Can't edit an annotation</h3>
            <p>
              You can only edit annotations in the currently selected layer. 
              Annotations from inherited (parent) layers are read-only. Select 
              the correct layer and ensure it's editable.
            </p>
          </div>

          <div className="issue">
            <h3>Map tiles not loading</h3>
            <p>
              This usually indicates an internet connection issue or problems 
              reaching OpenStreetMap's tile servers. Check your connection and 
              try refreshing the page.
            </p>
          </div>
        </section>

        <section className="help-section">
          <h2>Need More Help?</h2>
          <p>
            If you're experiencing issues not covered here, try refreshing the page 
            or checking the browser console for error messages. For persistent issues, 
            please report them to the project repository.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Help;
