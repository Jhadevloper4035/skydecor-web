const Product = require("../models/product.js");
const path = require("path");
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const fs = require("fs");
const Page = require("../models/seoSchema.js");

const {
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
} = require("../middleware/producthelper.js");

exports.getProductPDF = async (req, res) => {
  try {
    const { productCode } = req.params;

    // Validate product code
    if (!productCode) {
      return res.status(400).json({
        success: false,
        message: "Product code is required",
      });
    }

    if (!isValidProductCode(productCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product code format",
      });
    }

    // Fetch product from database
    const product = await Product.findOne({ productCode: productCode })

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with code: ${productCode}`,
      });
    }

    // Get PDF file paths
    const { filePath, filename } = getPDFPath(productCode);

    // Check if PDF already exists
    const pdfExists = await fileExists(filePath);

    if (pdfExists) {
      // Return existing PDF
      return res.download(filePath, filename, (err) => {
        if (err) {
          console.error("Error sending file:", err);
          return res.status(500).json({
            success: false,
            message: "Error downloading file",
          });
        }
      });
    } else {
      // Generate new PDF
      try {
        await generateProductPDF(product.toObject(), filePath);

        // Return newly generated PDF
        return res.download(filePath, filename, (err) => {
          if (err) {
            console.error("Error sending file:", err);
            return res.status(500).json({
              success: false,
              message: "Error downloading file",
            });
          }
        });
      } catch (pdfError) {
        console.error("PDF generation error:", pdfError);
        return res.status(500).json({
          success: false,
          message: "Failed to generate PDF",
          error: pdfError.message,
        });
      }
    }
  } catch (error) {
    console.error("Controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.streamProductPDF = async (req, res) => {
  try {
    const { productCode } = req.params;

    if (!productCode) {
      return res.status(400).json({
        success: false,
        message: "Product code is required",
      });
    }

    if (!isValidProductCode(productCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product code format",
      });
    }

    // Fetch product from database
    const product = await Product.findOne({ productCode: productCode });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with code: ${productCode}`,
      });
    }

    // Get PDF file paths
    const { filePath, filename } = getPDFPath(productCode);

    // Check if PDF already exists
    const pdfExists = await fileExists(filePath);

    if (pdfExists) {
      // Stream existing PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

      const fileStream = require("fs").createReadStream(filePath);
      fileStream.pipe(res);
    } else {
      // Generate new PDF
      try {
        await generateProductPDF(product.toObject(), filePath);

        // Stream newly generated PDF
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

        const fileStream = require("fs").createReadStream(filePath);
        fileStream.pipe(res);
      } catch (pdfError) {
        console.error("PDF generation error:", pdfError);
        return res.status(500).json({
          success: false,
          message: "Failed to generate PDF",
          error: pdfError.message,
        });
      }
    }
  } catch (error) {
    console.error("Controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.deleteProductPDF = async (req, res) => {
  try {
    const { productCode } = req.params;

    if (!productCode) {
      return res.status(400).json({
        success: false,
        message: "Product code is required",
      });
    }

    if (!isValidProductCode(productCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product code format",
      });
    }

    // Get PDF file paths
    const { filePath, filename } = getPDFPath(productCode);

    // Delete the PDF
    const deleted = await deletePDF(filePath);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "PDF file not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "PDF deleted successfully",
      productCode: productCode,
      filename: filename,
    });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting PDF",
      error: error.message,
    });
  }
};

exports.regenerateProductPDF = async (req, res) => {
  try {
    const { productCode } = req.params;

    if (!productCode) {
      return res.status(400).json({
        success: false,
        message: "Product code is required",
      });
    }

    if (!isValidProductCode(productCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product code format",
      });
    }

    // Fetch product from database
    const product = await Product.findOne({ productCode: productCode });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with code: ${productCode}`,
      });
    }

    // Get PDF file paths
    const { filePath, filename } = getPDFPath(productCode);

    // Delete existing PDF if present
    await deletePDF(filePath);

    // Generate new PDF
    try {
      await generateProductPDF(product.toObject(), filePath);

      // Return newly generated PDF
      return res.download(filePath, filename, (err) => {
        if (err) {
          console.error("Error sending file:", err);
          return res.status(500).json({
            success: false,
            message: "Error downloading file",
          });
        }
      });
    } catch (pdfError) {
      console.error("PDF generation error:", pdfError);
      return res.status(500).json({
        success: false,
        message: "Failed to regenerate PDF",
        error: pdfError.message,
      });
    }
  } catch (error) {
    console.error("Controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getProductPDFInfo = async (req, res) => {
  try {
    const { productCode } = req.params;

    if (!productCode) {
      return res.status(400).json({
        success: false,
        message: "Product code is required",
      });
    }

    if (!isValidProductCode(productCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product code format",
      });
    }

    // Check if product exists
    const product = await Product.findOne({ productCode: productCode });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with code: ${productCode}`,
      });
    }

    // Get PDF file paths
    const { filePath, filename } = getPDFPath(productCode);

    // Check if PDF exists
    const pdfExists = await fileExists(filePath);

    if (!pdfExists) {
      return res.status(200).json({
        success: true,
        productCode: productCode,
        pdfExists: false,
        message: "PDF not generated yet",
      });
    }

    // Get file stats
    const stats = await getPDFStats(filePath);

    return res.status(200).json({
      success: true,
      productCode: productCode,
      pdfExists: true,
      filename: filename,
      fileSize: stats.fileSize,
      fileSizeKB: stats.fileSizeKB,
      fileSizeMB: stats.fileSizeMB,
      createdAt: stats.createdAt,
      modifiedAt: stats.modifiedAt,
      downloadUrl: `/api/product/pdf/${productCode}`,
      streamUrl: `/api/product/pdf/stream/${productCode}`,
    });
  } catch (error) {
    console.error("Info error:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting PDF info",
      error: error.message,
    });
  }
};

