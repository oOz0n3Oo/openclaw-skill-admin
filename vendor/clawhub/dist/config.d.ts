import { type GlobalConfig } from './schema/index.js';
export declare function getGlobalConfigPath(): string;
export declare function readGlobalConfig(): Promise<GlobalConfig | null>;
export declare function writeGlobalConfig(config: GlobalConfig): Promise<void>;
