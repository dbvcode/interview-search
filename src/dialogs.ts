import Enquirer from 'enquirer';
import { db_favourited, db_found, db_ignored } from './db';
import { Found } from './models';
import { searchHWWList } from './search';

export const menuDialog = async (skipClearConsole?: boolean) => {
    if (!skipClearConsole) console.clear();

    const prompt = await Enquirer.prompt<{ choice: string }>({
        message: `Main menu`,
        type: 'select',
        name: 'choice',
        choices: [
            { name: 'search', message: '🌐 Search the HWW list' },
            { name: 'sort', message: '✔️  Sort the already found results' },
            { name: 'display', message: '⭐ Display favourites' }
        ]
    });

    if (prompt.choice === 'sort') {
        await sortResultsDialog();
    } else if (prompt.choice === 'display') {
        console.clear();
        displayFavourites();
    } else if (prompt.choice === 'search') {
        console.clear();
        await searchHWWList();
    }
};

const sortResultsDialog = async () => {
    for (const found of Array.from(db_found)) {
        if (await displayPromptOnFound(found)) break;
    }
    await menuDialog();
};

const displayPromptOnFound = async (foundUrl: Found) => {
    console.clear();
    const prompt = await Enquirer.prompt<{ choice: string }>({
        message: `Company name HERE,\nURL: ${foundUrl.url}\nKeywords: ${foundUrl.found.join(',')}`,
        type: 'select',
        name: 'choice',
        choices: [
            { name: 'next', message: '⏭️  Next URL' },
            { name: 'favourite', message: '⭐ Favourite' },
            { name: 'ignore', message: '💩 Ignore' },
            { name: 'exit', message: '🔙 Main menu' }
        ]
    });

    if (prompt.choice === 'favourite') {
        db_found.remove({ id: foundUrl.id });
        db_favourited.insert(foundUrl);
    } else if (prompt.choice === 'ignore') {
        db_found.remove({ id: foundUrl.id });
        db_ignored.insert({ id: foundUrl.id, url: foundUrl.url });
    } else if (prompt.choice === 'exit') {
        return true;
    }
    return false;
}

const displayFavourites = () => {
    Array.from(db_favourited).forEach(f => console.log(f.url, '\n', f.found));
    menuDialog(true);
};


