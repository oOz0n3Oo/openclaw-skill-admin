import type { GlobalOpts } from '../types.js';
type ConfirmOptions = {
    yes?: boolean;
};
export declare function cmdTransferRequest(opts: GlobalOpts, slugArg: string, toHandleArg: string, options: ConfirmOptions & {
    message?: string;
}, inputAllowed: boolean): Promise<{
    ok: true;
    transferId: string;
    toUserHandle: string;
    expiresAt: number;
} | undefined>;
export declare function cmdTransferList(opts: GlobalOpts, options: {
    outgoing?: boolean;
}): Promise<{
    transfers: {
        _id: string;
        skill: {
            _id: string;
            slug: string;
            displayName: string;
        };
        requestedAt: number;
        expiresAt: number;
        fromUser?: {
            _id: string;
            handle: string | null;
            displayName: string | null;
        } | undefined;
        toUser?: {
            _id: string;
            handle: string | null;
            displayName: string | null;
        } | undefined;
        message?: string | undefined;
    }[];
}>;
export declare function cmdTransferAccept(opts: GlobalOpts, slugArg: string, options: ConfirmOptions, inputAllowed: boolean): Promise<{
    ok: true;
    skillSlug?: string | undefined;
} | undefined>;
export declare function cmdTransferReject(opts: GlobalOpts, slugArg: string, options: ConfirmOptions, inputAllowed: boolean): Promise<{
    ok: true;
    skillSlug?: string | undefined;
} | undefined>;
export declare function cmdTransferCancel(opts: GlobalOpts, slugArg: string, options: ConfirmOptions, inputAllowed: boolean): Promise<{
    ok: true;
    skillSlug?: string | undefined;
} | undefined>;
export {};
