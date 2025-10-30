/**
 * @file layer.ts
 * 
 * @summary Type definitions for layers.
 * 
 * @exports Layer
 */


/**
 * Represents a layer within a map.
 * 
 * @remarks
 * Defines different types of layers such as annotation and custom layers.
 * 
 * @property {number} [id] - Unique identifier for the layer. Optional.
 * @property {number} map_area_id - Identifier of the associated map area.
 * @property {number} [parent_layer_id] - Identifier of the parent layer, if applicable. Optional.
 * @property {string} name - Name of the layer.
 * @property {'annotation' | 'custom'} layer_type - Type of the layer.
 * @property {boolean} visible - Visibility status of the layer.
 * @property {number} z_index - Z-index for layer stacking order.
 * @property {boolean} is_editable - Indicates if the layer is editable.
 * @property {Record<string, unknown>} config - Configuration object for the layer.
 * @property {string} [created_at] - Timestamp of layer creation. Optional.
 * @property {string} [updated_at] - Timestamp of last layer update. Optional.
 */
export interface Layer {
  id?: number;
  map_area_id: number;
  parent_layer_id?: number;
  name: string;
  layer_type: 'annotation' | 'custom';
  visible: boolean;
  z_index: number;
  is_editable: boolean;
  config: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}
