// generateProductPdfs.js
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const puppeteer = require("puppeteer");
const { PDFDocument } = require("pdf-lib");

// Configuration
const CONFIG = {
  maxSize: 1024 * 1024, // 1MB in bytes
  concurrency: 5, // Process 5 PDFs at once for speed
  timeout: 30000, // 30 second timeout per PDF
};

// Compress PDF using pdf-lib
async function compressPdf(pdfBuffer) {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const compressedPdfBytes = await pdfDoc.save({
      useObjectStreams: false,
      addDefaultPage: false,
      objectsPerTick: 50,
    });
    return Buffer.from(compressedPdfBytes);
  } catch (err) {
    console.log("⚠️  PDF compression failed, using original");
    return pdfBuffer;
  }
}

// Generate PDF using Puppeteer with optimization
async function generatePdfWithPuppeteer(browser, html, quality = "normal") {
  const page = await browser.newPage();

  try {
    // Set viewport for consistent rendering
    await page.setViewport({ width: 1024, height: 768 });

    // Optimize based on quality level
    const imageQuality =
      quality === "high" ? "max-width: 800px" :
      quality === "normal" ? "max-width: 600px" :
      "max-width: 400px";

    const optimizedHtml = html.replace(/max-width:\s*\d+px/g, imageQuality);

    await page.setContent(optimizedHtml, {
      waitUntil: "networkidle0",
      timeout: CONFIG.timeout,
    });

    // Generate PDF with compression settings
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: false,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

// Process single product
async function processProduct(browser, product, index, totalProducts, pdfFolder, templatePath) {
  const fileName = product.productCode || product._id || `product_${index}`;
  const pdfPath = path.join(pdfFolder, `${fileName}.pdf`);

  // Skip if PDF already exists
  if (fs.existsSync(pdfPath)) {
    const fileSize = (fs.statSync(pdfPath).size / 1024).toFixed(2);
    return {
      status: "skipped",
      fileName,
      size: fileSize,
    };
  }

  try {
    // Render HTML from EJS
    const html = await ejs.renderFile(templatePath, { product });

    // Prepare optimized HTML template
    const baseHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          img {
            max-width: 800px;
            height: auto;
            image-rendering: -webkit-optimize-contrast;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;

    let pdfBuffer;
    let fileSize;
    let quality = "normal";
    let compressed = false;

    // Try normal quality first
    pdfBuffer = await generatePdfWithPuppeteer(browser, baseHtml, "normal");
    fileSize = pdfBuffer.length;

    // If too large, try lower quality
    if (fileSize > CONFIG.maxSize) {
      console.log(
        `   ⚠️  ${fileName}: ${(fileSize / 1024 / 1024).toFixed(2)} MB, reducing quality...`
      );
      pdfBuffer = await generatePdfWithPuppeteer(browser, baseHtml, "low");
      fileSize = pdfBuffer.length;
      compressed = true;
      quality = "low";

      // If still too large, apply pdf-lib compression
      if (fileSize > CONFIG.maxSize) {
        console.log(`   ⚠️  ${fileName}: Applying PDF compression...`);
        pdfBuffer = await compressPdf(pdfBuffer);
        fileSize = pdfBuffer.length;
      }
    }

    // Always apply final compression for optimal size
    pdfBuffer = await compressPdf(pdfBuffer);
    fileSize = pdfBuffer.length;

    // Save PDF
    fs.writeFileSync(pdfPath, pdfBuffer);

    const finalSize = (fileSize / 1024).toFixed(2);
    const sizeStatus = fileSize > CONFIG.maxSize ? "⚠️  OVER 1MB" : "✅";

    return {
      status: "success",
      fileName,
      size: finalSize,
      sizeStatus,
      compressed,
      quality,
    };
  } catch (err) {
    return {
      status: "failed",
      fileName,
      error: err.message,
    };
  }
}

// Process products in batches for parallel execution
async function processBatch(browser, products, startIndex, batchSize, totalProducts, pdfFolder, templatePath) {
  const batch = products.slice(startIndex, startIndex + batchSize);
  const promises = batch.map((product, i) =>
    processProduct(browser, product, startIndex + i, totalProducts, pdfFolder, templatePath)
  );
  return await Promise.all(promises);
}

async function generateAllProductPdfs() {
  let browser;

  try {
    console.log("🚀 Starting PDF generation process with Puppeteer...\n");

    // Read products from JSON file
    const productsJsonPath = path.join(__dirname, "./data/products.json");

    if (!fs.existsSync(productsJsonPath)) {
      console.error("❌ Error: products.json not found at", productsJsonPath);
      process.exit(1);
    }

    const productsData = fs.readFileSync(productsJsonPath, "utf8");
    const products = JSON.parse(productsData);

    if (!products || products.length === 0) {
      console.error("❌ No products found in products.json");
      process.exit(1);
    }

    const totalProducts = products.length;
    console.log(`📦 Total products to process: ${totalProducts}`);
    console.log(`⚡ Parallel processing: ${CONFIG.concurrency} at a time\n`);

    // Create PDF folder
    const pdfFolder = path.join(__dirname, "./data/products/pdfs");
    if (!fs.existsSync(pdfFolder)) {
      fs.mkdirSync(pdfFolder, { recursive: true });
      console.log(`📁 Created PDF folder: ${pdfFolder}\n`);
    }

    // Check template exists
    const templatePath = path.join(__dirname, "./templates/productTemplate.ejs");
    if (!fs.existsSync(templatePath)) {
      console.error("❌ Error: productTemplate.ejs not found at", templatePath);
      process.exit(1);
    }

    const startTime = Date.now();

    // Launch Puppeteer browser once (reuse for all PDFs)
    console.log("🌐 Launching Puppeteer browser...\n");
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    let completed = 0;
    let failed = 0;
    let skipped = 0;
    let compressed = 0;

    // Process in batches
    for (let i = 0; i < products.length; i += CONFIG.concurrency) {
      const results = await processBatch(
        browser,
        products,
        i,
        CONFIG.concurrency,
        totalProducts,
        pdfFolder,
        templatePath
      );

      // Process results
      for (const result of results) {
        if (result.status === "skipped") {
          skipped++;
          completed++;
          console.log(
            `⏭️  [${completed}/${totalProducts}] Skipped (exists): ${result.fileName} (${result.size} KB)`
          );
        } else if (result.status === "success") {
          completed++;
          if (result.compressed) compressed++;
          console.log(
            `${result.sizeStatus} [${completed}/${totalProducts}] PDF generated: ${result.fileName} (${result.size} KB)`
          );
        } else if (result.status === "failed") {
          failed++;
          console.error(
            `❌ [${completed + failed}/${totalProducts}] Failed: ${result.fileName}`,
            result.error
          );
        }
      }
    }

    await browser.close();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    const avgTime = (duration / totalProducts).toFixed(2);

    console.log("\n" + "=".repeat(50));
    console.log("📊 PDF Generation Summary");
    console.log("=".repeat(50));
    console.log(`✅ Successfully generated: ${completed - skipped}`);
    console.log(`⏭️  Skipped (already exists): ${skipped}`);
    console.log(`🗜️  Compressed: ${compressed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📦 Total processed: ${totalProducts}`);
    console.log(`⏱️  Total time: ${duration}s`);
    console.log(`⚡ Average time per PDF: ${avgTime}s`);
    console.log(`🚀 Concurrency: ${CONFIG.concurrency} parallel processes`);
    console.log(`📁 PDFs saved to: ${pdfFolder}`);
    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ Fatal error:", error);
    if (browser) await browser.close();
    process.exit(1);
  } finally {
    console.log("✅ Process completed");
    process.exit(0);
  }
}

// Run the script
generateAllProductPdfs();