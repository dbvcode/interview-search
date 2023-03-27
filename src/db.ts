import { connect } from 'json-file-database';

const db = connect({
    file: './db.json'
});

type Found = { id: number, url: string, found: string[] };
type Errored = { id: number, url: string, error?: string };
type Ignored = { id: number, url: string };

export const db_found = db<Found>({
    name: 'found',
    primaryKey: 'id',
});

export const db_errored = db<Errored>({
    name: 'errored',
    primaryKey: 'id',
});

export const db_ignored = db<Errored>({
    name: 'ignored',
    primaryKey: 'id',
});



