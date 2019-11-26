'use strict'

/**
 * Dependencies
 */

const camelcase = require('camelcase');
const meow = require('meow');
const download = require('./dl');
const scrape = require('./scrape');
const showHelp = require('../helpers/showHelp');
const sleep = require('../helpers/sleep');
const launchBrowser = require('../helpers/launchBrowser');

/**
 * Parse args
 */

const cli = meow(`
  Usage
    $ cast google-images [OPTIONS] QUERY
  
  Options
    --count COUNT      Specify how many images to download.
    --size SIZE        Filter results by image size.
                       Large, Medium, Icon, Larger than 2MP,8MP,40MP,70MP.
    --color COLOR      Filter results by image size.
                       Black and white, red, orange, yellow, green, purple, pink,
                       grey, white, black.
    --time TIME        Filter results by time.
                       Past 24 hours, past week, past month, past year.
    --type TYPE        Filter results by type.
                       Face, photo, clip art, line drawing, animated.
    --region REGION    Filter results by region.
                       United Kingdom, United States, Uruguay, ...
    --format FORMAT    Filter results by file format.
                       JPG, PNG, GIF, BMP, SVG, ICO.
`, {
  description: 'Search and download Google Images.',
  flags: {
    count:  { type: 'integer' },
    size:   { type: 'string' },
    color:  { type: 'string' },
    time:   { type: 'string' },
    type:   { type: 'string' },
    region: { type: 'string' },
    format: { type: 'string' }
  }
})

 /**
 * Define script
 */

async function google_images(query=null, options={}) {
  showHelp(cli, [(!query && cli.input.length < 2)])

  query = query || cli.input.slice(1);
  const count = options.count || cli.flags.count || 80;
  const label = options.label || camelcase(query, { pascalCase: true });
  const size = options.size || cli.flags.size;
  const color = options.color || cli.flags.color;
  const time = options.time || cli.flags.time;
  const type = options.type || cli.flags.type;
  const region = options.region || cli.flags.region;
  const format = options.format || cli.flags.format;

  const browser = await launchBrowser({
    headless: false,
    delay: 400,
    defaultViewport: {
      width: 1024,
      height: 800
    }
  });

  try {
    let imageUrls = [];
    const targetUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
    const result = await scrape(targetUrl, {
      selector: 'div#search img',
      infiniteScroll: true,
      count,
      browser
    });
    console.log('result', result, result.length);
    browser.close();
    process.exit(0);

    // Parse all image URLs on page.
    imageUrls = imageUrls.concat(
      result.reduce((urls, imageHtml) => {
        const match = imageHtml.match(/"(https.*?images.*?)"/);
        if (match) urls.push(match[1]);
        return urls;
      }, [])
    );

    console.log('imageUrls', imageUrls, imageUrls.length);
    // // Download all images.
    // for (let i = 0; i < imageUrls.length; i++) {
    //   download(imageUrls[i], `${label}-${i}`)
    //   await sleep(200)
    // }
  } catch (err) {
    console.error(err);
  } finally {
    browser.close();
  }
}

/**
 * Export script
 */

module.exports = google_images
