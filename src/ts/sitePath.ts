export function getSitePath(): string {
    return document.querySelector('meta[name="site-path"]')?.getAttribute('content') ?? '';
}

export function withPath(path: string): string {
    const base = getSitePath();
    if (!base) return path;
    return base + (path.startsWith('/') ? path : '/' + path);
}
