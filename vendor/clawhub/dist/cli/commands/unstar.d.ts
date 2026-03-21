import type { GlobalOpts } from '../types.js';
export declare function cmdUnstarSkill(opts: GlobalOpts, slugArg: string, options: {
    yes?: boolean;
}, inputAllowed: boolean): Promise<{
    ok: true;
    unstarred: boolean;
    alreadyUnstarred: boolean;
} | undefined>;
