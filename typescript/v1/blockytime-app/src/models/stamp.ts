import { BaseModel } from './base';

export interface StampModel extends BaseModel {
    stamper_uid?: number;
    interval?: number;
    block_data?: string;  // hex string of binary data
    reminds?: string;
    timestamp?: string;  // ISO date string
    ext_i?: number;
    ext_t?: string;
} 