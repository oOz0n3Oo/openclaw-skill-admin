import { apiRequest } from '../../http.js';
import { ApiRoutes, ApiV1DeleteResponseSchema, parseArk } from '../../schema/index.js';
import { requireAuthToken } from '../authToken.js';
import { getRegistry } from '../registry.js';
import { createSpinner, fail, formatError, isInteractive, promptConfirm } from '../ui.js';
const deleteLabels = {
    verb: 'Delete',
    progress: 'Deleting',
    past: 'Deleted',
    promptSuffix: 'soft delete, owner/moderator/admin',
};
const undeleteLabels = {
    verb: 'Undelete',
    progress: 'Undeleting',
    past: 'Undeleted',
    promptSuffix: 'owner/moderator/admin',
};
const hideLabels = {
    verb: 'Hide',
    progress: 'Hiding',
    past: 'Hidden',
    promptSuffix: 'owner/moderator/admin',
};
const unhideLabels = {
    verb: 'Unhide',
    progress: 'Unhiding',
    past: 'Unhidden',
    promptSuffix: 'owner/moderator/admin',
};
export async function cmdDeleteSkill(opts, slugArg, options, inputAllowed, labels = deleteLabels) {
    const slug = slugArg.trim().toLowerCase();
    if (!slug)
        fail('Slug required');
    const allowPrompt = isInteractive() && inputAllowed !== false;
    if (!options.yes) {
        if (!allowPrompt)
            fail('Pass --yes (no input)');
        const ok = await promptConfirm(formatPrompt(labels, slug));
        if (!ok)
            return;
    }
    const token = await requireAuthToken();
    const registry = await getRegistry(opts, { cache: true });
    const spinner = createSpinner(`${labels.progress} ${slug}`);
    try {
        const result = await apiRequest(registry, { method: 'DELETE', path: `${ApiRoutes.skills}/${encodeURIComponent(slug)}`, token }, ApiV1DeleteResponseSchema);
        spinner.succeed(`OK. ${labels.past} ${slug}`);
        return parseArk(ApiV1DeleteResponseSchema, result, 'Delete response');
    }
    catch (error) {
        spinner.fail(formatError(error));
        throw error;
    }
}
export async function cmdUndeleteSkill(opts, slugArg, options, inputAllowed, labels = undeleteLabels) {
    const slug = slugArg.trim().toLowerCase();
    if (!slug)
        fail('Slug required');
    const allowPrompt = isInteractive() && inputAllowed !== false;
    if (!options.yes) {
        if (!allowPrompt)
            fail('Pass --yes (no input)');
        const ok = await promptConfirm(formatPrompt(labels, slug));
        if (!ok)
            return;
    }
    const token = await requireAuthToken();
    const registry = await getRegistry(opts, { cache: true });
    const spinner = createSpinner(`${labels.progress} ${slug}`);
    try {
        const result = await apiRequest(registry, {
            method: 'POST',
            path: `${ApiRoutes.skills}/${encodeURIComponent(slug)}/undelete`,
            token,
        }, ApiV1DeleteResponseSchema);
        spinner.succeed(`OK. ${labels.past} ${slug}`);
        return parseArk(ApiV1DeleteResponseSchema, result, 'Undelete response');
    }
    catch (error) {
        spinner.fail(formatError(error));
        throw error;
    }
}
export async function cmdHideSkill(opts, slugArg, options, inputAllowed) {
    return cmdDeleteSkill(opts, slugArg, options, inputAllowed, hideLabels);
}
export async function cmdUnhideSkill(opts, slugArg, options, inputAllowed) {
    return cmdUndeleteSkill(opts, slugArg, options, inputAllowed, unhideLabels);
}
function formatPrompt(labels, slug) {
    const suffix = labels.promptSuffix ? ` (${labels.promptSuffix})` : '';
    return `${labels.verb} ${slug}?${suffix}`;
}
//# sourceMappingURL=delete.js.map