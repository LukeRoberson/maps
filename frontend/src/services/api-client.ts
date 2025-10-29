/**
 * @file api-clients.ts
 * 
 * @summary A Class for interacting with the backend API.
 * 
 * @class ApiClient
 * @description Provides methods for CRUD operations on projects, map areas, boundaries, layers, annotations,
 * 
 * @exports apiClient
 */


// Axios library
import axios from 'axios';

// Axios types (interface)
// AxiosInstance: Represents an Axios client instance
// AxiosResponse: Represents the response from an Axios request
import { AxiosInstance, AxiosResponse } from 'axios';

// Internal dependencies
import type {
  Project,
  MapArea,
  Boundary,
  Layer,
  Annotation,
  MapHierarchy,
} from '@/types';


// The base URL for the API
const API_BASE_URL = '/api';


/**
 * API Client for interacting with the backend.
 * 
 * Provides methods for CRUD operations on projects, map areas, boundaries, layers, annotations,
 * and exporting maps.
 * 
 * @class ApiClient
 */
class ApiClient {
  // Instantiate Axios instance type (an interface)
  // Limit access to the local class only
  // This is a type that represents an Axios client
  private client: AxiosInstance;

  // Initialize the API client with base URL and headers
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }


  /**
   * @function listProjects
   * 
   * @summary Fetches the list of all projects.
   * @remarks
   * Makes a GET request to the /projects endpoint.
   * AxiosResponse is a type that represents an HTTP response.
   * The body of the response contains an array of Project objects.
   * 
   * @returns An array of Project objects.
   */
  async listProjects(): Promise<Project[]> {
    // API call to fetch projects
    // The response is typed to expect an AxiosResponse object with a 'projects' array
    const response: AxiosResponse<{ projects: Project[] }> =
      await this.client.get('/projects');

    // Return the array of projects from the response data
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


  /**
   * @function createProject
   * 
   * @summary Creates a new project.
   * @remarks
   * Makes a POST request to the /projects endpoint.
   * @param project
   * @returns Requested Project object after creation.
   */
  async createProject(
    project: Omit<Project, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Project> {
    // API call to create the project
    const response: AxiosResponse<Project> = await this.client.post(
      '/projects',
      project
    );

    // Return the created project from the response data
    return response.data;
  }


  /**
   * @function updateProject
   * 
   * @summary Updates an existing project.
   * @remarks
   * Makes a PUT request to the /projects/{projectId} endpoint.
   * @param projectId 
   * @param updates 
   * @returns requested Project object after update.
   */
  async updateProject(
    projectId: number,
    updates: Partial<Project>
  ): Promise<Project> {
    // API call to update the project
    const response: AxiosResponse<Project> = await this.client.put(
      `/projects/${projectId}`,
      updates
    );

    // Return the updated project from the response data
    return response.data;
  }


  /**
   * @function deleteProject
   * 
   * @summary Deletes a project by its ID.
   * @remarks
   * Makes a DELETE request to the /projects/{projectId} endpoint.
   * 
   * @param projectId 
   */
  async deleteProject(
    projectId: number
  ): Promise<void> {
    // API call to delete the project
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

  async exportProject(
    projectId: number
  ): Promise<void> {
    // Trigger download by opening URL
    window.location.href = `${API_BASE_URL}/projects/${projectId}/export`;
  }


  /**
      * @function importProject
   * 
   * @summary Imports a project by sending the file content to the backend.
   * @param fileContent 
   * @returns Project object representing the imported project.
   */
  async importProject(
    fileContent: unknown
  ): Promise<Project> {
    // API call to import project, sending fileContent as the request body
    const response: AxiosResponse<{ message: string; project: Project }> =
      await this.client.post('/projects/import', fileContent);
    
    // Return the result directly
    return response.data.project;
  }
}

// Export the ApiClient instance for use in other modules
export const apiClient = new ApiClient();
