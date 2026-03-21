/* @vitest-environment node */
import { describe, expect, it, vi } from 'vitest';
const mockSpawn = vi.fn();
vi.mock('node:child_process', () => ({
    spawn: (...args) => mockSpawn(...args),
}));
const { openInBrowser } = await import('./ui');
function createMockChild() {
    let onError = null;
    const child = {
        on: vi.fn((event, handler) => {
            if (event === 'error')
                onError = handler;
            return child;
        }),
        unref: vi.fn(),
        emitError: (error) => onError?.(error),
    };
    return child;
}
describe('openInBrowser', () => {
    it('prints manual URL instructions when browser opener is missing', () => {
        const child = createMockChild();
        mockSpawn.mockReturnValueOnce(child);
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
        openInBrowser('https://clawhub.ai');
        child.emitError(Object.assign(new Error('not found'), { code: 'ENOENT' }));
        expect(logSpy).toHaveBeenCalledWith('Could not open browser automatically.');
        expect(logSpy).toHaveBeenCalledWith('Please open this URL manually:');
        expect(logSpy).toHaveBeenCalledWith('  https://clawhub.ai');
        expect(child.unref).toHaveBeenCalledOnce();
        logSpy.mockRestore();
    });
    it('does not print manual instructions for non-ENOENT errors', () => {
        const child = createMockChild();
        mockSpawn.mockReturnValueOnce(child);
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
        openInBrowser('https://clawhub.ai');
        child.emitError(Object.assign(new Error('permission denied'), { code: 'EACCES' }));
        expect(logSpy).not.toHaveBeenCalledWith('Could not open browser automatically.');
        expect(child.unref).toHaveBeenCalledOnce();
        logSpy.mockRestore();
    });
});
//# sourceMappingURL=ui.test.js.map