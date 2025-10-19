## Fix: Prevent Creating Annotations When All Layers Are Deleted

### Problem
When all layers were deleted, the UI still allowed users to create new annotations. These annotations would appear in the UI but fail to save with a "failed to save annotation" error. Upon refresh, they would disappear since they weren't persisted in the database.

### Root Cause
1. **Backend**: The `AnnotationService.create_annotation()` method didn't validate that the layer exists before attempting to insert the annotation into the database.
2. **Frontend**: The active layer state wasn't being cleared when all layers were deleted, allowing the UI to show drawing tools even though no valid layer was available.

### Solution

#### Backend Changes: `services/annotation_service.py`
Added validation in `create_annotation()` method to:
1. Check if the layer exists before creating an annotation
2. Check if the layer is editable (preventing annotations on read-only/inherited layers)
3. Raise `ValueError` with a descriptive message if validation fails

```python
# Validate that the layer exists
layer_query = "SELECT id, is_editable FROM layers WHERE id = ?"
layer_row = self.db.fetchone(
    layer_query,
    (annotation.layer_id,)
)

if not layer_row:
    raise ValueError(
        f"Layer with ID {annotation.layer_id} does not exist"
    )

if not layer_row['is_editable']:
    raise ValueError(
        "Cannot create annotations on read-only layers"
    )
```

#### Backend Changes: `routes/annotations.py`
Updated error handling in `create_annotation()` route to properly catch and return `ValueError` exceptions with 400 status code.

#### Frontend Changes: `frontend/src/pages/map-editor.tsx`

**Change 1: Reset active layer when all layers are deleted**
- Modified `loadLayers()` to set `activeLayerId` to `null` when there are no editable layers
- This prevents the drawing UI from being available when there's nowhere to save annotations

```typescript
setActiveLayerId(currentActiveId => {
  // If there are no editable layers, clear the active layer
  if (editableLayers.length === 0) {
    return null;
  }
  // ... rest of logic
});
```

**Change 2: Improved error messages from backend**
- Modified `handleAnnotationCreated()` to extract and display the specific error message from the backend
- This helps users understand why their annotation failed (e.g., "Layer with ID 999 does not exist" or "Cannot create annotations on read-only layers")

```typescript
let errorMessage = 'Failed to save annotation. Please try again.';
if (error instanceof Error && 'response' in error) {
  const response = (error as any).response?.data;
  if (response?.error) {
    errorMessage = response.error;
  }
}
showToast(errorMessage, 'error');
```

### User Experience Improvements
1. **Prevention**: When all layers are deleted, the drawing tools are disabled (no active layer means no drawing interface)
2. **Clear Feedback**: If somehow a user tries to create an annotation with a non-existent layer, they get a clear error message explaining what happened
3. **No Orphaned Annotations**: Annotations can never be created on layers that don't exist or are read-only

### Testing Scenarios
1. ✅ Create layer → Create annotation → Success
2. ✅ Try to create annotation with layer ID 999 → Error: "Layer with ID 999 does not exist"
3. ✅ Delete all layers → Drawing UI is disabled
4. ✅ Inherited layers are read-only → Cannot create annotations on them → Error: "Cannot create annotations on read-only layers"
