import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, useMap, Polygon, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import { apiClient } from '@/services/api-client';
import type { MapArea, Project, Boundary } from '@/types';
import './map-editor.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface DrawControlsProps {
  mode: 'boundary' | 'annotation' | 'suburb' | 'individual';
  existingBoundary?: Boundary | null;
  onBoundaryCreated?: (coordinates: [number, number][]) => void;
}

// Component to add drawing controls to the map
const DrawControls: React.FC<DrawControlsProps> = ({
  mode,
  existingBoundary,
  onBoundaryCreated,
}) => {
  const map = useMap();

  useEffect(() => {
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // Load existing boundary into editable layer when in boundary mode
    if (mode === 'boundary' && existingBoundary) {
      const polygon = L.polygon(existingBoundary.coordinates, {
        color: '#3498db',
        weight: 3,
        fillColor: '#3498db',
        fillOpacity: 0.2,
      });
      drawnItems.addLayer(polygon);
    }

    // Configure draw control based on mode
    const drawConfig =
      mode === 'boundary' || mode === 'suburb' || mode === 'individual'
        ? {
            position: 'topright' as const,
            draw: {
              polygon: {
                allowIntersection: false,
                showArea: true,
              },
              rectangle: {
                showArea: true,
              },
              polyline: false,
              circle: false,
              circlemarker: false,
              marker: false,
            },
            edit: {
              featureGroup: drawnItems,
              remove: true,
            },
          }
        : {
            position: 'topright' as const,
            draw: {
              polygon: {
                allowIntersection: false,
                showArea: true,
              },
              polyline: true,
              rectangle: true,
              circle: false,
              circlemarker: false,
              marker: true,
            },
            edit: {
              featureGroup: drawnItems,
              remove: true,
            },
          };

    const drawControl = new L.Control.Draw(drawConfig);
    map.addControl(drawControl);

    // Handle draw events
    map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);

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
        console.log('Shape created:', e.layerType, layer.toGeoJSON());
      }
    });

    map.on(L.Draw.Event.EDITED, (e: any) => {
      if ((mode === 'boundary' || mode === 'suburb' || mode === 'individual') && onBoundaryCreated) {
        // Handle edited boundary
        const layers = e.layers;
        layers.eachLayer((layer: any) => {
          const geoJSON = layer.toGeoJSON();
          if (geoJSON.geometry.type === 'Polygon') {
            const coordinates = geoJSON.geometry.coordinates[0].map(
              (coord: number[]) => [coord[1], coord[0]] as [number, number]
            );
            onBoundaryCreated(coordinates);
          }
        });
      } else {
        console.log('Shapes edited:', e.layers);
      }
    });

    map.on(L.Draw.Event.DELETED, (e: any) => {
      console.log('Shapes deleted:', e.layers);
    });

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, mode, existingBoundary, onBoundaryCreated]);

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

  const handleBoundaryCreated = async (
    coordinates: [number, number][]
  ): Promise<void> => {
    if (!mapAreaId) return;

    if (mode === 'suburb') {
      // Store coordinates and show dialog to name the suburb
      setPendingSuburbCoordinates(coordinates);
      setShowSuburbDialog(true);
      return;
    }

    if (mode === 'individual') {
      // Store coordinates and show dialog to name the individual map
      setPendingIndividualCoordinates(coordinates);
      setShowIndividualDialog(true);
      return;
    }

    try {
      if (boundary) {
        // Update existing boundary
        const updated = await apiClient.updateBoundary(
          boundary.id!,
          coordinates
        );
        setBoundary(updated);
        alert('Boundary updated successfully!');
      } else {
        // Create new boundary
        const created = await apiClient.createBoundary({
          map_area_id: parseInt(mapAreaId),
          coordinates,
        });
        setBoundary(created);
        alert('Boundary created successfully!');
      }

      // Switch back to annotation mode
      setMode('annotation');
    } catch (error) {
      console.error('Failed to save boundary:', error);
      alert('Failed to save boundary. Please try again.');
    }
  };

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

  const handleExport = async (): Promise<void> => {
    alert('Export functionality will capture the map as PNG');
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
          <h2>{mapArea.name}</h2>
          <p className="breadcrumb">
            {project.name} / {mapArea.area_type}
          </p>
          {boundary && (
            <p className="boundary-status">
              ✓ Boundary defined ({boundary.coordinates.length} points)
            </p>
          )}
        </div>
        <div className="editor-actions">
          {mode === 'boundary' ? (
            <>
              <button
                className="btn btn-outline"
                onClick={() => setMode('annotation')}
              >
                Cancel
              </button>
              <p className="mode-hint">
                {boundary
                  ? 'Click "Edit layers" button on the map, then modify the boundary and click "Save"'
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
          center={[project.center_lat, project.center_lon]}
          zoom={project.zoom_level}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
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
            existingBoundary={mode === 'boundary' ? boundary : null}
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
