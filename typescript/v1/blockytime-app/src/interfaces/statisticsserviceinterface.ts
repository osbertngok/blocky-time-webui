import { TypeModel } from '../models/type';

export interface StatsData {
  type: TypeModel;
  duration: number;  // in hours
}

export interface StatsServiceInterface {
  getStats(
    startDate: string, 
    endDate: string, 
    timeSlotMinutes?: number,
    hour?: number,
    minute?: number
  ): Promise<StatsData[]>;
}