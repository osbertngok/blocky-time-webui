import { BaseModel } from './base';
import { CategoryModel } from './category';

/**
 * Sample JSON:
 * ```json
 * {
 *     "category": null,
 *     "color": 7368816,
 *     "hidden": false,
 *     "name": "Fixed",
 *     "priority": 11,
 *     "uid": 11
 * }
 * ```
 */
export interface TypeModel extends BaseModel {
    name: string;
    color?: number;
    hidden?: boolean;
    priority?: number;
    category?: CategoryModel | null;
} 