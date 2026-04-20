/**
 * @fileoverview Component that captures user interactions with the map and updates the map view accordingly.
 * 
 * @remarks
 * Any additional comments about the file
 * 
 * @exports MapViewController
 */


// External dependencies
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

// Types
import type { MapViewControllerProps } from './types';


const MapViewController: React.FC<MapViewControllerProps> = ({ onMapReady }) => {
  const map = useMap();
  
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  
  return null;
};


export default MapViewController;
