import { BaseModel } from './base';
import { CategoryModel } from './category';
import { ProjectModel } from './project';
/**
 * Sample JSON:
 * ```json
 * {
    "data": [
        {
        "category": null,
        "color": 6177843,
        "hidden": false,
        "name": "Work",
        "priority": 1,
        "projects": [
        {
            "abbr": "BU",
            "acronym": "B",
            "classify_uid": 0,
            "hidden": true,
            "latin": "business",
            "name": "Business",
            "priority": 0,
            "taglist": "(null)",
            "uid": 9
        },
        {
            "abbr": "DV",
            "acronym": "D",
            "classify_uid": 0,
            "hidden": true,
            "latin": "development",
            "name": "Development",
            "priority": 0,
            "taglist": "(null)",
            "uid": 8
        }]
       }
     ]
 * }
 * ```
 */
export interface TypeModel extends BaseModel {
    name?: string;
    color?: number;
    hidden?: boolean;
    priority?: number;
    category?: CategoryModel | null;
    projects?: ProjectModel[];
} 