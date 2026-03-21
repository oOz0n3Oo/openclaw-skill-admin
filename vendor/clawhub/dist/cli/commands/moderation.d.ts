import type { GlobalOpts } from '../types.js';
export declare function cmdBanUser(opts: GlobalOpts, identifierArg: string, options: {
    yes?: boolean;
    id?: boolean;
    fuzzy?: boolean;
    reason?: string;
}, inputAllowed: boolean): Promise<{
    ok: true;
    alreadyBanned: boolean;
    deletedSkills: number;
} | undefined>;
export declare function cmdSetRole(opts: GlobalOpts, identifierArg: string, roleArg: string, options: {
    yes?: boolean;
    id?: boolean;
    fuzzy?: boolean;
}, inputAllowed: boolean): Promise<{
    ok: true;
    role: "user" | "admin" | "moderator";
} | undefined>;
