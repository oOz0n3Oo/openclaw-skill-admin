import { type SkillFolder } from '../scanSkills.js';
import type { GlobalOpts } from '../types.js';
import type { Candidate, LocalSkill } from './syncTypes.js';
export declare function reportTelemetryIfEnabled(params: {
    token: string;
    registry: string;
    scan: {
        roots: string[];
        skillsByRoot: Record<string, SkillFolder[]>;
    };
    candidates: Candidate[];
}): Promise<void>;
export declare function buildScanRoots(opts: GlobalOpts, extraRoots: string[] | undefined): string[];
export declare function normalizeConcurrency(value: number | undefined): number;
export declare function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]>;
export declare function checkRegistrySyncState(registry: string, skill: LocalSkill, resolveSupport: {
    value: boolean | null;
}, token?: string): Promise<Candidate>;
export declare function scanRoots(roots: string[]): Promise<{
    roots: string[];
    skillsByRoot: Record<string, SkillFolder[]>;
    skills: SkillFolder[];
    rootsWithSkills: string[];
}>;
export declare function scanRootsWithLabels(roots: string[], labels?: Record<string, string>): Promise<{
    roots: string[];
    skillsByRoot: Record<string, SkillFolder[]>;
    skills: SkillFolder[];
    rootsWithSkills: string[];
    rootLabels: Record<string, string>;
}>;
export declare function mergeScan(left: {
    roots: string[];
    skillsByRoot: Record<string, SkillFolder[]>;
    skills: SkillFolder[];
    rootsWithSkills: string[];
    rootLabels: Record<string, string>;
}, right: {
    roots: string[];
    skillsByRoot: Record<string, SkillFolder[]>;
    skills: SkillFolder[];
    rootsWithSkills: string[];
    rootLabels: Record<string, string>;
}): {
    roots: string[];
    skillsByRoot: Record<string, SkillFolder[]>;
    skills: SkillFolder[];
    rootsWithSkills: string[];
    rootLabels: Record<string, string>;
};
export declare function selectToUpload(candidates: Candidate[], params: {
    allowPrompt: boolean;
    all: boolean;
    bump: 'patch' | 'minor' | 'major';
}): Promise<Candidate[]>;
export declare function resolvePublishMeta(skill: Candidate, params: {
    bump: 'patch' | 'minor' | 'major';
    allowPrompt: boolean;
    changelogFlag?: string;
}): Promise<{
    publishVersion: string;
    changelog: string;
}>;
export declare function getRegistryWithAuth(opts: GlobalOpts, token: string): Promise<string>;
export declare function formatList(values: string[], max: number): string;
export declare function printSection(title: string, body?: string): void;
export declare function dedupeSkillsBySlug(skills: SkillFolder[]): {
    skills: SkillFolder[];
    duplicates: string[];
};
export declare function formatActionableStatus(candidate: Candidate, bump: 'patch' | 'minor' | 'major'): string;
export declare function formatActionableLine(candidate: Candidate, bump: 'patch' | 'minor' | 'major'): string;
export declare function formatSyncedSummary(candidate: Candidate): string;
export declare function formatBulletList(lines: string[], max: number): string;
export declare function formatSyncedDisplay(synced: Candidate[]): string;
export declare function formatCommaList(values: string[], max: number): string;
