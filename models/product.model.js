const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productCode: {
      type: String,
      required: [true, "Product code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9\s-]+$/, "Invalid product code format"], // Example validation
    },
    productType: {
      type: String,
      required: [true, "Product type is required"],
      trim: true,
      enum: ["PVC", "Acrylish", "1mm", "0.8mm", "SOFFITTO", "liner" ], // adjust as needed
    },
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters"],
      maxlength: [50, "Product name must be less than 50 characters"],
    },
    designName: {
      type: String,
      trim: true,
      default: "",
      maxlength: [50, "Design name must be less than 50 characters"],
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
