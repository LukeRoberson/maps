import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, useMap, Polygon, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { apiClient } from '@/services/api-client';
import type { MapArea, Project, Boundary } from '@/types';
import './map-editor.css';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Utility function to check if all points are within a boundary polygon
const isWithinBoundary = (
  points: [number, number][],
  boundary: [number, number][]
): boolean => {
  // Use Leaflet's polygon contains method for accurate point-in-polygon testing
  const boundaryPolygon = L.polygon(boundary);
  
  for (const point of points) {
    const latLng = L.latLng(point[0], point[1]);
    // Check if point is inside or on the boundary
    if (!boundaryPolygon.getBounds().contains(latLng)) {
      return false;
    }
    // More precise check using ray casting
    const polygonPoints = boundary.map(coord => L.latLng(coord[0], coord[1]));
    if (!isPointInPolygon(latLng, polygonPoints)) {
      return false;
    }
  }
  
  return true;
};

// Ray casting algorithm for point-in-polygon test
const isPointInPolygon = (point: L.LatLng, polygon: L.LatLng[]): boolean => {
  let inside = false;
  const x = point.lat;
  const y = point.lng;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;
    
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
};

interface DrawControlsProps {
  mode: 'boundary' | 'annotation' | 'suburb' | 'individual';
  existingBoundary?: Boundary | null;
  onBoundaryCreated?: (coordinates: [number, number][]) => void;
}

// Component to add drawing controls to the map using Leaflet Geoman
const DrawControls: React.FC<DrawControlsProps> = ({
  mode,
  existingBoundary,
  onBoundaryCreated,
}) => {
  const map = useMap();
  const editableLayerRef = useRef<L.Polygon | null>(null);
  const boundaryLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    // Store created layers for cleanup
    const createdLayers: L.Layer[] = [];

    // Initialize Geoman on the map
    map.pm.addControls({
      position: 'topright',
      drawMarker: mode === 'annotation',
      drawPolyline: mode === 'annotation',
      // Only allow drawing new boundaries if one doesn't exist
      drawRectangle: mode === 'boundary' && !existingBoundary ? true : mode !== 'boundary',
      drawPolygon: mode === 'boundary' && !existingBoundary ? true : mode !== 'boundary',
      drawCircle: false,
      drawCircleMarker: false,
      drawText: false,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: true,
    });

    // Configure drawing styles based on mode
    const color = mode === 'boundary' || mode === 'suburb' || mode === 'individual' 
      ? '#3498db' 
      : '#2ecc71';

    map.pm.setGlobalOptions({
      pathOptions: {
        color,
        fillColor: color,
        fillOpacity: 0.2,
        weight: 3,
      },
    });

    // Load existing boundary into editable layer when in boundary mode
    // Only create the polygon once per boundary edit session
    if (mode === 'boundary' && existingBoundary && !boundaryLoadedRef.current) {
      const polygon = L.polygon(existingBoundary.coordinates, {
        color: '#3498db',
        weight: 3,
        fillColor: '#3498db',
        fillOpacity: 0.2,
        smoothFactor: 1,
      }).addTo(map);
      
      editableLayerRef.current = polygon;
      boundaryLoadedRef.current = true;
      createdLayers.push(polygon);
      
      // Enable editing for this layer with Geoman
      polygon.pm.enable({
        allowSelfIntersection: false,
        preventMarkerRemoval: false,
        snappable: true,
        snapDistance: 20,
      });
      
      // Listen to vertex drag events for real-time updates
      polygon.on('pm:vertexadded pm:vertexremoved pm:markerdrag pm:markerdragend', () => {
        // Force redraw during vertex manipulation
        polygon.redraw();
      });
      
      // Listen to edit events on this specific layer
      polygon.on('pm:edit', (e: any) => {
        console.log('Boundary edited!', e);
        if (onBoundaryCreated) {
          const geoJSON = polygon.toGeoJSON();
          if (geoJSON.geometry.type === 'Polygon') {
            const coordinates = geoJSON.geometry.coordinates[0].map(
              (coord: number[]) => [coord[1], coord[0]] as [number, number]
            );
            console.log('New coordinates:', coordinates);
            onBoundaryCreated(coordinates);
          }
        }
      });
    }

    // Handle shape creation
    const handleCreate = (e: any) => {
      const layer = e.layer;
      createdLayers.push(layer);

      if ((mode === 'boundary' || mode === 'suburb' || mode === 'individual') && onBoundaryCreated) {
        // Extract coordinates from the drawn shape
        const geoJSON = layer.toGeoJSON();
        let coordinates: [number, number][] = [];

        if (geoJSON.geometry.type === 'Polygon') {
          // Get the outer ring coordinates
          coordinates = geoJSON.geometry.coordinates[0].map(
            (coord: number[]) => [coord[1], coord[0]] as [number, number]
          );
        }

        onBoundaryCreated(coordinates);
      } else {
        console.log('Shape created:', e.shape, layer.toGeoJSON());
      }
    };

    map.on('pm:create', handleCreate);

    // Cleanup on unmount or mode change
    return () => {
      map.off('pm:create', handleCreate);
      map.pm.removeControls();
      
      // Clear the refs when cleaning up
      if (editableLayerRef.current && map.hasLayer(editableLayerRef.current)) {
        map.removeLayer(editableLayerRef.current);
      }
      editableLayerRef.current = null;
      boundaryLoadedRef.current = false;
      
      // Remove all layers created by this component
      createdLayers.forEach(layer => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
    };
  }, [map, mode, onBoundaryCreated, existingBoundary]);

  // Reset the loaded flag when existingBoundary changes
  useEffect(() => {
    boundaryLoadedRef.current = false;
  }, [existingBoundary]);

  return null;
};

