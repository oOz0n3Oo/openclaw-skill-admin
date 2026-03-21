export declare function promptHidden(prompt: string): Promise<string>;
export declare function promptConfirm(prompt: string): Promise<boolean>;
export declare function openInBrowser(url: string): void;
export declare function isInteractive(): boolean;
export declare function createSpinner(text: string): import("ora").Ora;
export declare function formatError(error: unknown): string;
export declare function fail(message: string): never;
