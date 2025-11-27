const ejs = require('ejs');
const pdf = require('html-pdf');
const fs = require('fs').promises;
const path = require('path');

// PDF generation options
const pdfOptions = {
    format: 'A4',
    border: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
    },
    timeout: 30000,
    type: 'pdf',
    quality: '75'
};

/**
 * Generate PDF from product data
 * @param {Object} product - Product data object
 * @param {String} outputPath - Full path where PDF should be saved
 * @returns {Promise<String>} - Resolves with filename on success
 */
async function generateProductPDF(product, outputPath) {
    return new Promise(async (resolve, reject) => {
        try {
            // Read EJS template
            const templatePath = path.join(__dirname, '..', 'templates', 'productTemplate.ejs');
            const template = await fs.readFile(templatePath, 'utf-8');

            // Render HTML from template
            const html = ejs.render(template, product);

            // Create directory if it doesn't exist
            const dir = path.dirname(outputPath);
            await fs.mkdir(dir, { recursive: true });

            // Generate PDF
            pdf.create(html, pdfOptions).toFile(outputPath, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.filename);
                }
            });

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Check if file exists
 * @param {String} filePath - Full path to file
 * @returns {Promise<Boolean>} - True if file exists, false otherwise
 */
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get PDF file path for a product
 * @param {String} productCode - Product code
 * @returns {Object} - Object containing uploadsDir, filename, and filePath
 */
function getPDFPath(productCode) {
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'product', 'pdf');
    const filename = `${productCode.replace(/\s+/g, '-')}.pdf`;
    const filePath = path.join(uploadsDir, filename);

    return {
        uploadsDir,
        filename,
        filePath
    };
}

/**
 * Delete PDF file
 * @param {String} filePath - Full path to PDF file
 * @returns {Promise<Boolean>} - True if deleted successfully
 */
async function deletePDF(filePath) {
    try {
        const exists = await fileExists(filePath);
        if (!exists) {
            return false;
        }
        await fs.unlink(filePath);
        return true;
    } catch (error) {
        throw error;
    }
}

/**
 * Get PDF file statistics
 * @param {String} filePath - Full path to PDF file
 * @returns {Promise<Object>} - File statistics object
 */
async function getPDFStats(filePath) {
    try {
        const stats = await fs.stat(filePath);
        return {
            fileSize: stats.size,
            fileSizeKB: (stats.size / 1024).toFixed(2),
            fileSizeMB: (stats.size / (1024 * 1024)).toFixed(2),
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
        };
    } catch (error) {
        throw error;
    }
}

/**
 * Validate product code format
 * @param {String} productCode - Product code to validate
 * @returns {Boolean} - True if valid, false otherwise
 */
function isValidProductCode(productCode) {
    if (!productCode || typeof productCode !== 'string') {
        return false;
    }
    // Allow alphanumeric, spaces, hyphens, and underscores
    return /^[a-zA-Z0-9\s\-_]+$/.test(productCode);
}

/**
 * Create uploads directory if it doesn't exist
 * @param {String} dirPath - Directory path to create
 * @returns {Promise<void>}
 */
async function ensureUploadDirectory(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        throw error;
    }
}

/**
 * Get all PDF files in uploads directory
 * @returns {Promise<Array>} - Array of PDF filenames
 */
async function getAllPDFs() {
    try {
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'product', 'pdf');
        await ensureUploadDirectory(uploadsDir);

        const files = await fs.readdir(uploadsDir);
        return files.filter(file => file.endsWith('.pdf'));
    } catch (error) {
        throw error;
    }
}

/**
 * Clean up old PDFs (older than specified days)
 * @param {Number} days - Number of days
 * @returns {Promise<Array>} - Array of deleted filenames
 */
async function cleanupOldPDFs(days = 30) {
    try {
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'product', 'pdf');
        const files = await fs.readdir(uploadsDir);
        const deletedFiles = [];
        const maxAge = days * 24 * 60 * 60 * 1000; // Convert days to milliseconds

        for (const file of files) {
            if (!file.endsWith('.pdf')) continue;

            const filePath = path.join(uploadsDir, file);
            const stats = await fs.stat(filePath);
            const age = Date.now() - stats.mtime.getTime();

            if (age > maxAge) {
                await fs.unlink(filePath);
                deletedFiles.push(file);
            }
        }

        return deletedFiles;
    } catch (error) {
        throw error;
    }
}

/**
 * Get total size of all PDFs
 * @returns {Promise<Object>} - Object with total size info
 */
async function getTotalPDFSize() {
    try {
        const pdfs = await getAllPDFs();
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'product', 'pdf');
        let totalSize = 0;

        for (const pdf of pdfs) {
            const filePath = path.join(uploadsDir, pdf);
            const stats = await fs.stat(filePath);
            totalSize += stats.size;
        }

        return {
            totalFiles: pdfs.length,
            totalSize: totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2),
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
        };
    } catch (error) {
        throw error;
    }
}

module.exports = {
    generateProductPDF,
    fileExists,
    getPDFPath,
    deletePDF,
    getPDFStats,
    isValidProductCode,
    ensureUploadDirectory,
    getAllPDFs,
    cleanupOldPDFs,
    getTotalPDFSize,
    pdfOptions
};