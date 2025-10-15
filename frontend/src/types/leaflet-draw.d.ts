/**
 * Type declarations for leaflet-draw
 * Extends the Leaflet namespace with Draw functionality
 */

import * as L from 'leaflet';

declare module 'leaflet' {
  namespace Control {
    class Draw extends Control {
      constructor(options?: DrawOptions);
    }
  }

  namespace Draw {
    namespace Event {
      const CREATED: string;
      const EDITED: string;
      const DELETED: string;
      const DRAWSTART: string;
      const DRAWSTOP: string;
      const DRAWVERTEX: string;
      const EDITSTART: string;
      const EDITSTOP: string;
      const DELETESTART: string;
      const DELETESTOP: string;
    }
  }

  interface DrawOptions {
    position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
    draw?: {
      polyline?: any;
      polygon?: any;
      rectangle?: any;
      circle?: any;
      circlemarker?: any;
      marker?: any;
    };
    edit?: {
      featureGroup: FeatureGroup;
      remove?: boolean;
      edit?: boolean;
    };
  }

  interface DrawEvents {
    [L.Draw.Event.CREATED]: (event: DrawCreatedEvent) => void;
    [L.Draw.Event.EDITED]: (event: DrawEditedEvent) => void;
    [L.Draw.Event.DELETED]: (event: DrawDeletedEvent) => void;
  }

  interface DrawCreatedEvent {
    layer: Layer;
    layerType: string;
  }

  interface DrawEditedEvent {
    layers: LayerGroup;
  }

  interface DrawDeletedEvent {
    layers: LayerGroup;
  }
}
