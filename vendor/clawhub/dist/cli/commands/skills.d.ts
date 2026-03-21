import type { GlobalOpts } from '../types.js';
export declare function cmdSearch(opts: GlobalOpts, query: string, limit?: number): Promise<void>;
export declare function cmdInstall(opts: GlobalOpts, slug: string, versionFlag?: string, force?: boolean): Promise<void>;
export declare function cmdUpdate(opts: GlobalOpts, slugArg: string | undefined, options: {
    all?: boolean;
    version?: string;
    force?: boolean;
}, inputAllowed: boolean): Promise<void>;
export declare function cmdList(opts: GlobalOpts): Promise<void>;
export declare function cmdUninstall(opts: GlobalOpts, slug: string, options: {
    yes?: boolean;
} | undefined, inputAllowed: boolean): Promise<void>;
export declare function cmdExplore(opts: GlobalOpts, options?: {
    limit?: number;
    sort?: string;
    json?: boolean;
}): Promise<void>;
export declare function formatExploreLine(item: {
    slug: string;
    summary?: string | null;
    updatedAt: number;
    latestVersion?: {
        version: string;
    } | null;
}): string;
export declare function clampLimit(limit: number, fallback?: number): number;
