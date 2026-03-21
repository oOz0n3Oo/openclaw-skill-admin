export declare function discoverRegistryFromSite(siteUrl: string): Promise<{
    apiBase: string;
    authBase: string | undefined;
    minCliVersion: string | undefined;
} | null>;
