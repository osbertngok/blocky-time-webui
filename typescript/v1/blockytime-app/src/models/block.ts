import { TypeModel } from './type';
import { ProjectModel } from './project';
import { BaseModel } from './base';
/*
Sample JSON
```json
    {
        "comment": "",
        "date": 1740844800,
        "project": {
            "abbr": "WU",
            "acronym": "WU",
            "classify_uid": 0,
            "hidden": false,
            "latin": "washup",
            "name": "Wash Up",
            "priority": 0,
            "taglist": "(null)",
            "uid": 35
        },
        "type_": {
            "category": null,
            "color": 7368816,
            "hidden": false,
            "name": "Fixed",
            "priority": 11,
            "uid": 11
        },
        "uid": 236773
    }
```
*/
export interface BlockModel extends BaseModel {
    date: number;  // Unix timestamp
    type_?: TypeModel;  // Optional type
    project?: ProjectModel;  // Optional project
    comment: string;
}