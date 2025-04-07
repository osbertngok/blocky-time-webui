import { ConfigServiceInterface } from "../interfaces/configserviceinterface";
import { BlockyTimeConfig } from "../models/blockytimeconfig";

export class ConfigService implements ConfigServiceInterface {

    private apiBaseUrl: string;

    constructor(apiBaseUrl: string = '/api/v1') {
      this.apiBaseUrl = apiBaseUrl;
    }

    async getConfigAsync(): Promise<BlockyTimeConfig> {
        const response = await fetch(`${this.apiBaseUrl}/configs`);
        const data = await response.json();
        return data.data as BlockyTimeConfig;
    }
}