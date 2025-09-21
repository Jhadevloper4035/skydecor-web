const router = require("express").Router();
const { getProducts , getSingleProduct , getAllCategoryProduct , downloadProductPdf } = require("../controllers/product.controller.js");

router.get("/:productType", getProducts);

router.get("/detail/:productCode" , getSingleProduct)

router.get("/page/:productType" , getAllCategoryProduct)

router.get("/download/:productCode" , downloadProductPdf)

module.exports = router;
