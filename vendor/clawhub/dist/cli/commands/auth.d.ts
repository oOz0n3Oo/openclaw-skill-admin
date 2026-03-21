import type { GlobalOpts } from '../types.js';
export declare function cmdLoginFlow(opts: GlobalOpts, options: {
    token?: string;
    label?: string;
    browser?: boolean;
}, inputAllowed: boolean): Promise<void>;
export declare function cmdLogin(opts: GlobalOpts, tokenFlag: string | undefined, inputAllowed: boolean): Promise<void>;
export declare function cmdLogout(opts: GlobalOpts): Promise<void>;
export declare function cmdWhoami(opts: GlobalOpts): Promise<void>;
