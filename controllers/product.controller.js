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
      .limit(8)
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

exports.downloadProductPdf = async (req, res) => {
  try {
    const { productCode } = req.params;
    if (!productCode) {
      return res
        .status(400)
        .json({ success: false, message: "Product code is required" });
    }

    const pdfFolder = path.join(__dirname, "../data/products/pdfs");
    if (!fs.existsSync(pdfFolder)) {
      fs.mkdirSync(pdfFolder, { recursive: true });
    }

    const pdfPath = path.join(pdfFolder, `${productCode}.pdf`);
    let pdfBuffer;

    if (fs.existsSync(pdfPath)) {
      console.log(`📄 Returning existing PDF for: ${productCode}`);
      pdfBuffer = fs.readFileSync(pdfPath);
    } else {
      const product = await Product.findOne({ productCode }).lean();
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      const templatePath = path.join(
        __dirname,
        "../templates/productTemplate.ejs"
      );
      const html = await ejs.renderFile(templatePath, { product });

      const options = {
        format: "A4",
        printBackground: true,
      };

      const file = { content: html };
      pdfBuffer = await htmlPdf.generatePdf(file, options);
      fs.writeFileSync(pdfPath, pdfBuffer);
    }

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
    const products = await Product.find({}).lean();
    if (!products || products.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No products found" });
    }

    const totalProducts = products.length;
    let completed = 0;

    const pdfFolder = path.join(__dirname, "../data/products/pdfs");
    if (!fs.existsSync(pdfFolder)) {
      fs.mkdirSync(pdfFolder, { recursive: true });
    }

    const templatePath = path.join(
      __dirname,
      "../templates/productTemplate.ejs"
    );

    for (const product of products) {
      try {
        const html = await ejs.renderFile(templatePath, { product });

        const options = {
          format: "A4",
          printBackground: true,
        };

        const file = { content: html };
        const pdfBuffer = await htmlPdf.generatePdf(file, options);

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

/**
 * ✅ Main search endpoint
 * NOTE: Product.searchProducts() already returns plain objects
 * DO NOT call .lean() on the result
 */
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

/**
 * ✅ Get filter options for UI dropdowns
 * NOTE: Product.getFilterOptions() already returns plain objects
 * DO NOT call .lean() on the result
 */
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

/**
 * ✅ Get product hierarchy (ProductType -> Category -> SubCategory)
 */
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
    // The method already returns plain objects (see product.model.js)
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