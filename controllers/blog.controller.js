const Blog = require('../models/blog.model'); // Your Mongoose Blog schema

exports.getBlogs = async (req, res) => {
  try {
    // Fetch all blogs from MongoDB, sorted by created_at descending (latest first)
    const blogs = await Blog.find().sort({ created_at: -1 });

    // Render your EJS page and pass blogs
    res.render('blog', {
      title: 'Blog Page',
      message: 'Welcome to our Blogs!',
      blogs // send all blogs to EJS
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};


exports.getSingleBlogs = async (req, res) => {
  try {
    const { slug } = req.params;


    if (!slug) {
      return res.status(400).render("error", { 
        title: "Error", 
        message: "Invalid request: slug is mandatory" 
      });
    }

    // Find the single blog by slug
    const blog = await Blog.findOne({ url :  slug });


    if (!blog) {
      return res.status(404).render("error", { 
        title: "Not Found", 
        message: "Blog not found" 
      });
    }

    blog.text = blog.text.replace(/<strong>(.*?)<\/strong>/g, `<h4 style="margin-top: 20px">$1</h4>`);


    // Fetch recent 5 blogs (excluding current one)
    const recentBlogs = await Blog.find({ url: { $ne: slug } })
      .sort({ createdAt: -1 }) // newest first
      .limit(5);


    // Render EJS views
    res.render("single-blog", {
      title: blog.title || "Blog Page",
      blog,
      recentBlogs
    });

  } catch (error) {
    res.status(500).send('Server Error');
  }
};





