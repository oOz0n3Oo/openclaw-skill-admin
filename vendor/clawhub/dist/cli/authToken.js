import { readGlobalConfig } from '../config.js';
import { fail } from './ui.js';
export async function getOptionalAuthToken() {
    const cfg = await readGlobalConfig();
    return cfg?.token ?? undefined;
}
export async function requireAuthToken() {
    const token = await getOptionalAuthToken();
    if (!token)
        fail('Not logged in. Run: clawhub login');
    return token;
}
//# sourceMappingURL=authToken.js.map