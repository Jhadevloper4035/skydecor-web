const router = require("express").Router();
const {
    getSingleProduct,
    getAllCategoryProduct,
    downloadProductPdf,
    searchProducts,
    getFilterOptions,
    autocomplete,
    getProductHierarchy,
    generateAndStoreAllProductPdfs
} = require("../controllers/product.controller.js");

router.get("/", (req, res) => {
    res.render("product-pages/products", {
        title: "conatct Page",
        message: "Welcome to EJS with Static Files!",
    });
});



router.get("/detail/:productCode", getSingleProduct);

router.get("/page/:productType", getAllCategoryProduct);

router.get("/download/:productCode", downloadProductPdf);

router.get("/genrateall", generateAndStoreAllProductPdfs);



router.get("/search/all", (req, res) => {
    res.render("search", {
        title: "conatct Page",
        message: "Welcome to EJS with Static Files!",
    });
}, searchProducts);



router.get("/search", searchProducts);

router.get("/filters", getFilterOptions);

router.get("/autocomplete", autocomplete);

router.get("/hierarchy", getProductHierarchy);

module.exports = router;
