import { BlockModel } from '../models/block';

export interface BlockServiceInterface {
    getBlocksAsync(start_date: string, end_date: string): Promise<BlockModel[]>;
}
