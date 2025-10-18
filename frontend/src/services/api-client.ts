import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type {
  Project,
  MapArea,
  Boundary,
  Layer,
  Annotation,
  MapHierarchy,
} from '@/types';

const API_BASE_URL = '/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async listProjects(): Promise<Project[]> {
    const response: AxiosResponse<{ projects: Project[] }> =
      await this.client.get('/projects');
    return response.data.projects;
  }

  async getProject(
    projectId: number
  ): Promise<Project> {
    const response: AxiosResponse<Project> = await this.client.get(
      `/projects/${projectId}`
    );
    return response.data;
  }

  async createProject(
    project: Omit<Project, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Project> {
    const response: AxiosResponse<Project> = await this.client.post(
      '/projects',
      project
    );
    return response.data;
  }

  async updateProject(
    projectId: number,
    updates: Partial<Project>
  ): Promise<Project> {
    const response: AxiosResponse<Project> = await this.client.put(
      `/projects/${projectId}`,
      updates
    );
    return response.data;
  }

  async deleteProject(
    projectId: number
  ): Promise<void> {
    await this.client.delete(`/projects/${projectId}`);
  }

  async listMapAreas(
    projectId: number,
    parentId?: number
  ): Promise<MapArea[]> {
    let url = `/map-areas?project_id=${projectId}`;
    if (parentId !== undefined) {
      url += `&parent_id=${parentId}`;
    }
    const response: AxiosResponse<{ map_areas: MapArea[] }> =
      await this.client.get(url);
    return response.data.map_areas;
  }

  async getMapHierarchy(
    projectId: number
  ): Promise<MapHierarchy> {
    const response: AxiosResponse<MapHierarchy> = await this.client.get(
      `/map-areas/hierarchy?project_id=${projectId}`
    );
    return response.data;
  }

  async getMapArea(
    mapAreaId: number
  ): Promise<MapArea> {
    const response: AxiosResponse<MapArea> = await this.client.get(
      `/map-areas/${mapAreaId}`
    );
    return response.data;
  }

  async createMapArea(
    mapArea: Omit<MapArea, 'id' | 'created_at' | 'updated_at'>
  ): Promise<MapArea> {
    const response: AxiosResponse<MapArea> = await this.client.post(
      '/map-areas',
      mapArea
    );
    return response.data;
  }

  async updateMapArea(
    mapAreaId: number,
    updates: Partial<MapArea>
  ): Promise<MapArea> {
    const response: AxiosResponse<MapArea> = await this.client.put(
      `/map-areas/${mapAreaId}`,
      updates
    );
    return response.data;
  }

  async deleteMapArea(
    mapAreaId: number
  ): Promise<void> {
    await this.client.delete(`/map-areas/${mapAreaId}`);
  }

  async getBoundaryByMapArea(
    mapAreaId: number
  ): Promise<Boundary | null> {
    try {
      const response: AxiosResponse<Boundary> = await this.client.get(
        `/boundaries/map-area/${mapAreaId}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createBoundary(
    boundary: Omit<Boundary, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Boundary> {
    const response: AxiosResponse<Boundary> = await this.client.post(
      '/boundaries',
      boundary
    );
    return response.data;
  }

  async updateBoundary(
    boundaryId: number,
    coordinates: [number, number][]
  ): Promise<Boundary> {
    const response: AxiosResponse<Boundary> = await this.client.put(
      `/boundaries/${boundaryId}`,
      { coordinates }
    );
    return response.data;
  }

  async deleteBoundary(
    boundaryId: number
  ): Promise<void> {
    await this.client.delete(`/boundaries/${boundaryId}`);
  }

  async listLayers(
    mapAreaId: number
  ): Promise<Layer[]> {
    const response: AxiosResponse<{ layers: Layer[] }> =
      await this.client.get(`/layers?map_area_id=${mapAreaId}`);
    return response.data.layers;
  }

  async createLayer(
    layer: Omit<Layer, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Layer> {
    const response: AxiosResponse<Layer> = await this.client.post(
      '/layers',
      layer
    );
    return response.data;
  }

  async updateLayer(
    layerId: number,
    updates: Partial<Layer>
  ): Promise<Layer> {
    const response: AxiosResponse<Layer> = await this.client.put(
      `/layers/${layerId}`,
      updates
    );
    return response.data;
  }

  async deleteLayer(
    layerId: number
  ): Promise<void> {
    await this.client.delete(`/layers/${layerId}`);
  }

  async listAnnotations(
    layerId: number
  ): Promise<Annotation[]> {
    const response: AxiosResponse<{ annotations: Annotation[] }> =
      await this.client.get(`/annotations?layer_id=${layerId}`);
    return response.data.annotations;
  }

  async createAnnotation(
    annotation: Omit<Annotation, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Annotation> {
    const response: AxiosResponse<Annotation> = await this.client.post(
      '/annotations',
      annotation
    );
    return response.data;
  }

  async updateAnnotation(
    annotationId: number,
    updates: Partial<Annotation>
  ): Promise<Annotation> {
    const response: AxiosResponse<Annotation> = await this.client.put(
      `/annotations/${annotationId}`,
      updates
    );
    return response.data;
  }

  async deleteAnnotation(
    annotationId: number
  ): Promise<void> {
    await this.client.delete(`/annotations/${annotationId}`);
  }

  async exportMap(
    mapAreaId: number,
    imageData: string,
    filename?: string
  ): Promise<{ filename: string; size: number }> {
    const response: AxiosResponse<{ filename: string; size: number }> =
      await this.client.post('/exports', {
        map_area_id: mapAreaId,
        image_data: imageData,
        filename,
      });
    return response.data;
  }

  getExportDownloadUrl(
    filename: string
  ): string {
    return `${API_BASE_URL}/exports/${filename}`;
  }
}

export const apiClient = new ApiClient();
