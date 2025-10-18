# Layer System - Visual Guide

## Layer Panel Overview

```
┌─────────────────────────────┐
│ Layers              ▼       │ ← Click to expand/collapse
├─────────────────────────────┤
│ Map Layers                  │
│                             │
│ ● 👁 Roads          ✎ 🗑   │ ← Active layer (filled circle)
│ ○ 👁 Buildings      ✎ 🗑   │ ← Inactive layer (empty circle)
│ ○ 👁‍🗨 Labels        ✎ 🗑   │ ← Hidden layer (closed eye)
│                             │
├─────────────────────────────┤
│ Inherited Layers            │
│                             │
│   👁 Master Notes [inherited]│ ← Cannot edit/delete
│                             │
├─────────────────────────────┤
│ [+ Add Layer]               │
└─────────────────────────────┘
```

## Layer States

### Active & Visible
```
● 👁 Layer Name    ✎ 🗑
^  ^
│  └─ Visible (eye open)
└─── Active (filled circle, blue text)
```
- Annotations created go to this layer
- Annotations from this layer are shown on map

### Inactive & Visible
```
○ 👁 Layer Name    ✎ 🗑
^  ^
│  └─ Visible (eye open)
└─── Inactive (empty circle)
```
- Annotations shown on map
- Cannot create new annotations here (not active)

### Inactive & Hidden
```
○ 👁‍🗨 Layer Name    ✎ 🗑
   ^
   └─ Hidden (closed eye, faded)
```
- Annotations NOT shown on map
- Layer still exists in database

### Inherited Layer
```
  👁 Layer Name  [inherited]
  ^              ^
  │              └─ Cannot edit or delete
  └─ Can toggle visibility
```
- From parent map (Master → Suburb → Individual)
- Read-only
- Can show/hide but not modify

## Annotation Creation Flow

```
Step 1: Select Active Layer
┌─────────────────────┐
│ ● 👁 Roads          │ ← Click here
└─────────────────────┘

Step 2: Draw on Map
        ╱ ╲
       ╱   ╲      ← Draw with Leaflet Geoman tools
      ╱─────╲

Step 3: Enter Label (if applicable)
┌──────────────────────────┐
│ Enter label text:        │
│ ┌──────────────────────┐ │
│ │ Main Street          │ │
│ └──────────────────────┘ │
│   [Cancel]    [OK]       │
└──────────────────────────┘

Step 4: Automatic Save
┌──────────────────────────────┐
│ ✓ Annotation saved          │ ← Toast notification
│   successfully!             │
└──────────────────────────────┘
```

## Layer Visibility Toggle

### Before (Visible)
```
Map View:
┌─────────────────────────┐
│        🏘                │
│     ═══════  ← Roads    │
│      ║   ║             │
│      ║   ║             │
│     ═══════             │
└─────────────────────────┘

Layer Panel:
● 👁 Roads
```

### After Clicking Eye Icon (Hidden)
```
Map View:
┌─────────────────────────┐
│        🏘                │
│                          │ ← Roads hidden!
│                          │
│                          │
│                          │
└─────────────────────────┘

Layer Panel:
● 👁‍🗨 Roads  ← Eye closed
```

## Active Layer Indicators

### Selection Methods

**Method 1: Click Layer Name**
```
Before:                After:
○ Roads               ● Roads  ← Now active
                         ↑
                      Blue & Bold
```

**Method 2: Click Selection Button**
```
Before:                After:
○ 👁 Roads            ● 👁 Roads  ← Filled circle
↑                     ↑
Empty                 Filled
```

### Visual Feedback

**Active Layer:**
```css
Color: Blue (#0d6efd)
Weight: Bold (600)
Button: Filled circle (●)
```

**Inactive Layer:**
```css
Color: Default (#212529)
Weight: Normal (500)
Button: Empty circle (○)
```

## Annotation Types on Map

### Marker (with label)
```
     Main Street ← Tooltip
          📍     ← Marker pin
```

### Line
```
╱━━━━━━━━━╲  ← Styled polyline
```

### Polygon (with label)
```
╱━━━━━━━━━━╲
┃  Park     ┃ ← Label in center
┃           ┃
╲━━━━━━━━━━╱
```

### Text Annotation
```
Main Street ← Text with white outline
```

## Common Workflows

### Starting Fresh
```
1. Open map
2. See "Layers" panel on left
3. Click "+ Add Layer"
4. Enter "Roads"
5. Press Enter
   → Layer created and auto-selected (●)
6. Draw annotations
   → Saved to "Roads" layer
```

### Organizing Existing Annotations
```
1. Create layers: "Roads", "Buildings", "Labels"
2. Set "Roads" as active
3. Draw all road-related annotations
4. Set "Buildings" as active
5. Draw all building-related annotations
6. Set "Labels" as active
7. Draw all labels
```

### Working with Inherited Layers
```
Master Map:
  ├─ Street Names (layer)
  └─ Major Roads (layer)

Suburb Map (inherits both):
  ├─ Street Names [inherited] ← Can view, hide/show
  ├─ Major Roads [inherited]  ← Cannot edit or delete
  └─ Local Streets (own layer) ← Can fully manage
```

### Hiding Clutter
```
Situation: Too many annotations on screen

Solution:
1. Identify less important layers
2. Click eye icon (👁) to hide
3. Work on visible layers
4. Click closed eye (👁‍🗨) to show again
```

## Keyboard Shortcuts

### Layer Management
- `Enter` - Save when creating/editing layer name
- `Escape` - Cancel when creating/editing layer name

### Annotation Creation
- `Enter` - Confirm label in prompt
- `Escape` - Cancel label prompt

## Error States

### No Active Layer Selected
```
User draws annotation without selecting layer:

┌──────────────────────────────────────┐
│ ⚠ Please select a layer before      │
│   creating annotations               │
└──────────────────────────────────────┘
```

### Attempting to Edit Inherited Layer
```
User tries to edit inherited layer:

┌──────────────────────────────────────┐
│ ⚠ This layer cannot be edited       │
│   (inherited from parent)            │
└──────────────────────────────────────┘
```

### Failed to Save Annotation
```
Network or database error:

┌──────────────────────────────────────┐
│ ✕ Failed to save annotation.        │
│   Please try again.                  │
└──────────────────────────────────────┘
```

## Tips & Best Practices

### Naming Layers
✅ Good: "Roads", "Buildings", "Water Features"  
❌ Bad: "Layer 1", "Stuff", "asdf"

### Layer Organization
- **By Type:** Roads, Buildings, Vegetation, Water
- **By Purpose:** Survey Data, Proposed Changes, Notes
- **By Status:** Existing, Planned, Temporary

### Performance
- Hide layers you're not actively using
- Fewer visible annotations = faster rendering
- Create focused layers rather than one big layer

### Inherited Layers
- Master map layers visible in all suburbs
- Suburb map layers visible in all individual maps
- Use for consistent annotations across hierarchy

---

**For more details, see:**
- `LAYER_IMPLEMENTATION.md` - Initial layer system
- `LAYER_FEATURES_EXPANSION.md` - Advanced features
- `LAYER_USAGE_GUIDE.md` - User-focused guide
