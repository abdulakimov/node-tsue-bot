// import puppeteer from "puppeteer";
import select from "puppeteer-select";
const chromium = require('chrome-aws-lambda');

export async function timetableForStudent({ className }) {
    let browser;
    function delay(time) {
        return new Promise(function (resolve) {
            setTimeout(resolve, time);
        });
    }

    try {
        // launch browser
        // browser = await puppeteer.launch({
        //     headless: true,
        //     args: ['--no-sandbox', '--disable-setuid-sandbox']
        // });

        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
        });

        const page = await browser.newPage();

        // set viewport
        await page.setViewport({ width: 1080, height: 768 });

        // navigate to url
        await page.goto("https://tsue.edupage.org/timetable/", { timeout: 0 });

        // wait for selector
        await page.waitForSelector("span[title='Классы']", { timeout: 0 });

        // click to the span to open
        await page.click("span[title='Классы']");

        // get the element by class name and check if it exists
        const element = await select(page).getElement(`a:contains(${className.toUpperCase()})`);

        // click to the element
        if (element.handle !== undefined) {
            await element.click();
        } else {
            console.log("element not found");
            return;
        }

        // delay to 1 second
        await delay(400);

        // take pdf and save it to ../source folder
        await page.pdf({ path: `./sources/${className}.pdf`, pageRanges: '1', printBackground: true, width: '800px', height: '800px' });

        console.log('timetable created');

    } catch (error) {
        console.log("Error: ", error);
    } finally {
        await browser.close();
    }
}

export async function timetableForTeacher({ teacherName }) {
    let browser;
    function delay(time) {
        return new Promise(function (resolve) {
            setTimeout(resolve, time);
        });
    }

    try {
        // launch browser
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // set viewport
        await page.setViewport({ width: 1080, height: 768 });

        // navigate to url
        await page.goto("https://tsue.edupage.org/timetable/", { timeout: 0 });

        // wait for selector
        await page.waitForSelector("span[title='Учителя']", { timeout: 0 });

        // click to the span to open
        await page.click("span[title='Учителя']");

        // get the element by class name and check if it exists
        const element = await select(page).getElement(`a:contains(${teacherName})`);

        // click to the element
        if (element.handle !== undefined) {
            await element.click();
        } else {
            console.log("element not found");
            return;
        }

        // delay to 1 second
        await delay(400);

        // take pdf and save it to ../source folder
        await page.pdf({ path: `./sources/${teacherName}.pdf`, pageRanges: '1', printBackground: true, width: '800px', height: '800px' });

        console.log('timetable created');

    } catch (error) {
        console.log("Error: ", error);
    } finally {
        await browser.close();
    }
}
