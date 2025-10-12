function getDistinctAttributes(products) {
  // Use Set to store unique values efficiently
  const productTypes = new Set();
  const categories = new Set();
  const subCategories = new Set();
  const designNames = new Set();
  const sizes = new Set();
  const thicknesses = new Set();

  // Loop through all products and collect distinct values
  for (const product of products) {
    if (product.productType) productTypes.add(product.productType);
    if (product.category) categories.add(product.category);
    if (product.subCategory) subCategories.add(product.subCategory);
    if (product.designName) designNames.add(product.designName);
    if (product.size) sizes.add(product.size);
    if (product.thickness) thicknesses.add(product.thickness);
  }

  // Convert Sets back to arrays
  return {
    productTypes: [...productTypes],
    categories: [...categories],
    subCategories: [...subCategories],
    designNames: [...designNames],
    sizes: [...sizes],
    thicknesses: [...thicknesses],
  };
}


module.exports = { getDistinctAttributes } 