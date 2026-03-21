import type { GlobalOpts } from './types.js';
export declare const DEFAULT_SITE = "https://clawhub.ai";
export declare const DEFAULT_REGISTRY = "https://clawhub.ai";
export declare function resolveRegistry(opts: GlobalOpts): Promise<string>;
export declare function getRegistry(opts: GlobalOpts, params?: {
    cache?: boolean;
}): Promise<string>;
