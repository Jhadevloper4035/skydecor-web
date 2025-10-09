const router = require("express").Router();

const {
  getShowrooms,
  getSingleShowroom,
} = require("../controllers/showroom.controller.js");

router.get("/", getShowrooms);

router.get("/:slug", getSingleShowroom);

module.exports = router;
