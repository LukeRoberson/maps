# Layer Management System - Quick Start Guide

## Overview

The layer management system allows you to organize your map annotations into separate layers. Each layer can be shown, hidden, renamed, or deleted independently.

## Features

✅ Create multiple annotation layers per map  
✅ Rename layers with inline editing  
✅ Delete layers (with confirmation)  
✅ Toggle layer visibility  
✅ Inherit layers from parent maps  
✅ Collapsible panel to save screen space  

## How to Use

### Accessing the Layer Manager

1. Open any map in the editor
2. Look for the **"Layers"** panel on the left sidebar
3. Click to expand or collapse the panel

### Creating a Layer

1. Click the **"+ Add Layer"** button at the bottom of the panel
2. Type a name for your layer (e.g., "Roads", "Buildings", "Labels")
3. Press **Enter** or click **"Create"**
4. Your new layer will appear in the list

### Renaming a Layer

1. Click the **edit icon (✎)** next to the layer name
2. Type the new name
3. Press **Enter** to save or **Escape** to cancel

### Deleting a Layer

1. Click the **delete icon (🗑)** next to the layer
2. Confirm the deletion when prompted
3. **Note:** This will also delete all annotations in the layer!

### Showing/Hiding a Layer

1. Click the **eye icon (👁)** next to the layer
2. The icon will change to indicate visibility:
   - **Open eye (👁)** = Layer is visible
   - **Closed eye** = Layer is hidden

## Understanding Layer Types

### Map Layers (Editable)
- Created on the current map
- Can be renamed and deleted
- Shown in the "Map Layers" section

### Inherited Layers (Read-Only)
- Come from parent maps (Master → Suburb → Individual)
- Cannot be edited or deleted
- Have an "inherited" badge
- Shown in the "Inherited Layers" section
- Can still be shown/hidden

## Tips

- **Keyboard Shortcuts:**
  - Press **Enter** to save when editing/creating
  - Press **Escape** to cancel
  
- **Organization:**
  - Create layers for different types of annotations (e.g., "Roads", "Buildings", "Notes")
  - Use descriptive names to keep track of what's in each layer
  
- **Visibility:**
  - Hide layers you're not currently working on to reduce clutter
  - Visibility state is saved automatically

## Coming Soon

The following features are planned:
- Select active layer for new annotations
- Edit annotations within a layer
- Reorder layers with drag and drop
- Export/import layers

## Troubleshooting

**Q: I can't edit or delete a layer**  
A: The layer is inherited from a parent map. You can only hide/show inherited layers.

**Q: My layers disappeared after refreshing**  
A: Layers are saved to the database. If they disappeared, there may be a connection issue.

**Q: Can I move annotations between layers?**  
A: Not yet - this feature is planned for a future update.

**Q: How do I add annotations to a layer?**  
A: Annotation-to-layer linking is coming in the next phase of development.

## Technical Notes

- Layers are stored per map area (not per project)
- Each layer has its own visibility and z-index
- Layer inheritance follows the map hierarchy
- All changes are saved immediately via AJAX

## Need Help?

If you encounter issues or have questions:
1. Check the browser console for errors
2. Ensure the Flask backend is running
3. Verify you're using a supported browser
4. Check that you have edit permissions for the map

---

**Version:** 1.0  
**Last Updated:** 2025-10-18
