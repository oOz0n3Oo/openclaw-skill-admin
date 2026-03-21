export type SkillFolder = {
    folder: string;
    slug: string;
    displayName: string;
};
export declare function findSkillFolders(root: string): Promise<SkillFolder[]>;
export declare function getFallbackSkillRoots(workdir: string): string[];
