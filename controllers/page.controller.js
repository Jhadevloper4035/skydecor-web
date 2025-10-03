// controllers/pageController.js
const Page = require("../models/Page");

// Upsert a single page
exports.upsertPage = async (req, res) => {
  try {
    const { productType, slug, banners, content } = req.body;

    const page = await Page.findOneAndUpdate(
      { slug }, // filter by slug
      { productType, banners, content }, // update fields
      { new: true, upsert: true, setDefaultsOnInsert: true } // create if not exists
    );

    res.status(200).json({ message: "Page created/updated successfully", page });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error });
  }
};
