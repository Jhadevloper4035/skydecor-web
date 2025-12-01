const ejs = require("ejs");
const pdf = require("html-pdf");
const fs = require("fs").promises;
const path = require("path");

// PDF generation options
const pdfOptions = {
  format: "A4",
  border: {
    top: "20px",
    right: "20px",
    bottom: "20px",
    left: "20px",
  },
  timeout: 30000,
  type: "pdf",
  quality: "75",
};

/**
 * Generate single PDF from product data
 */
async function generateProductPDF(product, outputPath) {
  return new Promise(async (resolve, reject) => {
    try {
      // Read EJS template
      const templatePath = path.join(
        __dirname,
        "templates",
        "productTemplate.ejs"
      );
      const template = await fs.readFile(templatePath, "utf-8");

      // Render HTML from template
      const html = ejs.render(template, product);

      // Create directory if it doesn't exist
      const dir = path.dirname(outputPath);
      await fs.mkdir(dir, { recursive: true });

      // Generate PDF
      pdf.create(html, pdfOptions).toFile(outputPath, (err, result) => {
        if (err) {
          console.error(`❌ Failed: ${product.productCode} - ${err.message}`);
          reject(err);
        } else {
          resolve(result.filename);
        }
      });
    } catch (error) {
      console.error(
        `❌ Error processing ${product.productCode}:`,
        error.message
      );
      reject(error);
    }
  });
}

/**
 * Main function - Read products.json and generate all PDFs
 */
async function generateAllPDFs() {
  const startTime = Date.now();

  try {
    // Read products.json
    const productsJsonPath = path.join(__dirname, "data", "products.json");

    const jsonData = await fs.readFile(productsJsonPath, "utf-8");
    const products = JSON.parse(jsonData);

    // Output directory
    const outputDir = path.join(__dirname, "uploads", "product", "pdf");
    await fs.mkdir(outputDir, { recursive: true });

    // Track results
    const results = [];
    let successCount = 0;
    let failCount = 0;

    // Generate PDFs one by one
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const progress = `[${i + 1}/${products.length}]`;

      // Create filename from product code
      const filename = `${(product.productCode || product.productName).replace(
        /\s+/g,
        "-"
      )}.pdf`;
      const outputPath = path.join(outputDir, filename);

      try {
        await generateProductPDF(product, outputPath);
        results.push({
          success: true,
          productCode: product.productCode,
          filename: filename,
          path: outputPath,
        });
        successCount++;
      } catch (error) {
        results.push({
          success: false,
          productCode: product.productCode,
          error: error.message,
        });
        failCount++;
      }

      // Show progress every 10 products
      if ((i + 1) % 10 === 0) {
      }
    }

    // Calculate statistics
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    const avgTime = (duration / products.length).toFixed(2);

    // Show failed products if any
    if (failCount > 0) {
      results.filter((r) => !r.success).forEach((r) => {});
    }

    // Save results log
    const logPath = path.join(outputDir, "generation-log.json");
    await fs.writeFile(
      logPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          totalProducts: products.length,
          successful: successCount,
          failed: failCount,
          duration: duration,
          results: results,
        },
        null,
        2
      )
    );

    return results;
  } catch (error) {
    console.error("\n❌ FATAL ERROR:", error.message);
    console.error("\nPlease check:");
    console.error("1. data/products.json file exists");
    console.error("2. products.json has valid JSON format");
    console.error("3. templates/productTemplate.ejs file exists");
    console.error("4. You have write permissions for /uploads/product/pdf\n");
    throw error;
  }
}

/**
 * Generate single product PDF (for testing)
 */
async function generateSinglePDF(productCode) {
  try {
    const productsJsonPath = path.join(__dirname, "data", "products.json");
    const jsonData = await fs.readFile(productsJsonPath, "utf-8");
    const products = JSON.parse(jsonData);

    const product = products.find((p) => p.productCode === productCode);

    if (!product) {
      console.error(`❌ Product not found: ${productCode}`);
      return;
    }

    const outputDir = path.join(__dirname, "uploads", "product", "pdf");
    const filename = `${product.productCode.replace(/\s+/g, "-")}.pdf`;
    const outputPath = path.join(outputDir, filename);

    await generateProductPDF(product, outputPath);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

/**
 * Generate PDFs for a range of products (for testing)
 */
async function generateRange(startIndex, endIndex) {
  try {
    const productsJsonPath = path.join(__dirname, "data", "products.json");
    const jsonData = await fs.readFile(productsJsonPath, "utf-8");
    const products = JSON.parse(jsonData);

    const subset = products.slice(startIndex, endIndex);

    const outputDir = path.join(__dirname, "uploads", "product", "pdf");
    await fs.mkdir(outputDir, { recursive: true });

    for (const product of subset) {
      const filename = `${product.productCode.replace(/\s+/g, "-")}.pdf`;
      const outputPath = path.join(outputDir, filename);
      await generateProductPDF(product, outputPath);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === "single" && args[1]) {
    // Generate single PDF: node generatepdf.js single "SD 1006 HG"
    generateSinglePDF(args[1]).catch(console.error);
  } else if (args[0] === "range" && args[1] && args[2]) {
    // Generate range: node generatepdf.js range 0 10
    const start = parseInt(args[1]);
    const end = parseInt(args[2]);
    generateRange(start, end).catch(console.error);
  } else if (args[0] === "help" || args[0] === "--help" || args[0] === "-h") {
  } else {
    // Default: Generate all PDFs
    generateAllPDFs().catch((error) => {
      console.error("Generation failed:", error);
      process.exit(1);
    });
  }
}

// Export functions for use in other files
module.exports = {
  generateAllPDFs,
  generateProductPDF,
  generateSinglePDF,
  generateRange,
};
