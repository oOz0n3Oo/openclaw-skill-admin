import { type Lockfile } from './schema/index.js';
export type SkillOrigin = {
    version: 1;
    registry: string;
    slug: string;
    installedVersion: string;
    installedAt: number;
};
export declare function extractZipToDir(zipBytes: Uint8Array, targetDir: string): Promise<void>;
export declare function listTextFiles(root: string): Promise<{
    relPath: string;
    bytes: Uint8Array;
    contentType?: string;
}[]>;
export type SkillFileHash = {
    path: string;
    sha256: string;
    size: number;
};
export declare function sha256Hex(bytes: Uint8Array): string;
export declare function buildSkillFingerprint(files: Array<{
    path: string;
    sha256: string;
}>): string;
export declare function hashSkillFiles(files: Array<{
    relPath: string;
    bytes: Uint8Array;
}>): {
    files: {
        path: string;
        sha256: string;
        size: number;
    }[];
    fingerprint: string;
};
export declare function hashSkillZip(zipBytes: Uint8Array): {
    files: SkillFileHash[];
    fingerprint: string;
};
export declare function readLockfile(workdir: string): Promise<Lockfile>;
export declare function writeLockfile(workdir: string, lock: Lockfile): Promise<void>;
export declare function readSkillOrigin(skillFolder: string): Promise<SkillOrigin | null>;
export declare function writeSkillOrigin(skillFolder: string, origin: SkillOrigin): Promise<void>;
