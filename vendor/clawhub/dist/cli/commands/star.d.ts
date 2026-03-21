import type { GlobalOpts } from '../types.js';
export declare function cmdStarSkill(opts: GlobalOpts, slugArg: string, options: {
    yes?: boolean;
}, inputAllowed: boolean): Promise<{
    ok: true;
    starred: boolean;
    alreadyStarred: boolean;
} | undefined>;
