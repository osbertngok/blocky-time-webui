import { BlockModel } from '../models/block';

interface BlockServiceInterface {
    getBlocksAsync(start_date: string, end_date: string): Promise<BlockModel[]>;
}

export default BlockServiceInterface;