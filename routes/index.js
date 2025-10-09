const router = require("express").Router();

const Blog = require("../models/blog.model.js");
const Testimonial = require("../models/testimonial.model.js");
const Product = require("../models/product.model.js");

router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 }).limit(3);
    const testimonials = await Testimonial.find();

    const categories = ["PVC", "Acrylish", "1mm", "0.8mm", "SOFFITTO", "liner"];

    // Run all category queries in parallel
    const productsByCategory = await Promise.all(
      categories.map(async (cat) => {
        const products = await Product.find({ productType: cat })
          .sort({ createdAt: -1 })
          .limit(4);
        return { category: cat, products };
      })
    );

    res.render("index", {
      title: "Home Page",
      blogs,
      testimonials,
      productsByCategory,
      message: "Welcome to EJS with Static Files!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

router.get("/contact-us", (req, res) => {
  res.render("contact", {
    title: "conatct Page",
    message: "Welcome to EJS with Static Files!",
  });
});

router.get("/about-us", (req, res) => {
  res.render("about", {
    title: "conatct Page",
    message: "Welcome to EJS with Static Files!",
  });
});

router.get("/certificates", (req, res) => {
  res.render("certificates", {
    title: "conatct Page",
    message: "Welcome to EJS with Static Files!",
  });
});

router.get("/customer-review", (req, res) => {
  res.render("customer-review", {
    title: "conatct Page",
    message: "Welcome to EJS with Static Files!",
  });
});



router.get("/privacy-policy", (req, res) => {
  res.render("privacy-policy", {
    title: "conatct Page",
    message: "Welcome to EJS with Static Files!",
  });
});

router.get("/application/bedroom-design-laminates", (req, res) => {
  res.render("bedroom-design-laminates", {
    title: "conatct Page",
    message: "Welcome to EJS with Static Files!",
  });
});

router.get("/application/kids-room-design", (req, res) => {
  res.render("kids-room-design", {
    title: "conatct Page",
    message: "Welcome to EJS with Static Files!",
  });
});

router.get("/application/office-design-laminates", (req, res) => {
  res.render("office-design-laminates", {
    title: "conatct Page",
    message: "Welcome to EJS with Static Files!",
  });
});

router.get("/application/living-room-design", (req, res) => {
  res.render("living-room-design", {
    title: "conatct Page",
    message: "Welcome to EJS with Static Files!",
  });
});

router.get("/application/kitchen-design-laminates", (req, res) => {
  res.render("kitchen-design-laminates", {
    title: "conatct Page",
    message: "Welcome to EJS with Static Files!",
  });
});

router.get("/application/wardrobs-design", (req, res) => {
  res.render("wardrobs-design", {
    title: "conatct Page",
    message: "Welcome to EJS with Static Files!",
  });
});

router.get("/application/tv-unit-design", (req, res) => {
  res.render("tv-unit-design", {
    title: "conatct Page",
    message: "Welcome to EJS with Static Files!",
  });
});

module.exports = router;
