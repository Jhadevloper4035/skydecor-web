const mongoose = require("mongoose");
const slugify = require("slugify");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    meta_name: {
      type: String,
      default: null,
    },
    meta_tags: {
      type: String,
      default: null,
      index: true,
    },
    meta_title: {
      type: String,
      default: null,
    },
    meta_description: {
      type: String,
      default: null,
    },
    author: {
      type: String,
      default: "Admin",
      trim: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

//
// 🔹 Pre-save hook to auto-generate clean URL from title if not provided
//
blogSchema.pre("save", function (next) {
  if (!this.url && this.title) {
    this.url = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

//
// 🔹 Text index for full-text search across title, text, and meta fields
//
blogSchema.index({
  title: "text",
  text: "text",
  meta_tags: "text",
  meta_description: "text",
});

//
// 🔹 Compound index for fast listing queries (e.g., active + newest)
//
blogSchema.index({ status: 1, created_at: -1 });

//
// 🔹 Static method: find blog by URL (fast lookup)
//
blogSchema.statics.findByUrl = function (url) {
  return this.findOne({ url, status: "active" });
};

//
// 🔹 Static method: keyword-based search (optimized text search)
//
blogSchema.statics.searchBlogs = function (keyword, limit = 10) {
  return this.find(
    { $text: { $search: keyword }, status: "active" },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(limit)
    .select("title url image meta_description created_at");
};

//
// 🔹 Virtual field for a short preview of blog text
//
blogSchema.virtual("excerpt").get(function () {
  return this.text.length > 200 ? this.text.substring(0, 200) + "..." : this.text;
});

//
// 🔹 Pre ‘find’ hook to exclude unnecessary internal fields
//
blogSchema.pre(/^find/, function (next) {
  this.select("-__v");
  next();
});

//
// 🔹 Post-save hook (for logging or cache invalidation)
//
blogSchema.post("save", function (doc) {
  console.log(`✅ Blog saved: ${doc.title}`);
});

module.exports = mongoose.model("Blog", blogSchema);
