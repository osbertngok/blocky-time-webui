import { BaseModel } from './base';

export interface RemindModel extends BaseModel {
    key: string;
    block_date?: number;
    alert_type?: number;
    alert_offset?: number;
    ring_index?: number;
    alert_msg: string;
    type_uid?: number;
    project_uid?: number;
    place_uid?: number;
    person_uids?: string;
    comment?: string;
    repeat?: number;
    state?: boolean;
    ext_i?: number;
    ext_t: string;
    ext_d?: number;
} 