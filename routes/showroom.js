const router = require("express").Router();

const {
  getShowrooms,
  getSingleShowroom,
} = require("../controllers/showroom.js");

router.get("/", getShowrooms);

router.get("/:slug", getSingleShowroom);

module.exports = router;
