const router = require("express").Router();
const {
  getSingleProduct,
  streamProductPDF,
  getProductPDFInfo,
  getPDFStats,
  getAllPDFsList,
  regenerateProductPDF,
  deleteProductPDF,
  cleanupOldPDFs,
  getAllCategoryProduct,
  getProductPDF,
  searchProducts,
  getFilterOptions,
  autocomplete,
  getProductHierarchy,
} = require("../controllers/product.js");

router.get("/", (req, res) => {
  res.render("product-pages/products", {
    title: "conatct Page",
    message: "Welcome to EJS with Static Files!",
  });
});

router.get("/detail/:productCode", getSingleProduct);

router.get("/pdf/:productCode", getProductPDF);
router.get('/pdf/stream/:productCode', streamProductPDF);
router.get('/pdf/info/:productCode', getProductPDFInfo);
router.get('/pdf/list', getAllPDFsList);
router.get('/pdf/stats', getPDFStats);
router.post('/pdf/regenerate/:productCode', regenerateProductPDF);
router.delete('/pdf/:productCode', deleteProductPDF);
router.delete('/pdf/cleanup/:days', cleanupOldPDFs);


router.get("/page/:productType", getAllCategoryProduct);



router.get("/search", searchProducts);

router.get("/filters", getFilterOptions);

router.get("/autocomplete", autocomplete);

router.get("/hierarchy", getProductHierarchy);

module.exports = router;
