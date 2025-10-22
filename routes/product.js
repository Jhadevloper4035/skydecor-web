const router = require("express").Router();
const { getAllProducts, getSingleProduct, getAllCategoryProduct, downloadProductPdf, searchProducts, getFilterOptions, autocomplete, getProductHierarchy } = require("../controllers/product.controller.js");

router.get("/", getAllProducts);

router.get("/detail/:productCode", getSingleProduct)

router.get("/page/:productType", getAllCategoryProduct)

router.get("/download/:productCode", downloadProductPdf)

router.get("/search", searchProducts);

router.get("/filters", getFilterOptions);

router.get("/autocomplete", autocomplete);

router.get("/hierarchy", getProductHierarchy);


router.get("/all", (req, res) => {
    res.render("search", {
        title: "conatct Page",
        message: "Welcome to EJS with Static Files!",
    });
});

module.exports = router;
