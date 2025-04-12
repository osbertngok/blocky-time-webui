import { TrendServiceInterface, TrendData } from '../interfaces/trendserviceinterface';
import { format } from 'date-fns';


export class TrendService implements TrendServiceInterface {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = '/api/v1') {
    this.apiBaseUrl = apiBaseUrl;
  }

  async getTrends(startDate: Date, endDate: Date, groupBy: 'DAY' | 'MONTH'): Promise<TrendData[]> {

    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    
    return this.getTrendsByDateString(startDateStr, endDateStr, groupBy.toUpperCase() as 'DAY' | 'MONTH');
  }


  async getTrendsByDateString(startDateStr: string, endDateStr: string, groupBy: 'DAY' | 'MONTH'): Promise<TrendData[]> {
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
      
      return result.data as TrendData[];
    } catch (error) {
      console.error('Error fetching trends:', error);
      throw error;
    }
  }

}
