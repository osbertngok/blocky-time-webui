import { TypeModel } from '../models/type';

export interface TrendDataPoint {
  duration: number; 
  timeLabel: string;
}

export interface TrendData {
  type: TypeModel;
  items: TrendDataPoint[];
}

export interface TrendServiceInterface {
  getTrends(startDate: Date, endDate: Date, groupBy: 'DAY' | 'MONTH'): Promise<TrendData[]>;
  getTrendsByDateString(startDateStr: string, endDateStr: string, groupBy: 'DAY' | 'MONTH'): Promise<TrendData[]>;
}
