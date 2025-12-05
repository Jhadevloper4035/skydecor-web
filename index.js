process.env.OPENSSL_CONF = '/dev/null';
const express = require("express");
const path = require("path");
const cors = require("cors")

const productRoute = require("./routes/product.js");
const blogRoute = require("./routes/blog.js");
const eventRoute = require("./routes/event.js");
const careerRoute = require("./routes/career.js");
const experienceCenterRoute = require("./routes/showroom.js");
const IndexRoute = require("./routes/index.js");
const productEnquiry = require("./routes/productEnquiry.js");
const apiKeyRoute = require("./routes/apiKey.js")

const QrCode = require("./models/qrCode.js"); 


const app = express();

app.use(
  cors({
    origin: "*",
    allowedHeaders: ["x-admin-secret", "Content-Type", "Authorization"],
  })
)


// Add these middleware BEFORE your routes
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded



app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));



app.get("/:productType/:category/:subcategory/:productName", async (req, res) => {
  try {
    const { productType, category, subcategory, productName } = req.params;

    // Find record
    const qrcode = await QrCode.findOne({
      productType,
      category,
      subcategory,
      productName: productName.toLowerCase(),
    }).lean();

    if (!qrcode) {
      return res.status(404).send("PDF not found for this product");
    }


    return res.redirect(qrcode.productPdfPath);

  } catch (error) {
    console.error("QR Route Error:", error);
    return res.status(500).send("Internal server error");
  }
});


app.use("/", IndexRoute);
app.use("/products", productRoute);
app.use("/blogs", blogRoute);
app.use("/events", eventRoute);
app.use("/career", careerRoute);
app.use("/experience-center", experienceCenterRoute);
app.use("/api/lead/", productEnquiry);
app.use("/apikey", apiKeyRoute);

module.exports = app;
