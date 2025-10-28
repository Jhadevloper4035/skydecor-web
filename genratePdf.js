// generateProductPdfs.js
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const htmlPdf = require("html-pdf-node");

async function generateAllProductPdfs() {
  try {
    console.log("🚀 Starting PDF generation process...\n");

    // Read products from JSON file
    const productsJsonPath = path.join(__dirname, "./data/products.json");

    if (!fs.existsSync(productsJsonPath)) {
      console.error("❌ Error: product.json not found at", productsJsonPath);
      process.exit(1);
    }

    const productsData = fs.readFileSync(productsJsonPath, "utf8");
    const products = JSON.parse(productsData);

    if (!products || products.length === 0) {
      console.error("❌ No products found in product.json");
      process.exit(1);
    }

    const totalProducts = products.length;
    let completed = 0;
    let failed = 0;

    console.log(`📦 Total products to process: ${totalProducts}\n`);

    // Create PDF folder
    const pdfFolder = path.join(__dirname, "./data/products/pdfs");
    if (!fs.existsSync(pdfFolder)) {
      fs.mkdirSync(pdfFolder, { recursive: true });
      console.log(`📁 Created PDF folder: ${pdfFolder}\n`);
    }

    // Check template exists
    const templatePath = path.join(
      __dirname,
      "./templates/productTemplate.ejs"
    );
    if (!fs.existsSync(templatePath)) {
      console.error("❌ Error: productTemplate.ejs not found at", templatePath);
      process.exit(1);
    }

    const startTime = Date.now();

    // Process products one by one
    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      try {
        // Render HTML from EJS
        const html = await ejs.renderFile(templatePath, { product });

        const options = {
          format: "A4",
          printBackground: true,
        };

        const file = { content: html };
        const pdfBuffer = await htmlPdf.generatePdf(file, options);

        // Save PDF with product code or ID
        const fileName = product.productCode || product._id || `product_${i}`;
        const pdfPath = path.join(pdfFolder, `${fileName}.pdf`);
        fs.writeFileSync(pdfPath, pdfBuffer);

        completed++;
        console.log(
          `✅ [${completed}/${totalProducts}] PDF generated: ${fileName}`
        );
      } catch (err) {
        failed++;
        const productName = product.productCode || product._id || "unknown";
        console.error(
          `❌ [${completed + failed}/${totalProducts}] Failed: ${productName}`,
          err.message
        );
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("\n" + "=".repeat(50));
    console.log("📊 PDF Generation Summary");
    console.log("=".repeat(50));
    console.log(`✅ Successfully generated: ${completed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📦 Total processed: ${totalProducts}`);
    console.log(`⏱️  Time taken: ${duration}s`);
    console.log(`📁 PDFs saved to: ${pdfFolder}`);
    console.log("=".repeat(50));

    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

// Run the script
generateAllProductPdfs();