exports.getAllPDFsList = async (req, res) => {
  try {
    const pdfs = await getAllPDFs();
    const totalInfo = await getTotalPDFSize();

    return res.status(200).json({
      success: true,
      count: pdfs.length,
      pdfs: pdfs,
      totalSize: totalInfo,
    });
  } catch (error) {
    console.error("List error:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting PDFs list",
      error: error.message,
    });
  }
};

exports.cleanupOldPDFs = async (req, res) => {
  try {
    const { days } = req.params;
    const daysNumber = parseInt(days) || 30;

    const deletedFiles = await cleanupOldPDFs(daysNumber);

    return res.status(200).json({
      success: true,
      message: `Cleaned up PDFs older than ${daysNumber} days`,
      deletedCount: deletedFiles.length,
      deletedFiles: deletedFiles,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return res.status(500).json({
      success: false,
      message: "Error cleaning up PDFs",
      error: error.message,
    });
  }
};

exports.getPDFStats = async (req, res) => {
  try {
    const totalInfo = await getTotalPDFSize();

    return res.status(200).json({
      success: true,
      statistics: {
        totalPDFs: totalInfo.totalFiles,
        totalSize: {
          bytes: totalInfo.totalSize,
          kb: totalInfo.totalSizeKB,
          mb: totalInfo.totalSizeMB,
        },
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting PDF statistics",
      error: error.message,
    });
  }
};

exports.getSingleProduct = async (req, res) => {
  try {
    const { productCode } = req.params;

    const product = await Product.findOne({
      productCode: { $regex: new RegExp("^" + productCode + "$", "i") },
    }).lean();

    if (!product) {
      return res.status(404).render("error", {
        title: "Product Not Found - SkyDecor",
        message: "Sorry, the requested product does not exist.",
      });
    }

    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
    })
      .limit(4)
      .lean();

    res.render("product-pages/single-product", {
      title: `${product.productCode} - SkyDecor`,
      product,
      relatedProducts,
    });
  } catch (error) {
    console.error("❌ Error fetching product:", error);
    res.status(500).render("error", {
      title: "Server Error - SkyDecor",
      message: "Something went wrong. Please try again later.",
    });
  }
};

exports.getAllCategoryProduct = async (req, res) => {
  try {
    const { productType } = req.params;
    const { category } = req.query;

    const query = { productType };
    if (category) query.category = category;

    const products = await Product.find(query).lean();
    const page = await Page.findOne({
      productType,
    }).lean();

    if (!products || products.length === 0) {
      return res.status(404).render("error", {
        title: "Product Not Found - SkyDecor",
        message: "Sorry, no products were found for this category.",
      });
    }

    res.render("product-pages/category-product.ejs", {
      title: `${category || productType} - SkyDecor`,
      products,
      page,
      productType,
      category,
    });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).render("error", {
      title: "Server Error - SkyDecor",
      message: "Something went wrong. Please try again later.",
    });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const searchParams = {
      query: req.query.q || req.query.query,
      productType: req.query.productType,
      category: req.query.category,
      subCategory: req.query.subCategory,
      texture: req.query.texture,
      textureCode: req.query.textureCode,
      size: req.query.size,
      thickness: req.query.thickness,
      width: req.query.width,
      productCode: req.query.productCode,
      isActive: req.query.isActive !== "false",
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || "desc",
    };

    // ✅ CORRECT: No .lean() here - the static method already returns plain objects
    const result = await Product.searchProducts(searchParams);

    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("❌ Search Products Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getFilterOptions = async (req, res) => {
  try {
    // ✅ CORRECT: No .lean() here - the static method returns plain objects
    const options = await Product.getFilterOptions();

    res.status(200).json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error("❌ Get Filter Options Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getProductHierarchy = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .select("productType category subCategory")
      .lean();

    const hierarchy = {};

    products.forEach((product) => {
      const { productType, category, subCategory } = product;

      if (!hierarchy[productType]) {
        hierarchy[productType] = {};
      }

      if (!hierarchy[productType][category]) {
        hierarchy[productType][category] = [];
      }

      if (
        subCategory &&
        !hierarchy[productType][category].includes(subCategory)
      ) {
        hierarchy[productType][category].push(subCategory);
      }
    });

    for (const type in hierarchy) {
      for (const cat in hierarchy[type]) {
        hierarchy[type][cat].sort();
      }
    }

    res.status(200).json({
      success: true,
      data: hierarchy,
    });
  } catch (error) {
    console.error("❌ Get Product Hierarchy Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.autocomplete = async (req, res) => {
  try {
    const query = req.query.q || req.query.query;
    const limit = parseInt(req.query.limit) || 18;

    // ✅ CORRECT: No .lean() here!
    // The method already returns plain objects (see product.js)
    const suggestions = await Product.getAutocompleteSuggestions(query, limit);

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error("❌ Autocomplete Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
