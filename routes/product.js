const router = require("express").Router();
const { getAllProducts , getSingleProduct , getAllCategoryProduct , downloadProductPdf } = require("../controllers/product.controller.js");

router.get("/", getAllProducts);

router.get("/detail/:productCode" , getSingleProduct)

router.get("/page/:productType" , getAllCategoryProduct)

router.get("/download/:productCode" , downloadProductPdf)

module.exports = router;
