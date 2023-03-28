import axios from "axios";
import puppeteer, { Page } from "puppeteer";
import { db_errored, db_favourited, db_found, db_ignored, db_searched } from "./db";


declare global {
    interface Window {
        find?: any;
    }
}

const getIgnoreList = () => {
    return [
        ...Array.from(db_found).map(m => m.url),
        ...Array.from(db_errored).map(m => m.url),
        ...Array.from(db_searched).map(m => m.url),
        ...Array.from(db_ignored).map(m => m.url),
        ...Array.from(db_favourited).map(m => m.url)
    ]
}

const getParsedList = async (listUrl: string) => {
    const list = await axios.get(listUrl);

    const lineData: string[] = list.data.split('\n');
    const startOfLinks = lineData.indexOf('---') + 1;
    const urls = lineData.slice(startOfLinks).filter(f => f.includes('http://') || f.includes('https://')).map(m => {
        const name = m.match(/\[(.*?)\]/);
        const url = m.match(/\((.*?)\)/);
        const rest = m.split('|');
        const location = rest[1];
        const info = rest[2];
        return {
            name: name ? name[1] : undefined,
            url: url ? url[1] : undefined,
            location: location ? location.trim() : undefined,
            info: info ? info.trim() : undefined
        }
    });
    return urls;
}

const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


const filterHrefFn = (href: string): boolean => !href.includes('@') && !href.includes('mailto');

const filterTextByTerms = (terms: string[], text?: string) => text ?
    terms.reduce((val, cur) => text.includes(cur) || val, false) :
    false;

const searchTechnologyKeywordsInPage = async (page: Page, keywords: string[]) => {
    const foundKeywords: string[] = [];
    for (const term of keywords) {
        const found = await page.evaluate(term => {
            return window.find(term);
        }, term);

        if (found) foundKeywords.push(term);
    }
    return foundKeywords;
}


export const searchHWWList = async () => {
    if (!process.env.TECHNOLOGIES_TERMS || !process.env.HREF_DISCOVER || !process.env.HWW_LIST) {
        console.log('TECHNOLOGIES_TERMS, HREF_DISCOVER, HWW_LIST should be configured in .env file');
        return;
    }
    const hrefKeywords = process.env.HREF_DISCOVER.split(",").map(m => m.trim());
    const technologiesKeywords = process.env.TECHNOLOGIES_TERMS.split(",").map(m => m.trim());

    console.log('Discovering hrefs with these keywords', hrefKeywords);
    console.log('Searching for these terms', technologiesKeywords);

    try {
        const urlsList = await getParsedList(process.env.HWW_LIST);
        const ignoreList = getIgnoreList();

        console.log('Ignored urls:', ignoreList.length);
        console.log('Total urls to start from:', urlsList.length - ignoreList.length);
        shuffleArray(urlsList);

        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        for (const item of urlsList) {
            if (item.url && !ignoreList.includes(item.url)) {
                try {
                    await page.goto(item.url, { waitUntil: 'domcontentloaded' });
                    const links = await page.evaluate(() => {
                        const results = [];
                        const hrefs = new Set();
                        const elements = document.querySelectorAll('a');
                        for (const element of elements) {
                            let text = element.textContent;
                            const href = element.href;
                            if (!hrefs.has(href)) {
                                hrefs.add(href);
                                if (text?.includes('<img') || text?.includes('<picture>') || text?.includes('src=')) {
                                    const match = text.match(/alt="([^"]+)"/g);
                                    if (match) {
                                        text = match[1];
                                    }
                                }

                                results.push({ name: text?.replace(/\n/g, "").trim(), href });
                            }
                        }
                        return results;
                    });


                    const foundTerms = await searchTechnologyKeywordsInPage(page, technologiesKeywords);
                    if (foundTerms.length > 0) {
                        db_found.insert({ id: Date.now(), found: foundTerms, url: item.url });
                        console.log('Found:', foundTerms, item.url);
                    } else {
                        db_searched.insert({ id: Date.now(), url: item.url });
                    }

                    const filtered = links.filter(l => filterTextByTerms(hrefKeywords, l.name?.toLocaleLowerCase()));
                    if (filtered.length > 0) {
                        for (const f of filtered.filter(f => filterHrefFn(f.href))) {
                            await page.goto(f.href, { waitUntil: 'domcontentloaded' });
                            const foundTerms = await searchTechnologyKeywordsInPage(page, technologiesKeywords);
                            if (foundTerms.length > 0) {

                                db_found.insert({ id: Date.now(), found: foundTerms, url: f.href });
                                console.log('Found:', foundTerms, f.href);
                            }
                        }
                    }

                    console.log(item.name, 'total discovered urls:', filtered.length);

                } catch (e: any) {

                    db_errored.insert({ id: Date.now(), error: e?.message, url: item.url });
                    console.log(e?.message, item.url);
                }
            }
        }
    } catch (e) {
        console.error(e);
    }
}