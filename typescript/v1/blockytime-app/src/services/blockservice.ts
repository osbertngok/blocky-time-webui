import { BlockModel } from '../models/block';

export interface BlockServiceInterface {
  getBlocks(startDate: Date, endDate: Date): Promise<BlockModel[]>;
  getBlocksByDateString(startDateStr: string, endDateStr: string): Promise<BlockModel[]>;
  updateBlocks(blocks: BlockModel[]): Promise<boolean>;
}

export class BlockService implements BlockServiceInterface {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = '/api/v1') {
    this.apiBaseUrl = apiBaseUrl;
  }

  async getBlocks(startDate: Date, endDate: Date): Promise<BlockModel[]> {
    try {
      const startDateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const endDateStr = endDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      return this.getBlocksByDateString(startDateStr, endDateStr);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      throw error;
    }
  }

  async getBlocksByDateString(startDateStr: string, endDateStr: string): Promise<BlockModel[]> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/blocks?start_date=${startDateStr}&end_date=${endDateStr}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data as BlockModel[];
    } catch (error) {
      console.error('Error fetching blocks:', error);
      throw error;
    }
  }

  async updateBlocks(blocks: BlockModel[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/blocks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blocks),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating blocks:', error);
      throw error;
    }
  }
}
