export type ClawdbotSkillRoots = {
    roots: string[];
    labels: Record<string, string>;
};
export declare function resolveClawdbotSkillRoots(): Promise<ClawdbotSkillRoots>;
export declare function resolveClawdbotDefaultWorkspace(): Promise<string | null>;
