export type LoopbackAuthResult = {
    token: string;
    registry?: string;
    state?: string;
};
export declare function buildCliAuthUrl(params: {
    siteUrl: string;
    redirectUri: string;
    label?: string;
    state: string;
}): string;
export declare function isAllowedLoopbackRedirectUri(value: string): boolean;
export declare function startLoopbackAuthServer(params?: {
    timeoutMs?: number;
}): Promise<{
    redirectUri: string;
    state: string;
    waitForResult: () => Promise<LoopbackAuthResult>;
    close: () => import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>;
}>;
