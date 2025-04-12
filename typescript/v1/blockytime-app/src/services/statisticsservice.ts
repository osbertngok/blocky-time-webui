import { StatsData, StatsServiceInterface } from "../interfaces/statisticsserviceinterface";

export class StatsService implements StatsServiceInterface {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = '/api/v1') {
    this.apiBaseUrl = apiBaseUrl;
  }

  async getStats(
    startDate: string,
    endDate: string,
    timeSlotMinutes?: number,
    hour?: number,
    minute?: number
  ): Promise<StatsData[]> {
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      });

      if (timeSlotMinutes !== undefined) {
        params.append('time_slot_minutes', timeSlotMinutes.toString());
      }
      if (hour !== undefined) {
        params.append('hour', hour.toString());
      }
      if (minute !== undefined) {
        params.append('minute', minute.toString());
      }

      const response = await fetch(
        `${this.apiBaseUrl}/stats?${params}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data as StatsData[];
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
}