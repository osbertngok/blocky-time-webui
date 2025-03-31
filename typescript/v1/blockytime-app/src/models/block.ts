import { TypeModel } from './type';
import { ProjectModel } from './project';
import { BaseModel } from './base';

export interface BlockModel extends BaseModel {
    date: string;  // ISO date string
    type_: TypeModel;
    project: ProjectModel;
    comment: string;
}