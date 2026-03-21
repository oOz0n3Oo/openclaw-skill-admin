import type { GlobalOpts } from '../types.js';
export declare function cmdPublish(opts: GlobalOpts, folderArg: string, options: {
    slug?: string;
    name?: string;
    version?: string;
    changelog?: string;
    tags?: string;
    forkOf?: string;
}): Promise<void>;
