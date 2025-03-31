import { BaseModel } from './base';

/**
 * Sample JSON:
 * ```json
 * {
 *     "abbr": "WU",
 *     "acronym": "WU",
 *     "classify_uid": 0,
 *     "hidden": false,
 *     "latin": "washup",
 *     "name": "Wash Up",
 *     "priority": 0,
 *     "taglist": "(null)",
 *     "uid": 35
 * }
 * ```
 */
export interface ProjectModel extends BaseModel {
    name: string;
    abbr: string;
    acronym: string;
    latin: string;
    hidden?: boolean;
    classify_uid: number;
    taglist: string;
    priority?: number;
} 