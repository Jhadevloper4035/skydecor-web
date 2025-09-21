const router = require("express").Router();

const { getBlogs , getSingleBlogs  } = require("../controllers/blog.controller.js");

router.get("/", getBlogs);

router.get("/:slug", getSingleBlogs);


module.exports = router;
