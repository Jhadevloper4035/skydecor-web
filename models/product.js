const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productCode: {
      type: String,
      required: [true, "Product code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9\s-]+$/, "Invalid product code format"],
    },
    productType: {
      type: String,
      required: [true, "Product type is required"],
      trim: true,
      enum: ["PVC", "Acrylish", "1mm", "0.8mm", "SOFFITTO", "liner"],
    },
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters"],
      maxlength: [100, "Product name must be less than 100 characters"],
    },
    designName: {
      type: String,
      trim: true,
      default: "",
      maxlength: [100, "Design name must be less than 100 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [50, "Category must be less than 50 characters"],
    },
    subCategory: {
      type: String,
      required: [true, "Sub-category is required"],
      trim: true,
      minlength: [2, "Sub-category must be at least 2 characters"],
      maxlength: [50, "Sub-category must be less than 50 characters"],
    },
    textureCode: {
      type: String,
      required: [true, "Texture code is required"],
      trim: true,
      uppercase: true,
    },
    texture: {
      type: String,
      required: [true, "Texture name is required"],
      trim: true,
      minlength: [2, "Texture name must be at least 2 characters"],
      maxlength: [50, "Texture name must be less than 50 characters"],
    },
    size: {
      type: String,
      required: [true, "Size is required"],
      trim: true,
    },
    thickness: {
      type: String,
      required: [true, "Thickness is required"],
      trim: true,
    },
    width: {
      type: String,
      required: [true, "Width is required"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    searchText: {
      type: String,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================
productSchema.index(
  {
    productName: "text",
    designName: "text",
    productCode: "text",
    category: "text",
    subCategory: "text",
    texture: "text",
  },
  {
    weights: {
      productCode: 10,
      productName: 8,
      designName: 6,
      category: 4,
      subCategory: 3,
      texture: 2,
    },
    name: "product_text_search",
  }
);

productSchema.index({ productType: 1 });
productSchema.index({ category: 1, subCategory: 1 });
productSchema.index({ texture: 1 });
productSchema.index({ textureCode: 1 });
productSchema.index({ size: 1 });
productSchema.index({ thickness: 1 });
productSchema.index({ width: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ productType: 1, category: 1 });
productSchema.index({ category: 1, thickness: 1 });
productSchema.index({ isActive: 1, productType: 1 });
productSchema.index({ isActive: 1, category: 1 });

// ==================== MIDDLEWARE ====================
productSchema.pre("save", function (next) {
  this.searchText = [
    this.productCode,
    this.productName,
    this.designName,
    this.category,
    this.subCategory,
    this.texture,
    this.textureCode,
    this.productType,
    this.size,
    this.thickness,
    this.width,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  next();
});

// ==================== STATIC METHODS ====================

// ⚠️ NO .lean() - Testing version
productSchema.statics.searchProducts = async function (searchParams) {
  const {
    query = "",
    productType,
    category,
    subCategory,
    texture,
    textureCode,
    size,
    thickness,
    width,
    productCode,
    minPrice,
    maxPrice,
    isActive = true,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = searchParams;

  const filter = { isActive };
  const options = {
    skip: (page - 1) * limit,
    limit: parseInt(limit),
    sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 },
  };

  if (query && query.trim()) {
    filter.$text = { $search: query };
    options.sort = { score: { $meta: "textScore" } };
  }

  if (productType) filter.productType = productType;
  if (category) filter.category = new RegExp(category, "i");
  if (subCategory) filter.subCategory = new RegExp(subCategory, "i");
  if (texture) filter.texture = new RegExp(texture, "i");
  if (textureCode) filter.textureCode = textureCode.toUpperCase();
  if (size) filter.size = size;
  if (thickness) filter.thickness = thickness;
  if (width) filter.width = width;
  if (productCode) filter.productCode = new RegExp(productCode, "i");

  try {
    const [products, total] = await Promise.all([
      this.find(
        filter,
        query && query.trim() ? { score: { $meta: "textScore" } } : {}
      )
        .sort(options.sort)
        .skip(options.skip)
        .limit(options.limit)
        .exec(), // ⚠️ NO .lean() for testing
      this.countDocuments(filter),
    ]);

    return {
      products,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    };
  } catch (error) {
    throw new Error(`Search failed: ${error.message}`);
  }
};

// ⚠️ NO .lean() - Testing version (this one is fine, .distinct doesn't need .lean)
productSchema.statics.getFilterOptions = async function () {
  try {
    const [
      productTypes,
      categories,
      subCategories,
      textures,
      sizes,
      thicknesses,
      widths,
    ] = await Promise.all([
      this.distinct("productType", { isActive: true }),
      this.distinct("category", { isActive: true }),
      this.distinct("subCategory", { isActive: true }),
      this.distinct("texture", { isActive: true }),
      this.distinct("size", { isActive: true }),
      this.distinct("thickness", { isActive: true }),
      this.distinct("width", { isActive: true }),
    ]);

    return {
      productTypes: productTypes.sort(),
      categories: categories.sort(),
      subCategories: subCategories.sort(),
      textures: textures.sort(),
      sizes: sizes.sort(),
      thicknesses: thicknesses.sort(),
      widths: widths.sort(),
    };
  } catch (error) {
    throw new Error(`Failed to fetch filter options: ${error.message}`);
  }
};

// ⚠️ NO .lean() - Testing version
productSchema.statics.getAutocompleteSuggestions = async function (
  query,
  limit = 10
) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const regex = new RegExp(query, "i");

    const suggestions = await this.find(
      {
        $or: [
          { productName: regex },
          { productCode: regex },
          { category: regex },
          { subCategory: regex },
          { designName: regex },
          { productType: regex },
          { size: regex },
          { thickness: regex },
          { texture: regex },
        ],
        isActive: true,
      },
      {
        productName: 1,
        productCode: 1,
        category: 1,
        subCategory: 1,
        designName: 1,
        productType: 1,
        size: 1,
        thickness: 1,
        image: 1,
      }
    )
      .limit(limit)
      .exec(); // ⚠️ NO .lean() for testing

    return suggestions;
  } catch (error) {
    throw new Error(`Autocomplete failed: ${error.message}`);
  }
};

module.exports = mongoose.model("Product", productSchema);