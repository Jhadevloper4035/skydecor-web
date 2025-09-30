const express = require("express");
const path = require("path");



const productRoute = require("./routes/product.js");
const blogRoute = require("./routes/blog.js");
const eventRoute = require("./routes/event.js");
const careerRoute = require("./routes/career.js");
const IndexRoute = require("./routes/index.js");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));


app.use("/api/product", productRoute);
app.use("/blogs", blogRoute);
app.use("/events", eventRoute);
app.use("/career", careerRoute);
app.use("/", IndexRoute);


module.exports = app;
