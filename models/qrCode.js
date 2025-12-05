const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    productCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    subcategory: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    productType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    qrCodeImage: {
      type: String,
      required: true,
      trim: true,
    },
     linkInQrCode: {
      type: String,
      required: true,
      trim: true,
    },
    productPdfPath: {
      type: String,
      required: true,
      trim: true,
    },
    productImageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    scanCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive", "expired"],
      default: "active",
      index: true,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    generatedBy: {
      type: String,
      trim: true,
      default: "system",
    },
    lastScannedAt: {
      type: Date,
      default: null,
    },
    scanHistory: [
      {
        scannedAt: {
          type: Date,
          default: Date.now,
        },
        ipAddress: String,
        userAgent: String,
        location: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
qrCodeSchema.index({ productId: 1, status: 1 });
qrCodeSchema.index({ productCode: 1, status: 1 });
qrCodeSchema.index({ category: 1, subcategory: 1 });
qrCodeSchema.index({ productType: 1, status: 1 });
qrCodeSchema.index({ createdAt: -1 });

// Virtual to check if QR code is expired
qrCodeSchema.virtual("isExpired").get(function () {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

// Virtual for full product display productName
qrCodeSchema.virtual("fullProductName").get(function () {
  return `${this.productName} - ${this.productCode}`;
});

// Instance method to increment scan count
qrCodeSchema.methods.incrementScan = async function (scanData = {}) {
  this.scanCount += 1;
  this.lastScannedAt = new Date();

  // Add to scan history if data provided
  if (scanData.ipAddress || scanData.userAgent || scanData.location) {
    this.scanHistory.push({
      scannedAt: new Date(),
      ipAddress: scanData.ipAddress,
      userAgent: scanData.userAgent,
      location: scanData.location,
    });

    // Keep only last 100 scans in history
    if (this.scanHistory.length > 100) {
      this.scanHistory = this.scanHistory.slice(-100);
    }
  }

  return await this.save();
};

// Instance method to check if QR code is valid
qrCodeSchema.methods.isValid = function () {
  if (this.status !== "active") return false;
  if (this.expiryDate && new Date() > this.expiryDate) return false;
  return true;
};

// Static method to find QR codes by product ID
qrCodeSchema.statics.findByProductId = function (productId) {
  return this.find({ productId, status: "active" });
};

// Static method to find QR codes by product code
qrCodeSchema.statics.findByProductCode = function (productCode) {
  return this.find({
    productCode: productCode.toUpperCase(),
    status: "active",
  });
};

// Static method to find QR codes by category
qrCodeSchema.statics.findByCategory = function (category) {
  return this.find({ category: category.toLowerCase(), status: "active" });
};

// Static method to find QR codes by subcategory
qrCodeSchema.statics.findBySubcategory = function (subcategory) {
  return this.find({
    subcategory: subcategory.toLowerCase(),
    status: "active",
  });
};

// Static method to find QR codes by product type
qrCodeSchema.statics.findByProductType = function (productType) {
  return this.find({
    productType: productType.toLowerCase(),
    status: "active",
  });
};

// Static method to get active QR codes
qrCodeSchema.statics.getActiveQRCodes = function () {
  return this.find({ status: "active" }).sort({ createdAt: -1 });
};

// Static method to get QR codes with pagination
qrCodeSchema.statics.getPaginated = function (
  page = 1,
  limit = 20,
  filter = {}
) {
  const skip = (page - 1) * limit;
  return this.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
};

// Static method to get expired QR codes
qrCodeSchema.statics.getExpiredQRCodes = function () {
  return this.find({
    expiryDate: { $lt: new Date() },
    status: { $ne: "expired" },
  });
};

// Static method to search QR codes
qrCodeSchema.statics.searchQRCodes = function (searchTerm) {
  return this.find({
    $or: [
      { productName: new RegExp(searchTerm, "i") },
      { productCode: new RegExp(searchTerm, "i") },
      { category: new RegExp(searchTerm, "i") },
      { subcategory: new RegExp(searchTerm, "i") },
    ],
    status: "active",
  });
};

// Pre-save hook to ensure proper casing and handle expiry
qrCodeSchema.pre("save", function (next) {
  this.productCode = this.productCode.toUpperCase();
  this.productName = this.productName.toLowerCase();
  this.category = this.category.toLowerCase();
  this.subcategory = this.subcategory.toLowerCase();
  this.productType = this.productType.toLowerCase();

  // Auto-update status if expired
  if (this.expiryDate && new Date() > this.expiryDate) {
    this.status = "expired";
  }

  next();
});

const QRCode = mongoose.model("QRCode", qrCodeSchema);

module.exports = QRCode;