// Component to capture map instance for setting default view
interface MapViewControllerProps {
  onMapReady: (map: L.Map) => void;
}

const MapViewController: React.FC<MapViewControllerProps> = ({ onMapReady }) => {
  const map = useMap();
  
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  
  return null;
};

// Component to add a fade overlay outside the boundary
interface BoundaryFadeOverlayProps {
  boundary: Boundary;
}

const BoundaryFadeOverlay: React.FC<BoundaryFadeOverlayProps> = ({ boundary }) => {
  const map = useMap();
  const overlayLayerRef = useRef<L.Polygon | null>(null);

  useEffect(() => {
    // Create a world-sized polygon with a hole for the boundary
    // This creates the inverse mask effect
    const worldBounds = [
      [-90, -180],
      [-90, 180],
      [90, 180],
      [90, -180],
      [-90, -180],
    ] as [number, number][];

    // Create a polygon with a hole (the boundary area)
    // The first array is the outer ring (world), the second is the hole (boundary)
    const polygonWithHole = L.polygon(
      [worldBounds, boundary.coordinates],
      {
        color: 'transparent',
        fillColor: '#ffffff',
        fillOpacity: 0.4,
        interactive: false,
        pane: 'overlayPane',
      }
    );

    // Add to map
    polygonWithHole.addTo(map);
    overlayLayerRef.current = polygonWithHole;

    // Update map events to detect when we need to update the overlay
    const updateOverlay = (): void => {
      // Force redraw if needed
      if (overlayLayerRef.current) {
        overlayLayerRef.current.redraw();
      }
    };

    map.on('zoomend moveend', updateOverlay);

    // Cleanup
    return () => {
      map.off('zoomend moveend', updateOverlay);
      if (overlayLayerRef.current) {
        map.removeLayer(overlayLayerRef.current);
        overlayLayerRef.current = null;
      }
    };
  }, [map, boundary]);

  return null;
};

