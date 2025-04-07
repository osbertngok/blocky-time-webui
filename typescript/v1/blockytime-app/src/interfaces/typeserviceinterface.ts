import { TypeModel } from '../models/type';

export interface TypeServiceInterface {
    getTypesAsync(): Promise<TypeModel[]>;
}
