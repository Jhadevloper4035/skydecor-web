const Product = require("../models/product.model.js");
const path = require("path");
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const fs = require("fs");
const Page  = require("../models/page.model.js")


exports.downloadProductPdf = async (req, res) => {
  try {
    const { productCode } = req.params;
    if (!productCode) {
      return res.status(400).send(`<h1>Product code is required</h1>`);
    }

    // Render HTML response for under-development feature
    return res.send(`
      <html>
        <head>
          <title>PDF Feature Under Development</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #333; }
            p { font-size: 18px; color: #555; }
            .notice { margin-top: 20px; font-style: italic; color: #888; }
          </style>
        </head>
        <body>
          <h1>🚧 PDF Feature Under Development</h1>
          <p>The PDF download for product <strong>${productCode}</strong> is currently under development.</p>
          <p class="notice">Please check back later.</p>
        </body>
      </html>
    `);

  } catch (error) {
    console.error("❌ PDF Route Error:", error);
    res.status(500).send("<h1>Server error</h1>");
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
