export interface Found { id: number, url: string, found: string[] };
export interface Errored  { id: number, url: string, error?: string };
export interface Ignored { id: number, url: string };
export interface Searched { id: number, url: string};