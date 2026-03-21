export function sanitizeSlug(value) {
    const raw = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-');
    const cleaned = raw.replace(/^-+/, '').replace(/-+$/, '').replace(/--+/g, '-');
    return cleaned;
}
export function titleCase(value) {
    return value
        .trim()
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}
//# sourceMappingURL=slug.js.map