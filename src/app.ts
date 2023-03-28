import axios from "axios";
import * as dotenv from "dotenv";
import puppeteer, { Page } from "puppeteer";
import { db_errored, db_found } from "./db";

import Enquirer from 'enquirer';

dotenv.config();

declare global {
    interface Window {
        find?: any;
    }
}

const parseList = async (listUrl: string) => {
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

const filterHrefFn = (href: string): boolean => !href.includes('@') && !href.includes('mailto');

const filterTextByTerms = (terms: string[], text?: string) => {
    if (text)
        return terms.reduce((val, cur) => text.includes(cur) || val, false);
    return false;
}


const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

const loadPageAndSearchForJobs = async (page: Page, terms: string[]) => {
    const foundTerms: string[] = [];
    for (const term of terms) {
        const found = await page.evaluate(term => {
            return window.find(term);
        }, term);

        if (found) foundTerms.push(term);
    }
    return foundTerms;
}

const showAllFound = () => {
    Array.from(db_found).forEach(f => console.log(f.url, f.found))
}


const getIgnoreList = () => {
    return [
        ...Array.from(db_found).map(m => m.url),
        ...Array.from(db_errored).map(m => m.url),
    ]
}

// showAllFound();

// (async()=>{
//     const prompt =await Enquirer.prompt({
//         choices:['apple', 'grape', 'watermelon', 'cherry', 'orange'],
//         message:'Pick',
//         name:'color',
//         type:'select',
//     })

//     console.log(prompt);
    
// })()



  

(async () => {

   

    if (!process.env.TECHNOLOGIES_TERMS || !process.env.HREF_DISCOVER || !process.env.HWW_LIST) {
        console.log('TECHNOLOGIES_TERMS, HREF_DISCOVER, HWW_LIST should be configured in .env file');
        return;
    }
    const hrefKeywords = process.env.HREF_DISCOVER.split(",").map(m => m.trim());
    const technologiesKeywords = process.env.TECHNOLOGIES_TERMS.split(",").map(m => m.trim());

    console.log('Discovering hrefs with these keywords', hrefKeywords);
    console.log('Searching for these terms', technologiesKeywords);

    try {
        const list = await parseList(process.env.HWW_LIST);
        const ignoreList = getIgnoreList();

        console.log('ignore list length:', ignoreList.length);


        console.log('List contains', list.length, 'urls');
        shuffleArray(list);

        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        for (const item of list) {
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


                    const foundTerms: string[] = [];
                    for (const term of technologiesKeywords) {
                        const found = await page.evaluate(term => {
                            return window.find(term);
                        }, term);

                        if (found) foundTerms.push(term);
                    }

                    if (foundTerms.length > 0)
                        console.log('!!!!Found!!!!', foundTerms, item.url);

                    const filtered = links.filter(l => filterTextByTerms(hrefKeywords, l.name?.toLocaleLowerCase()));
                    if (filtered.length > 0) {
                        for (const f of filtered.filter(f => filterHrefFn(f.href))) {
                            await page.goto(f.href, { waitUntil: 'domcontentloaded' });
                            const foundJobs = await loadPageAndSearchForJobs(page, technologiesKeywords);
                            if (foundJobs.length > 0) {

                                db_found.insert({ id: Date.now(), found: foundJobs, url: f.href });
                                console.log('!!!!Found!!!!', foundJobs, f.href);
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

})()

