import { BaseModel } from './base';

export interface TypeModel extends BaseModel {
    category_uid: number;
    name: string;
    color?: number;
    hidden?: boolean;
    priority?: number;
} 