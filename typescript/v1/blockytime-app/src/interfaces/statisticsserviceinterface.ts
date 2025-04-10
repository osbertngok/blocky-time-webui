import { TypeModel } from "../models/type";

export interface StatisticsServiceInterface {
  getStatistics(startDate: string, endDate: string): Promise<{
    type: TypeModel;
    duration: number;
  }[]>;
}
