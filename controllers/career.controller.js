const Job = require("../models/job.model.js");

exports.getCareerPost = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ created_at: -1 });

    if (!jobs || jobs.length === 0) {
      // No jobs found
      return res.status(404).render("career", {
        title: "Career Page",
        message: "No job openings available at the moment.",
        jobs: [],
      });
    }

    // Render your EJS page and pass blogs
    res.render("career", {
      title: "Career Page",
      message: "Wel!",
      jobs, // send all blogs to EJS
    });
  } catch (error) {
    res.status(500).render("career", {
      title: "Career Page",
      message: "Something went wrong. Please try again later.",
      jobs: [],
    });
  }
};
