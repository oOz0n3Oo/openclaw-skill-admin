import type { ArkValidator } from './schema/index.js';
export declare function shouldUseProxyFromEnv(env?: NodeJS.ProcessEnv): boolean;
export declare function registryUrl(path: string, registry: string): URL;
type RequestArgs = {
    method: 'GET' | 'POST' | 'DELETE';
    path: string;
    token?: string;
    body?: unknown;
} | {
    method: 'GET' | 'POST' | 'DELETE';
    url: string;
    token?: string;
    body?: unknown;
};
export declare function apiRequest<T>(registry: string, args: RequestArgs): Promise<T>;
export declare function apiRequest<T>(registry: string, args: RequestArgs, schema: ArkValidator<T>): Promise<T>;
type FormRequestArgs = {
    method: 'POST';
    path: string;
    token?: string;
    form: FormData;
} | {
    method: 'POST';
    url: string;
    token?: string;
    form: FormData;
};
export declare function apiRequestForm<T>(registry: string, args: FormRequestArgs): Promise<T>;
export declare function apiRequestForm<T>(registry: string, args: FormRequestArgs, schema: ArkValidator<T>): Promise<T>;
type TextRequestArgs = {
    path: string;
    token?: string;
} | {
    url: string;
    token?: string;
};
export declare function fetchText(registry: string, args: TextRequestArgs): Promise<string>;
export declare function downloadZip(registry: string, args: {
    slug: string;
    version?: string;
    token?: string;
}): Promise<Uint8Array<ArrayBuffer>>;
export {};
