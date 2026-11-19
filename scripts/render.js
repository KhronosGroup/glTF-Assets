const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ModelMap = require('./../src/data/model-index.SampleAssets.json'); // Adjust the path to your JSON file

(async () => {
  const browser = await puppeteer.launch({
    headless: true, // Uses the "new" headless mode
    args: ['--disable-web-security', '--allow-file-access-from-files', '--enable-webgl', '--ignore-gpu-blacklist', '--use-gl=angle', '--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));
  page.on('requestfailed', request => {
    console.error(`❌ FAILED REQUEST: ${request.url()} - ${request.failure().errorText}`);
  });

  // Dummy load to avoid stalls later in the process
  //const htmlPath = `file://${path.resolve(__dirname, 'viewer.html')}?`;  
  //await page.goto(htmlPath, { waitUntil: 'networkidle2' });
  // Set viewport and take screenshot
  await page.setViewport({ width: 1920, height: 1080 });
  //await new Promise(resolve => setTimeout(resolve, 3000));  

  // Create thumbnails dir
  //const imagesDir = path.resolve(__dirname, "images");
  const imagesDir = path.resolve(__dirname, "..", "public", "images");
  fs.mkdirSync(imagesDir, { recursive: true });

  const model_names = Object.keys(ModelMap)//.filter((e,i) => i == 2);
  for(const model_name of model_names)
  {
    //if(model_name !== 'DispersionTest')
    //  continue;

    if(fs.existsSync(path.join(imagesDir, `${model_name}.webp`)))
      continue;

    const model = ModelMap[model_name].gltfModel;
    console.log("Processing", model_name, model);
    const yaw = ModelMap[model_name].camera.yaw;
    const pitch = ModelMap[model_name].camera.pitch;
    const distance = ModelMap[model_name].camera.distance;
    const htmlPath = `file://${path.resolve(__dirname, 'viewer.html')}?model=${model}&yaw=${yaw}&pitch=${pitch}&distance=${distance}`;
    
    await page.goto(htmlPath, { waitUntil: 'networkidle2' });
    await page.waitForNetworkIdle();

    // Set viewport and take screenshot
    //await page.setViewport({ width: 1920, height: 1080 });

    // Total: 4 sec
    const totalFrames = 100;
    const frameDelay = 40; // ms between frames

    //const startedValue = await page.evaluate(() => window.renderStarted);
    //console.log('window.renderStarted =', startedValue);

    await page.waitForFunction(() => window.renderStarted === true, {
      timeout: 15000 // optional: wait max 15 seconds
    });

    const screenshotBuffers = [];
    for (let i = 0; i < totalFrames; i++) {
      const screenshotBuffer = await page.screenshot({ fullPage: true });
      screenshotBuffers.push(screenshotBuffer);
      //console.log(`Captured frame ${i + 1}/${totalFrames}`);
      await new Promise(resolve => setTimeout(resolve, frameDelay));  
    }
    await sharp(screenshotBuffers, { join: { animated: true }}).webp({loop: 0})
    .toFile(path.join(imagesDir, `${model_name}.webp`), (err, info) => {
      if (err) {
        console.error('Error saving image:', err);
      } else {
        console.log('Screenshot saved:');
      }
    });
  }

  await browser.close();
})();