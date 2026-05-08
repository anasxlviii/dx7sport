declare module 'duckduckgo-search' {
  export function search(query: string, options?: {
    region?: string;
    safeSearch?: string;
  }): Promise<Array<{
    url?: string;
    link?: string;
    title?: string;
    text?: string;
    description?: string;
    body?: string;
    snippet?: string;
  }>>;
}
