/**
 * @file utils/geometry.ts
 * 
 * @summary Geometry utility functions.
 * 
 * @exports isWithinBoundary
 */


// External Libraries
import L from 'leaflet';


/**
 * @function isWithinBoundary
 * 
 * @summary
 * Checks if all given points are within the specified boundary.
 * @param {object} points 
 * @param {object} boundary 
 * @returns 
 */
export const isWithinBoundary = (
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

