import { TrendItemModel } from '../models/trenditem';
import { TrendServiceInterface } from '../interfaces/trendserviceinterface';


export class TrendService implements TrendServiceInterface {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = '/api/v1') {
    this.apiBaseUrl = apiBaseUrl;
  }

  async getTrends(startDate: Date, endDate: Date, groupBy: 'DAY' | 'WEEK' | 'MONTH'): Promise<TrendItemModel[]> {
    try {
      const startDateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const endDateStr = endDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      return this.getTrendsByDateString(startDateStr, endDateStr, groupBy);
    } catch (error) {
      console.error('Error fetching trends:', error);
      throw error;
    }
  }


  async getTrendsByDateString(startDateStr: string, endDateStr: string, groupBy: 'DAY' | 'WEEK' | 'MONTH'): Promise<TrendItemModel[]> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/trends?start_date=${startDateStr}&end_date=${endDateStr}&group_by=${groupBy}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      let ret = result.data as TrendItemModel[];
      return ret;
    } catch (error) {
      console.error('Error fetching blocks:', error);
      throw error;
    }
  }

}
