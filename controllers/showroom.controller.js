const Showroom = require("../models/showroom.model.js");

exports.getShowrooms = async (req, res) => {
  try {
    // Fetch all showrooms, latest first
    const showrooms = await Showroom.find()
      .select("-images")
      .sort({ created_at: -1 })
      .lean();

    res.render("showroom", {
      title: "Showroom Page",
      message: "Welcome to our Showrooms!",
      showrooms: showrooms,
    });
  } catch (error) {
    console.error("Error fetching showrooms:", error);
    res.status(500).render("error", {
      title: "Server Error",
      message: "Something went wrong while fetching showrooms.",
    });
  }
};

exports.getSingleShowroom = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).render("error", {
        title: "Bad Request",
        message: "Slug parameter is required.",
      });
    }

    const showroom = await Showroom.findOne({ slug }).lean();

    if (!showroom) {
      return res.status(404).render("error", {
        title: "Not Found",
        message: "Showroom not found.",
      });
    }

    res.render("single-showroom", {
      title: showroom.location || "Showroom Page",
      showroom,
    });
  } catch (error) {
    console.error("Error fetching showroom:", error);
    res.status(500).render("error", {
      title: "Server Error",
      message: "Something went wrong while fetching the showroom.",
    });
  }
};
