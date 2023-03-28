import { connect } from 'json-file-database';
import { Errored, Found, Ignored, Searched } from './models';

const db = connect({
    file: './db.json'
});

export const db_found = db<Found>({
    name: 'found',
    primaryKey: 'id',
});

export const db_errored = db<Errored>({
    name: 'errored',
    primaryKey: 'id',
});

export const db_ignored = db<Ignored>({
    name: 'ignored',
    primaryKey: 'id',
});

export const db_searched = db<Searched>({
    name: 'searched',
    primaryKey: 'id',
});

export const db_favourited = db<Found>({
    name: 'favourited',
    primaryKey: 'id',
});