const MapEditor: React.FC = () => {
  const { projectId, mapAreaId } = useParams<{
    projectId: string;
    mapAreaId: string;
  }>();
  const [project, setProject] = useState<Project | null>(null);
  const [mapArea, setMapArea] = useState<MapArea | null>(null);
  const [boundary, setBoundary] = useState<Boundary | null>(null);
  const [parentMapArea, setParentMapArea] = useState<MapArea | null>(null);
  const [parentBoundary, setParentBoundary] = useState<Boundary | null>(null);
  const [suburbs, setSuburbs] = useState<MapArea[]>([]);
  const [suburbBoundaries, setSuburbBoundaries] = useState<Record<number, Boundary>>({});
  const [individuals, setIndividuals] = useState<MapArea[]>([]);
  const [individualBoundaries, setIndividualBoundaries] = useState<Record<number, Boundary>>({});
  const [mode, setMode] = useState<'boundary' | 'annotation' | 'suburb' | 'individual'>('annotation');
  const [loading, setLoading] = useState(true);
  const [suburbName, setSuburbName] = useState('');
  const [showSuburbDialog, setShowSuburbDialog] = useState(false);
  const [pendingSuburbCoordinates, setPendingSuburbCoordinates] = useState<[number, number][] | null>(null);
  const [individualName, setIndividualName] = useState('');
  const [showIndividualDialog, setShowIndividualDialog] = useState(false);
  const [pendingIndividualCoordinates, setPendingIndividualCoordinates] = useState<[number, number][] | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [pendingBoundaryEdit, setPendingBoundaryEdit] = useState<[number, number][] | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadMapData();
  }, [projectId, mapAreaId]);

  const loadMapData = async (): Promise<void> => {
    if (!projectId || !mapAreaId) return;

    try {
      const [projectData, mapAreaData] = await Promise.all([
        apiClient.getProject(parseInt(projectId)),
        apiClient.getMapArea(parseInt(mapAreaId)),
      ]);
      setProject(projectData);
      setMapArea(mapAreaData);

      // Load boundary if it exists
      try {
        const boundaryData = await apiClient.getBoundaryByMapArea(
          parseInt(mapAreaId)
        );
        setBoundary(boundaryData);
      } catch (error) {
        // Boundary might not exist yet, that's ok
        console.log('No boundary found for this map area');
      }

      // If this is a suburb or individual map, load the parent (master or suburb) boundary
      if (mapAreaData.parent_id) {
        try {
          const parentData = await apiClient.getMapArea(mapAreaData.parent_id);
          setParentMapArea(parentData);
          
          // Load parent boundary
          try {
            const parentBoundaryData = await apiClient.getBoundaryByMapArea(
              mapAreaData.parent_id
            );
            setParentBoundary(parentBoundaryData);
          } catch (error) {
            console.log('No boundary found for parent map area');
          }
        } catch (error) {
          console.error('Failed to load parent map area:', error);
        }
      } else {
        // Clear parent data if this is a master map
        setParentMapArea(null);
        setParentBoundary(null);
      }

      // Load child map areas based on type
      if (mapAreaData.area_type === 'master') {
        // Load suburbs for master maps
        try {
          const suburbsData = await apiClient.listMapAreas(
            parseInt(projectId),
            parseInt(mapAreaId)
          );
          setSuburbs(suburbsData);

          // Load boundaries for each suburb
          const boundaries: Record<number, Boundary> = {};
          await Promise.all(
            suburbsData.map(async (suburb) => {
              try {
                const suburbBoundary = await apiClient.getBoundaryByMapArea(
                  suburb.id!
                );
                if (suburbBoundary) {
                  boundaries[suburb.id!] = suburbBoundary;
                }
              } catch (error) {
                console.log(`No boundary for suburb ${suburb.id}`);
              }
            })
          );
          setSuburbBoundaries(boundaries);
        } catch (error) {
          console.error('Failed to load suburbs:', error);
        }
      } else if (mapAreaData.area_type === 'suburb') {
        // Load individuals for suburb maps
        try {
          const individualsData = await apiClient.listMapAreas(
            parseInt(projectId),
            parseInt(mapAreaId)
          );
          setIndividuals(individualsData);

          // Load boundaries for each individual map
          const boundaries: Record<number, Boundary> = {};
          await Promise.all(
            individualsData.map(async (individual) => {
              try {
                const individualBoundary = await apiClient.getBoundaryByMapArea(
                  individual.id!
                );
                if (individualBoundary) {
                  boundaries[individual.id!] = individualBoundary;
                }
              } catch (error) {
                console.log(`No boundary for individual ${individual.id}`);
              }
            })
          );
          setIndividualBoundaries(boundaries);
        } catch (error) {
          console.error('Failed to load individuals:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBoundaryCreated = useCallback(async (
    coordinates: [number, number][]
  ): Promise<void> => {
    if (!mapAreaId) return;

    if (mode === 'suburb') {
      // Validate that suburb is within master boundary
      if (boundary && !isWithinBoundary(coordinates, boundary.coordinates)) {
        alert('Error: Suburb boundary must be completely within the master map boundary. Please draw within the red boundary.');
        return;
      }
      // Store coordinates and show dialog to name the suburb
      setPendingSuburbCoordinates(coordinates);
      setShowSuburbDialog(true);
      return;
    }

    if (mode === 'individual') {
      // Validate that individual map is within suburb boundary
      if (boundary && !isWithinBoundary(coordinates, boundary.coordinates)) {
        alert('Error: Individual map boundary must be completely within the suburb boundary. Please draw within the blue boundary.');
        return;
      }
      // Store coordinates and show dialog to name the individual map
      setPendingIndividualCoordinates(coordinates);
      setShowIndividualDialog(true);
      return;
    }

    // In boundary mode with existing boundary, store pending edit
    if (mode === 'boundary') {
      if (boundary) {
        setPendingBoundaryEdit(coordinates);
        return;
      } else {
        // Create new boundary
        try {
          const created = await apiClient.createBoundary({
            map_area_id: parseInt(mapAreaId),
            coordinates,
          });
          setBoundary(created);
          alert('Boundary created successfully!');
          setMode('annotation');
        } catch (error) {
          console.error('Failed to create boundary:', error);
          alert('Failed to create boundary. Please try again.');
        }
      }
    }
  }, [mapAreaId, mode, boundary]);

  const handleCreateSuburb = async (): Promise<void> => {
    if (!projectId || !suburbName || !pendingSuburbCoordinates) return;

    try {
      // Create the suburb map area
      const suburb = await apiClient.createMapArea({
        project_id: parseInt(projectId),
        parent_id: parseInt(mapAreaId!),
        name: suburbName,
        area_type: 'suburb',
      });

      // Create the boundary for the suburb
      await apiClient.createBoundary({
        map_area_id: suburb.id!,
        coordinates: pendingSuburbCoordinates,
      });

      alert(`Suburb "${suburbName}" created successfully!`);
      
      // Reset state
      setShowSuburbDialog(false);
      setSuburbName('');
      setPendingSuburbCoordinates(null);
      setMode('annotation');

      // Reload map data to show the new suburb
      loadMapData();
    } catch (error) {
      console.error('Failed to create suburb:', error);
      alert('Failed to create suburb. Please try again.');
    }
  };

  const handleCancelSuburb = (): void => {
    setShowSuburbDialog(false);
    setSuburbName('');
    setPendingSuburbCoordinates(null);
    setMode('annotation');
  };

  const saveBoundaryEdit = async (): Promise<void> => {
    if (!boundary || !pendingBoundaryEdit) return;

    try {
      const updated = await apiClient.updateBoundary(
        boundary.id!,
        pendingBoundaryEdit
      );
      setBoundary(updated);
      setPendingBoundaryEdit(null);
      setMode('annotation');
      alert('Boundary updated successfully!');
    } catch (error) {
      console.error('Failed to save boundary:', error);
      alert('Failed to save boundary. Please try again.');
    }
  };

  const cancelBoundaryEdit = (): void => {
    setPendingBoundaryEdit(null);
    setMode('annotation');
    // Reload to reset the boundary display
    loadMapData();
  };

  const handleCreateIndividual = async (): Promise<void> => {
    if (!projectId || !individualName || !pendingIndividualCoordinates) return;

    try {
      // Create the individual map area
      const individual = await apiClient.createMapArea({
        project_id: parseInt(projectId),
        parent_id: parseInt(mapAreaId!),
        name: individualName,
        area_type: 'individual',
      });

      // Create the boundary for the individual map
      await apiClient.createBoundary({
        map_area_id: individual.id!,
        coordinates: pendingIndividualCoordinates,
      });

      alert(`Individual map "${individualName}" created successfully!`);
      
      // Reset state
      setShowIndividualDialog(false);
      setIndividualName('');
      setPendingIndividualCoordinates(null);
      setMode('annotation');

      // Reload map data to show the new individual map
      loadMapData();
    } catch (error) {
      console.error('Failed to create individual map:', error);
      alert('Failed to create individual map. Please try again.');
    }
  };

  const handleCancelIndividual = (): void => {
    setShowIndividualDialog(false);
    setIndividualName('');
    setPendingIndividualCoordinates(null);
    setMode('annotation');
  };

  const startRenaming = (): void => {
    setIsEditingName(true);
    setEditingName(mapArea?.name || '');
  };

  const cancelRenaming = (): void => {
    setIsEditingName(false);
    setEditingName('');
  };

  const handleRename = async (): Promise<void> => {
    if (!mapAreaId || !editingName.trim()) {
      cancelRenaming();
      return;
    }

    try {
      const updated = await apiClient.updateMapArea(parseInt(mapAreaId), {
        name: editingName.trim(),
      });
      setMapArea(updated);
      cancelRenaming();
    } catch (error) {
      console.error('Failed to rename map:', error);
      alert('Failed to rename. Please try again.');
    }
  };

  const handleExport = async (): Promise<void> => {
    alert('Export functionality will capture the map as PNG');
  };

  const handleSetDefaultView = async (): Promise<void> => {
    if (!mapInstance || !mapAreaId) return;

    const center = mapInstance.getCenter();
    const zoom = mapInstance.getZoom();

    try {
      const updated = await apiClient.updateMapArea(parseInt(mapAreaId), {
        default_center_lat: center.lat,
        default_center_lon: center.lng,
        default_zoom: zoom,
      });
      setMapArea(updated);
      alert(`Default view saved!\nCenter: ${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}\nZoom: ${zoom}`);
    } catch (error) {
      console.error('Failed to set default view:', error);
      alert('Failed to save default view. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading map...</div>;
  }

  if (!project || !mapArea) {
    return <div className="error">Map not found</div>;
  }

  return (
    <div className="map-editor-page">
      <div className="editor-header">
        <div>
          {isEditingName ? (
            <input
              type="text"
              className="editor-title-input"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                } else if (e.key === 'Escape') {
                  cancelRenaming();
                }
              }}
              onBlur={handleRename}
              autoFocus
            />
          ) : (
            <h2 onDoubleClick={startRenaming}>
              {mapArea.name}
              <button
                className="btn-icon"
                onClick={startRenaming}
                title="Rename"
              >
                ✏️
              </button>
            </h2>
          )}
          <p className="breadcrumb">
            {project.name} / {mapArea.area_type}
          </p>
          {boundary && (
            <p className="boundary-status">
              ✓ Boundary defined ({boundary.coordinates.length} points)
            </p>
          )}
          {parentBoundary && (mapArea.area_type === 'suburb' || mapArea.area_type === 'individual') && (
            <p className="boundary-status" style={{ color: '#e74c3c' }}>
              ⓘ {parentMapArea?.area_type === 'master' ? 'Master' : 'Suburb'} boundary shown (dashed lines)
            </p>
          )}
          {mapArea.default_center_lat && mapArea.default_center_lon && (
            <p className="boundary-status">
              ✓ Default view set (zoom {mapArea.default_zoom})
            </p>
          )}
        </div>
        <div className="editor-actions">
          {mode === 'boundary' && pendingBoundaryEdit ? (
            <>
              <button
                className="btn btn-success"
                onClick={saveBoundaryEdit}
              >
                Save Boundary
              </button>
              <button
                className="btn btn-outline"
                onClick={cancelBoundaryEdit}
              >
                Cancel
              </button>
              <p className="mode-hint">
                Changes detected. Click "Save Boundary" to keep your edits.
              </p>
            </>
          ) : mode === 'boundary' ? (
            <>
              <button
                className="btn btn-outline"
                onClick={() => setMode('annotation')}
              >
                Cancel
              </button>
              <p className="mode-hint">
                {boundary
                  ? 'Click "Edit layers" button on the map to modify the boundary'
                  : 'Draw a polygon or rectangle to define the boundary'}
              </p>
            </>
          ) : mode === 'suburb' ? (
            <>
              <button
                className="btn btn-outline"
                onClick={() => setMode('annotation')}
              >
                Cancel
              </button>
              <p className="mode-hint">
                Draw a polygon or rectangle to define the suburb boundary
              </p>
            </>
          ) : mode === 'individual' ? (
            <>
              <button
                className="btn btn-outline"
                onClick={() => setMode('annotation')}
              >
                Cancel
              </button>
              <p className="mode-hint">
                Draw a polygon or rectangle to define the individual map boundary
              </p>
            </>
          ) : (
            <>
              {mapArea.area_type === 'master' && (
                <button
                  className="btn btn-success"
                  onClick={() => setMode('suburb')}
                >
                  Add Suburb
                </button>
              )}
              {mapArea.area_type === 'suburb' && (
                <button
                  className="btn btn-success"
                  onClick={() => setMode('individual')}
                >
                  Add Individual Map
                </button>
              )}
              <button
                className="btn btn-primary"
                onClick={() => setMode('boundary')}
              >
                {boundary ? 'Edit Boundary' : 'Define Boundary'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleSetDefaultView}
                title="Set current map view as default for this map"
              >
                Set Default View
              </button>
              <button className="btn btn-success" onClick={handleExport}>
                Export PNG
              </button>
              <button
                className="btn btn-outline"
                onClick={() => navigate(`/projects/${projectId}`)}
              >
                Back to Project
              </button>
            </>
          )}
        </div>
      </div>

      <div className="map-container">
        <MapContainer
          key={`map-${mapAreaId}`}
          center={[
            mapArea.default_center_lat ?? project.center_lat,
            mapArea.default_center_lon ?? project.center_lon,
          ]}
          zoom={mapArea.default_zoom ?? project.zoom_level}
          style={{ height: '100%', width: '100%' }}
        >
          <MapViewController onMapReady={setMapInstance} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {boundary && mode !== 'boundary' && mapArea.area_type === 'master' && (
            <BoundaryFadeOverlay boundary={boundary} />
          )}
          {parentBoundary && mode !== 'boundary' && (mapArea.area_type === 'suburb' || mapArea.area_type === 'individual') && (
            <>
              <BoundaryFadeOverlay boundary={parentBoundary} />
              <Polygon
                positions={parentBoundary.coordinates}
                pathOptions={{
                  color: '#e74c3c',
                  weight: 3,
                  fillColor: 'transparent',
                  fillOpacity: 0,
                  dashArray: '10, 10',
                }}
              />
            </>
          )}
          {boundary && mode !== 'boundary' && (
            <Polygon
              positions={boundary.coordinates}
              pathOptions={{
                color: '#e74c3c',
                weight: 3,
                fillColor: '#e74c3c',
                fillOpacity: 0.1,
              }}
            />
          )}
          {Object.entries(suburbBoundaries).map(([suburbId, suburbBoundary]) => {
            const suburb = suburbs.find(s => s.id === parseInt(suburbId));
            return (
              <Polygon
                key={suburbId}
                positions={suburbBoundary.coordinates}
                pathOptions={{
                  color: '#3498db',
                  weight: 2,
                  fillColor: '#3498db',
                  fillOpacity: 0.15,
                }}
                eventHandlers={{
                  click: () => {
                    if (confirm(`Open ${suburb?.name || 'this suburb'}?`)) {
                      navigate(`/projects/${projectId}/maps/${suburbId}`);
                    }
                  },
                }}
              >
                <Tooltip>{suburb?.name || 'Unnamed Suburb'}</Tooltip>
              </Polygon>
            );
          })}
          {Object.entries(individualBoundaries).map(([individualId, individualBoundary]) => {
            const individual = individuals.find(i => i.id === parseInt(individualId));
            return (
              <Polygon
                key={individualId}
                positions={individualBoundary.coordinates}
                pathOptions={{
                  color: '#2ecc71',
                  weight: 2,
                  fillColor: '#2ecc71',
                  fillOpacity: 0.15,
                }}
                eventHandlers={{
                  click: () => {
                    if (confirm(`Open ${individual?.name || 'this map'}?`)) {
                      navigate(`/projects/${projectId}/maps/${individualId}`);
                    }
                  },
                }}
              >
                <Tooltip>{individual?.name || 'Unnamed Map'}</Tooltip>
              </Polygon>
            );
          })}
          <DrawControls
            mode={mode}
            existingBoundary={
              mode === 'boundary' && boundary
                ? {
                    ...boundary,
                    coordinates: pendingBoundaryEdit || boundary.coordinates,
                  }
                : null
            }
            onBoundaryCreated={handleBoundaryCreated}
          />
        </MapContainer>
      </div>

      {showSuburbDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Create Suburb</h3>
            <p>Enter a name for this suburb:</p>
            <input
              type="text"
              className="input"
              placeholder="Suburb name"
              value={suburbName}
              onChange={(e) => setSuburbName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && suburbName) {
                  handleCreateSuburb();
                }
              }}
              autoFocus
            />
            <div className="dialog-actions">
              <button
                className="btn btn-outline"
                onClick={handleCancelSuburb}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateSuburb}
                disabled={!suburbName}
              >
                Create Suburb
              </button>
            </div>
          </div>
        </div>
      )}

      {showIndividualDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Create Individual Map</h3>
            <p>Enter a name for this map:</p>
            <input
              type="text"
              className="input"
              placeholder="Map name"
              value={individualName}
              onChange={(e) => setIndividualName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && individualName) {
                  handleCreateIndividual();
                }
              }}
              autoFocus
            />
            <div className="dialog-actions">
              <button
                className="btn btn-outline"
                onClick={handleCancelIndividual}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateIndividual}
                disabled={!individualName}
              >
                Create Map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapEditor;
