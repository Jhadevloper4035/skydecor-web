const router = require("express").Router();

const {getCareerPost , getSinglePost}  = require("../controllers/career.controller.js")
 


router.get("/", getCareerPost);

router.get("/:slug", getSinglePost);




module.exports = router;
