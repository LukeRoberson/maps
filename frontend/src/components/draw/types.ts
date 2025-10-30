/**
 * @file draw/types.ts
 * 
 * @summary Type definitions for drawing tools.
 * 
 * @exports DrawControlsProps
 */


import type { Boundary } from '@/components/boundary/types';
import type { Annotation } from '@/components/annotation/types';
import type { Layer } from '@/components/layer/types';
import type { ToastType } from '@/components/map/types';


/**
 * @interface DrawControlsProps
 * 
 * @summary Props for DrawControls component.
 * @property {'boundary' | 'annotation' | 'suburb' | 'individual'} mode - Drawing mode.
 * @property {Boundary | null} [existingBoundary] - Existing boundary to edit, if any.
 * @property {(coordinates: [number, number][]) => void} [onBoundaryCreated] - Callback when a boundary is created.
 * @property {(message: string, type: ToastType) => void} [showToast] - Function to show toast notifications.
 * @property {number | null} [activeLayerId] - Currently active layer ID for annotations.
 * @property {(annotation: Annotation) => void} [onAnnotationCreated] - Callback when an annotation is created.
 * @property {Layer[]} [layers] - List of layers for color reference.
 */
export interface DrawControlsProps {
  mode: 'boundary' | 'annotation' | 'suburb' | 'individual';
  existingBoundary?: Boundary | null;
  onBoundaryCreated?: (coordinates: [number, number][]) => void;
  showToast?: (message: string, type: ToastType) => void;
  activeLayerId?: number | null;
  onAnnotationCreated?: (annotation: Annotation) => void;
  layers?: Layer[];
}
