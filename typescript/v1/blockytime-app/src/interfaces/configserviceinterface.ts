import { BlockyTimeConfig } from "../models/blockytimeconfig";
export interface ConfigServiceInterface {
    getConfigAsync(): Promise<BlockyTimeConfig>;
}