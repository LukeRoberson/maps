/**
 * @file annotation.ts
 * 
 * @summary Type definitions for annotations.
 * 
 * @exports Annotation
 */


/**
 * Represents an annotation within a layer.
 * 
 * @remarks
 * Defines different types of annotations such as markers, lines, polygons, and text.
 * 
 * @property {number} [id] - Unique identifier for the annotation. Optional.
 * @property {number} layer_id - Identifier of the associated layer.
 * @property {'marker' | 'line' | 'polygon' | 'text'} annotation_type - Type of the annotation.
 * @property {unknown} coordinates - Coordinates defining the annotation.
 * @property {Record<string, unknown>} style - Style configuration for the annotation.
 * @property {string} [content] - Content for text annotations. Optional.
 * @property {string} [created_at] - Timestamp of annotation creation. Optional.
 * @property {string} [updated_at] - Timestamp of last annotation update. Optional.
 */
export interface Annotation {
  id?: number;
  layer_id: number;
  annotation_type: 'marker' | 'line' | 'polygon' | 'text';
  coordinates: unknown;
  style: Record<string, unknown>;
  content?: string;
  created_at?: string;
  updated_at?: string;
}
