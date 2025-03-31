import { BaseModel } from './base';

export interface ProjectModel extends BaseModel {
    name: string;
    abbr: string;
    latin: string;
    acronym: string;
    hidden?: boolean;
    classify_uid: number;
    taglist: string;
    priority?: number;
} 