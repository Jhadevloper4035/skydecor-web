const router = require("express").Router();

const { getEvents , getSingleEvent } = require("../controllers/event.controller");

router.get("/", getEvents);

router.get("/:slug", getSingleEvent);


module.exports = router;
