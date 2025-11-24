const ejs = require('ejs');
const pdf = require('html-pdf');
const fs = require('fs').promises;
const path = require('path');



// PDF generation options
const pdfOptions = {
    format: 'A4',
    border: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
    },
    timeout: 30000,
    type: 'pdf',
    quality: '75'
};

/**
 * Generate single PDF from product data
 */
async function generateProductPDF(product, outputPath) {
    return new Promise(async (resolve, reject) => {
        try {
            // Read EJS template
            const templatePath = path.join(__dirname, 'templates', 'productTemplate.ejs');
            const template = await fs.readFile(templatePath, 'utf-8');

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
                    console.log(`✅ Generated: ${product.productCode}`);
                    resolve(result.filename);
                }
            });

        } catch (error) {
            console.error(`❌ Error processing ${product.productCode}:`, error.message);
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
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║       SKYDECOR PDF GENERATION - Starting...           ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');

        // Read products.json
        const productsJsonPath = path.join(__dirname, 'data', 'products.json');
        console.log(`📂 Reading: ${productsJsonPath}`);
        
        const jsonData = await fs.readFile(productsJsonPath, 'utf-8');
        const products = JSON.parse(jsonData);

        console.log(`📦 Found ${products.length} products\n`);
        console.log('🚀 Starting PDF generation...\n');

        // Output directory
        const outputDir = path.join(__dirname, 'uploads', 'product', 'pdf');
        await fs.mkdir(outputDir, { recursive: true });
        console.log(`📁 Output directory: ${outputDir}\n`);

        // Track results
        const results = [];
        let successCount = 0;
        let failCount = 0;

        // Generate PDFs one by one
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const progress = `[${i + 1}/${products.length}]`;

            console.log(`${progress} Processing: ${product.productCode || product.productName}`);

            // Create filename from product code
            const filename = `${(product.productCode || product.productName).replace(/\s+/g, '-')}.pdf`;
            const outputPath = path.join(outputDir, filename);

            try {
                await generateProductPDF(product, outputPath);
                results.push({
                    success: true,
                    productCode: product.productCode,
                    filename: filename,
                    path: outputPath
                });
                successCount++;
            } catch (error) {
                results.push({
                    success: false,
                    productCode: product.productCode,
                    error: error.message
                });
                failCount++;
            }

            // Show progress every 10 products
            if ((i + 1) % 10 === 0) {
                console.log(`\n📊 Progress: ${i + 1}/${products.length} (${successCount} successful, ${failCount} failed)\n`);
            }
        }

        // Calculate statistics
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        const avgTime = (duration / products.length).toFixed(2);

        // Display results
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║              PDF GENERATION COMPLETE                   ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');
        console.log(`⏱️  Total time: ${duration} seconds`);
        console.log(`📄 Total products: ${products.length}`);
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${failCount}`);
        console.log(`⚡ Average time per PDF: ${avgTime}s`);
        console.log(`📁 PDFs saved in: ${outputDir}\n`);

        // Show failed products if any
        if (failCount > 0) {
            console.log('❌ Failed Products:');
            results
                .filter(r => !r.success)
                .forEach(r => {
                    console.log(`   - ${r.productCode}: ${r.error}`);
                });
            console.log('');
        }

        // Save results log
        const logPath = path.join(outputDir, 'generation-log.json');
        await fs.writeFile(logPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            totalProducts: products.length,
            successful: successCount,
            failed: failCount,
            duration: duration,
            results: results
        }, null, 2));

        console.log(`📝 Log saved: ${logPath}\n`);

        return results;

    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error.message);
        console.error('\nPlease check:');
        console.error('1. data/products.json file exists');
        console.error('2. products.json has valid JSON format');
        console.error('3. templates/productTemplate.ejs file exists');
        console.error('4. You have write permissions for /uploads/product/pdf\n');
        throw error;
    }
}

/**
 * Generate single product PDF (for testing)
 */
async function generateSinglePDF(productCode) {
    try {
        const productsJsonPath = path.join(__dirname, 'data', 'products.json');
        const jsonData = await fs.readFile(productsJsonPath, 'utf-8');
        const products = JSON.parse(jsonData);

        const product = products.find(p => p.productCode === productCode);

        if (!product) {
            console.error(`❌ Product not found: ${productCode}`);
            return;
        }

        const outputDir = path.join(__dirname, 'uploads', 'product', 'pdf');
        const filename = `${product.productCode.replace(/\s+/g, '-')}.pdf`;
        const outputPath = path.join(outputDir, filename);

        await generateProductPDF(product, outputPath);
        console.log(`\n✅ PDF generated: ${outputPath}\n`);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

/**
 * Generate PDFs for a range of products (for testing)
 */
async function generateRange(startIndex, endIndex) {
    try {
        const productsJsonPath = path.join(__dirname, 'data', 'products.json');
        const jsonData = await fs.readFile(productsJsonPath, 'utf-8');
        const products = JSON.parse(jsonData);

        const subset = products.slice(startIndex, endIndex);
        console.log(`\nGenerating ${subset.length} PDFs (${startIndex} to ${endIndex})...\n`);

        const outputDir = path.join(__dirname, 'uploads', 'product', 'pdf');
        await fs.mkdir(outputDir, { recursive: true });

        for (const product of subset) {
            const filename = `${product.productCode.replace(/\s+/g, '-')}.pdf`;
            const outputPath = path.join(outputDir, filename);
            await generateProductPDF(product, outputPath);
        }

        console.log('\n✅ Range generation complete!\n');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args[0] === 'single' && args[1]) {
        // Generate single PDF: node generatepdf.js single "SD 1006 HG"
        generateSinglePDF(args[1]).catch(console.error);
    } else if (args[0] === 'range' && args[1] && args[2]) {
        // Generate range: node generatepdf.js range 0 10
        const start = parseInt(args[1]);
        const end = parseInt(args[2]);
        generateRange(start, end).catch(console.error);
    } else if (args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
        console.log(`
╔════════════════════════════════════════════════════════╗
║         SKYDECOR PDF GENERATOR - Usage Guide           ║
╚════════════════════════════════════════════════════════╝

Usage:
  node generatepdf.js                    Generate all PDFs from products.json
  node generatepdf.js single <code>      Generate single product PDF
  node generatepdf.js range <start> <end>  Generate range of products
  node generatepdf.js help               Show this help

Examples:
  node generatepdf.js                         # Generate all products
  node generatepdf.js single "SD 1006 HG"     # Generate one product
  node generatepdf.js range 0 10              # Generate first 10 products

Input:
  - Template: templates/productTemplate.ejs
  - Data: data/products.json
  
Output:
  - PDFs saved to: ./uploads/product/pdf/
  - Log file: ./uploads/product/pdf/generation-log.json

Requirements:
  - data/products.json file with array of product objects
  - templates/productTemplate.ejs template file
  - npm packages: ejs, html-pdf
        `);
    } else {
        // Default: Generate all PDFs
        generateAllPDFs().catch(error => {
            console.error('Generation failed:', error);
            process.exit(1);
        });
    }
}

// Export functions for use in other files
module.exports = {
    generateAllPDFs,
    generateProductPDF,
    generateSinglePDF,
    generateRange
};