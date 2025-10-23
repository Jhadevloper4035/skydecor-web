const Product = require("../models/product.model.js");
const path = require("path");
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const Page = require("../models/page.model.js");
const htmlPdf = require("html-pdf-node");
const fs = require("fs");

exports.getSingleProduct = async (req, res) => {
  try {
    const { productCode } = req.params;

    // 1. Find the product by productCode (case-insensitive match for safety)
    const product = await Product.findOne({
      productCode: { $regex: new RegExp("^" + productCode + "$", "i") },
    }).lean();

    if (!product) {
      return res.status(404).render("error", {
        title: "Product Not Found - SkyDecor",
        message: "Sorry, the requested product does not exist.",
      });
    }

    // 2. Find related products in the same category (exclude the current product)
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
    })
      .limit(20)
      .lean();

    // 3. Render the product page with product + related products
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

    // Build query dynamically
    const query = { productType };
    if (category) query.category = category;

    const products = await Product.find(query).lean();
    const page = await Page.findOne({
      productType,
    });

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

exports.downloadProductPdf = async (req, res) => {
  try {
    const { productCode } = req.params;
    if (!productCode) {
      return res
        .status(400)
        .json({ success: false, message: "Product code is required" });
    }

    // PDF folder path
    const pdfFolder = path.join(__dirname, "../temp/data/products/pdfs");
    if (!fs.existsSync(pdfFolder)) {
      fs.mkdirSync(pdfFolder, { recursive: true });
    }

    const pdfPath = path.join(pdfFolder, `${productCode}.pdf`);

    let pdfBuffer;

    // Check if PDF already exists
    if (fs.existsSync(pdfPath)) {
      console.log(`📄 Returning existing PDF for: ${productCode}`);
      pdfBuffer = fs.readFileSync(pdfPath);
    } else {
      // Fetch product from DB
      const product = await Product.findOne({ productCode });
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      // Render EJS template
      const templatePath = path.join(
        __dirname,
        "../templates/productTemplate.ejs"
      );
      const html = await ejs.renderFile(templatePath, { product });

      // PDF options
      const options = {
        format: "A4",
        printBackground: true,
      };

      const file = { content: html };

      // Generate PDF buffer
      pdfBuffer = await htmlPdf.generatePdf(file, options);

      // Save PDF to backend
      fs.writeFileSync(pdfPath, pdfBuffer);
    }

    // Send PDF as downloadable file
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${productCode}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.error("❌ PDF Generation Error:", error);
    res.status(500).json({ success: false, message: "Error generating PDF" });
  }
};

exports.generateAndStoreAllProductPdfs = async (req, res) => {
  try {
    // Fetch all products
    const products = await Product.find({});
    if (!products || products.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No products found" });
    }

    const totalProducts = products.length;
    let completed = 0;

    // PDF folder path
    const pdfFolder = path.join(__dirname, "../../temp/data/products/pdfs");
    if (!fs.existsSync(pdfFolder)) {
      fs.mkdirSync(pdfFolder, { recursive: true });
    }

    const templatePath = path.join(
      __dirname,
      "../templates/productTemplate.ejs"
    );

    // Loop through all products
    for (const product of products) {
      try {
        // Render HTML from EJS
        const html = await ejs.renderFile(templatePath, { product });

        const options = {
          format: "A4",
          printBackground: true,
        };

        const file = { content: html };
        const pdfBuffer = await htmlPdf.generatePdf(file, options);

        // Save PDF
        const pdfPath = path.join(pdfFolder, `${product.productCode}.pdf`);
        fs.writeFileSync(pdfPath, pdfBuffer);

        completed++;
        console.log(
          `✅ [${completed}/${totalProducts}] PDF generated for: ${product.productCode}`
        );
      } catch (err) {
        completed++;
        console.error(
          `❌ [${completed}/${totalProducts}] Failed for ${product.productCode}:`,
          err
        );
      }
    }

    return res.json({
      success: true,
      message: "All product PDFs generated and stored successfully",
      total: totalProducts,
      completed: completed,
    });
  } catch (error) {
    console.error("❌ Error generating PDFs:", error);
    res.status(500).json({ success: false, message: "Error generating PDFs" });
  }
};

// Main search endpoint
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

    const result = await Product.searchProducts(searchParams);

    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get filter options for UI dropdowns
exports.getFilterOptions = async (req, res) => {
  try {
    const options = await Product.getFilterOptions();

    res.status(200).json({
      success: true,
      data: options,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get product hierarchy (ProductType -> Category -> SubCategory)
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

    // Sort subcategories
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Autocomplete suggestions
exports.autocomplete = async (req, res) => {
  try {
    const query = req.query.q || req.query.query;
    const limit = parseInt(req.query.limit) || 1000;

    const suggestions = await Product.getAutocompleteSuggestions(query, limit);

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
