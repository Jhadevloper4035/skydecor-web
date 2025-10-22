const Blog = require("../models/blog.model");

//
// 🔹 Get All Blogs — optimized for performance and SEO
//
exports.getBlogs = async (req, res) => {
  try {
    // Use lean() for lightweight objects (no Mongoose overhead)
    const blogs = await Blog.find({ status: "active" })
      .sort({ created_at: -1 })
      .select("title url image text meta_description created_at author") // Only necessary fields
      .lean();

    res.render("blog", {
      title: "Blog Page",
      message: "Welcome to our Blogs!",
      blogs,
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).render("error", {
      title: "Server Error",
      message: "Unable to load blogs at this moment.",
    });
  }
};

//
// 🔹 Get Single Blog — optimized with static helper + lean query + fallbacks
//
exports.getSingleBlogs = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).render("error", {
        title: "Error",
        message: "Invalid request: blog URL is required.",
      });
    }

    // ✅ Use the optimized static method from model
    const blog = await Blog.findByUrl(slug).lean();

    if (!blog) {
      return res.status(404).render("error", {
        title: "Not Found",
        message: "The requested blog could not be found.",
      });
    }

    // Optional: Beautify blog text (e.g., promote <strong> → <h4>)
    blog.text = blog.text.replace(
      /<strong>(.*?)<\/strong>/g,
      `<h4 style="margin-top: 20px">$1</h4>`
    );

    // Fetch 5 most recent blogs (excluding current)
    const recentBlogs = await Blog.find({
      url: { $ne: slug },
      status: "active",
    })
      .sort({ created_at: -1 })
      .limit(5)
      .select("title url image created_at")
      .lean();

    // ✅ Render EJS with SEO fields
    res.render("single-blog", {
      title: blog.meta_title || blog.title,
      meta_description: blog.meta_description,
      meta_tags: blog.meta_tags,
      blog,
      recentBlogs,
    });
  } catch (error) {
    console.error("Error fetching single blog:", error);
    res.status(500).render("error", {
      title: "Server Error",
      message: "Unable to load blog details at this moment.",
    });
  }
};
