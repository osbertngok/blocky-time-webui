import { BaseModel } from './base';

export interface StamperModel extends BaseModel {
    name: string;
    color?: number;
    fav?: boolean;
    priority?: number;
    timestamp?: string;  // ISO date string
    sub_uids?: string;
    group_number?: number;
    group_name?: string;
    ext_i?: number;
    ext_t?: string;
} 