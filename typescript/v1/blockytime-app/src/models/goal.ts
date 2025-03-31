import { BaseModel } from './base';

export interface GoalModel extends BaseModel {
    type: number;
    hours?: number;
    duration_type?: number;
    attr_uid?: number;
    type_uid?: number;
    project_uid?: number;
    start_date?: number;
    end_date?: number;
    comment?: string;
    remind_policy?: number;
    state?: number;
    fav?: boolean;
    priority?: number;
    ext_i?: number;
    ext_t?: string;
} 