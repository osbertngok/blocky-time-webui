import { BaseModel } from './base';

export interface TrendHistoryModel extends BaseModel {
    target: number;
    target_ids: string;
} 