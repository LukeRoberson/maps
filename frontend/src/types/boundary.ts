/**
 * @file boundary.ts
 * 
 * @summary Type definitions for boundaries.
 * 
 * @exports Boundary
 */


/**
 * Represents a geographical boundary for a map area.
 * 
 * @remarks
 * Defines the coordinates that make up the boundary of a map area.
 * 
 * @property {number} [id] - Unique identifier for the boundary. Optional.
 * @property {number} map_area_id - Identifier of the associated map area.
 * @property {[number, number][]} coordinates - Array of latitude and longitude pairs defining the boundary.
 * @property {string} [created_at] - Timestamp of boundary creation. Optional.
 * @property {string} [updated_at] - Timestamp of last boundary update. Optional.
 */
export interface Boundary {
  id?: number;
  map_area_id: number;
  coordinates: [number, number][];
  created_at?: string;
  updated_at?: string;
}
