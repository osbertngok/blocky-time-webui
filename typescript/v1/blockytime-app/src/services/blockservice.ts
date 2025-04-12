import { BlockModel } from '../models/block';

export interface BlockServiceInterface {
  getBlocks(startDate: Date, endDate: Date): Promise<BlockModel[]>;
  getBlocksByDateString(startDateStr: string, endDateStr: string): Promise<BlockModel[]>;
  updateBlocks(blocks: BlockModel[]): Promise<boolean>;
}

class BlockCacheEntry {
  blocks: BlockModel[];
  validUntil: Date;

  constructor(blocks: BlockModel[], validUntil: Date) {
    this.blocks = blocks;
    this.validUntil = validUntil;
  }
}

export class BlockService implements BlockServiceInterface {
  private apiBaseUrl: string;
  private cache: Record<string, BlockCacheEntry>;

  constructor(apiBaseUrl: string = '/api/v1') {
    this.apiBaseUrl = apiBaseUrl;
    this.cache = {};
  }

  clearCache() {
    this.cache = {};
  }

  getCacheKey(startDateStr: string, endDateStr: string): string {
    return startDateStr + '-' + endDateStr;
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
    // if cache entry is valid, return it
    const cacheKey = this.getCacheKey(startDateStr, endDateStr);
    if (this.cache[cacheKey]) {
      const cache = this.cache[cacheKey]
      if (cache.validUntil > new Date()) {
        return cache.blocks;
      }
    }

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
      
      const ret = result.data as BlockModel[];
      this.cache[cacheKey] = new BlockCacheEntry(ret, new Date(Date.now() + 1000));
      return ret;
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
    } finally {
      this.clearCache();
    }
  }
}
