import { TypeModel } from '../models/type';

export interface TypeServiceInterface {
  getTypes(): Promise<TypeModel[]>;
}

export class TypeService implements TypeServiceInterface {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = '/api/v1') {
    this.apiBaseUrl = apiBaseUrl;
  }

  async getTypes(): Promise<TypeModel[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/types`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data as TypeModel[];
    } catch (error) {
      console.error('Error fetching types:', error);
      throw error;
    }
  }
} 