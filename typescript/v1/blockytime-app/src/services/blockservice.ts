import BlockServiceInterface from '../interfaces/blockserviceinterface';
import { BlockModel } from '../models/block';
import IResponse from '../interfaces/responseinterface';

class BlockService implements BlockServiceInterface {

    private readonly API_URL: string;

    constructor(apiUrl: string) {
        this.API_URL = apiUrl;
    }

    async getBlocksAsync(startDate: string, endDate: string): Promise<BlockModel[]> {
        const response = await fetch(`${this.API_URL}/blocks?start_date=${startDate}&end_date=${endDate}`);
        const responseData: IResponse<BlockModel[]> = await response.json();
        return responseData.data;
    }
}