import type { GlobalOpts } from '../types.js';
type SkillActionLabels = {
    verb: string;
    progress: string;
    past: string;
    promptSuffix?: string;
};
export declare function cmdDeleteSkill(opts: GlobalOpts, slugArg: string, options: {
    yes?: boolean;
}, inputAllowed: boolean, labels?: SkillActionLabels): Promise<{
    ok: true;
} | undefined>;
export declare function cmdUndeleteSkill(opts: GlobalOpts, slugArg: string, options: {
    yes?: boolean;
}, inputAllowed: boolean, labels?: SkillActionLabels): Promise<{
    ok: true;
} | undefined>;
export declare function cmdHideSkill(opts: GlobalOpts, slugArg: string, options: {
    yes?: boolean;
}, inputAllowed: boolean): Promise<{
    ok: true;
} | undefined>;
export declare function cmdUnhideSkill(opts: GlobalOpts, slugArg: string, options: {
    yes?: boolean;
}, inputAllowed: boolean): Promise<{
    ok: true;
} | undefined>;
export {};
