import puppeteer from "puppeteer";
import select from "puppeteer-select";

async function timetable({ className }) {
    let browser;
    function delay(time) {
        return new Promise(function (resolve) {
            setTimeout(resolve, time)
        });
    }

    try {
        // lounch browser
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // set viewport
        await page.setViewport({ width: 1080, height: 768 });

        //navigate to url
        await page.goto("https://tsue.edupage.org/timetable/",);

        // wait for selector
        await page.waitForSelector("span[title='Классы']");

        //click to the span to open
        await page.click("span[title='Классы']");

        //get the element by class name and chek if it is exist or not
        const element = await select(page).getElement(`a:contains(${className.toUpperCase()})`);

        //click to the element
        await element.click();

        //delay to 1 second
        await delay(400);

        // take pdf and save it to ../source folder
        await page.pdf({ path: `./sources/${className}.pdf`, pageRanges: '1', printBackground: true, width: '800px', height: '800px' });

        console.log('timetable created');

    } catch (error) {
        console.error("Error: ", error);
        await browser.close();
    }
}

export default timetable;
