import { TrendItemModel } from '../models/trenditem';

export interface TrendServiceInterface {
    async getTrends(startDate: Date, endDate: Date, groupBy: 'DAY' | 'WEEK' | 'MONTH'): Promise<TrendItemModel[]>
}
