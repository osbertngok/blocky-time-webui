import { StatisticsServiceInterface } from "../interfaces/statisticsserviceinterface";
import { TypeModel } from "../models/type";

export class StatisticsService implements StatisticsServiceInterface {

    private apiBaseUrl: string;

    constructor(apiBaseUrl: string = '/api/v1') {
      this.apiBaseUrl = apiBaseUrl;
    }

    async getStatistics(startDate: string, endDate: string): Promise<{
        type: TypeModel;
        duration: number;
      }[]> {
        const response = await fetch(`${this.apiBaseUrl}/stats?startDate=${startDate}&endDate=${endDate}`);
        const data = await response.json();
        return data.data;
    }
}