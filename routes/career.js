const router = require("express").Router();

const {getCareerPost}  = require("../controllers/career.controller.js")
 


router.get("/", getCareerPost);



module.exports = router;
