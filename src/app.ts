import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();


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
        console.log('List contains', list.length, 'urls');

    } catch (e) {
        console.error(e);
    }

})()

