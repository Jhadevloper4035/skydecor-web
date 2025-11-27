const mongoose = require("mongoose");
const Product = require("./models/product.js"); // your schema
const products = require("./data/products.json"); // import JSON file

const events = require("./data/event.json");
const Event = require("./models/event.model.js");

const blogs = require("./data/blog.json");
const Blog = require("./models/blog.model.js");

const jobs = require("./data/jobData.json");
const Job = require("./models/job.model.js");

const testimonials = require("./data/testimonial.json");
const Testimonial = require("./models/testimonial.js");

const Page = require("./models/page.model.js");
const pageData = require("./data/page.json");

const Showroom = require("./models/showroom.js");
const showroomData = require("./data/showroom.json");

const { ConnectDB } = require("./config/db.js");

ConnectDB();

async function seedDB() {
  try {
    // Remove old data
    await Product.deleteMany({});
    console.log("🗑 Old products removed");

    await Event.deleteMany({})
    console.log("🗑 Old events removed");

    await Blog.deleteMany({})
    console.log("🗑 Old Blogs removed");

    await Page.deleteMany({})
    console.log("remove all page schema and title");

    await Showroom.deleteMany({})
    console.log("removed all showroom data");

    await Job.deleteMany({});
    console.log("removed all Job data");


    await Product.insertMany(products);
    console.log(`✅ ${products.length} products inserted successfully!`);


    await Event.insertMany(events)
    console.log(`✅ ${events.length} events inserted successfully!`);

    await Blog.insertMany(blogs)
    console.log(`✅ ${blogs.length} blogs inserted successfully!`);

    await Job.insertMany(jobs);
    console.log(`✅ ${jobs.length} jobs inserted successfully!`);

    await Testimonial.insertMany(testimonials);
    console.log(`✅ ${testimonials.length} jobs inserted successfully!`);

    await Page.insertMany(pageData)
    console.log(`✅ ${pageData.length} All page seo detials updated `);

    await Showroom.insertMany(showroomData);
    console.log(`✅ ${showroomData.length}  inserted successfully!`);

    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error seeding database:", err);
    mongoose.connection.close();
  }
}

seedDB();
