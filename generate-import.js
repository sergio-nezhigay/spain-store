const fs = require('fs');
const path = require('path');

// Read comparison CSV to get products missing from Shopify
function getMissingProducts(comparisonFile) {
  const content = fs.readFileSync(comparisonFile, 'utf-8');
  const lines = content.split('\n');
  const products = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const fields = parseCSVLine(lines[i]);
    const status = fields[1];

    if (status === 'Missing from Shopify') {
      products.push({
        handle: fields[0],
        fileDirectory: fields[4],
        imageCount: parseInt(fields[6]) || 0,
        prefix: fields[7]
      });
    }
  }

  return products;
}

// Parse CSV line
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields.map(f => f.replace(/^"|"$/g, ''));
}

// Read file list and map images to products
function getProductImages(fileListPath) {
  const content = fs.readFileSync(fileListPath, 'utf-16le');
  const lines = content.split('\n').filter(line => line.trim() && !line.includes('file_list.txt'));

  const imageMap = new Map();

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Extract directory and filename
    const parts = trimmed.split('\\');
    const dirName = parts[parts.length - 2];
    const fileName = parts[parts.length - 1];

    if (!dirName) return;

    // Normalize directory name to handle
    const handle = normalizeProductName(dirName);

    if (!imageMap.has(handle)) {
      imageMap.set(handle, {
        directory: dirName,
        images: []
      });
    }

    imageMap.get(handle).images.push({
      path: trimmed,
      filename: fileName
    });
  });

  return imageMap;
}

// Normalize product name
function normalizeProductName(name) {
  let normalized = name.replace(/^(D01\.|D03\.|Do1\.|Do2\.)/, '');
  normalized = normalized.replace(/\./g, '-');
  normalized = normalized.toLowerCase();
  return normalized;
}

// Convert handle to title (kebab-case to Capitalized.dot.format)
function generateTitle(handle) {
  const words = handle.split('-');
  return words
    .map((word, index) => index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word)
    .join('.');
}

// Determine product type from handle
function getProductType(handle) {
  if (handle.includes('dress')) return 'Dresses';
  if (handle.includes('shirt')) return 'Shirts';
  if (handle.includes('skirt')) return 'Skirts';
  if (handle.includes('set')) return 'Sets';
  if (handle.includes('sport')) return 'Sportswear';
  if (handle.includes('strick')) return 'Knitwear';
  return 'Clothing';
}

// Determine product category
function getProductCategory(handle) {
  if (handle.includes('dress')) return 'Apparel & Accessories > Clothing > Dresses';
  if (handle.includes('shirt')) return 'Apparel & Accessories > Clothing > Clothing Tops';
  if (handle.includes('skirt')) return 'Apparel & Accessories > Clothing > Skirts';
  if (handle.includes('set')) return 'Apparel & Accessories > Clothing > Outfit Sets';
  if (handle.includes('sport')) return 'Apparel & Accessories > Clothing > Activewear';
  return 'Apparel & Accessories > Clothing';
}

// Generate basic product description
function generateDescription(handle, title) {
  const type = getProductType(handle).toLowerCase();
  return `<p>Stylish ${title.toLowerCase()} from our collection. High-quality ${type} perfect for any occasion.</p>`;
}

// Determine image priority (front images first)
function getImagePriority(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('front')) return 1;
  if (lower.includes('back')) return 2;
  if (lower.includes('side')) return 3;
  if (lower.includes('detail')) return 4;
  return 5;
}

// Sort images by priority
function sortImages(images) {
  return images.sort((a, b) => {
    const priorityA = getImagePriority(a.filename);
    const priorityB = getImagePriority(b.filename);
    if (priorityA !== priorityB) return priorityA - priorityB;
    return a.filename.localeCompare(b.filename);
  });
}

// Generate Shopify import CSV
function generateShopifyCSV(missingProducts, imageMap, outputPath) {
  // Shopify CSV headers
  const headers = [
    'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags',
    'Published', 'Option1 Name', 'Option1 Value', 'Option1 Linked To', 'Option2 Name',
    'Option2 Value', 'Option2 Linked To', 'Option3 Name', 'Option3 Value', 'Option3 Linked To',
    'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty',
    'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price',
    'Variant Compare At Price', 'Variant Requires Shipping', 'Variant Taxable',
    'Unit Price Total Measure', 'Unit Price Total Measure Unit', 'Unit Price Base Measure',
    'Unit Price Base Measure Unit', 'Variant Barcode', 'Image Src', 'Image Position',
    'Image Alt Text', 'Gift Card', 'SEO Title', 'SEO Description',
    'Addon Products (product.metafields.custom.addon_products)',
    'Product rating count (product.metafields.reviews.rating_count)',
    'Color (product.metafields.shopify.color-pattern)',
    'Complementary products (product.metafields.shopify--discovery--product_recommendation.complementary_products)',
    'Related products (product.metafields.shopify--discovery--product_recommendation.related_products)',
    'Related products settings (product.metafields.shopify--discovery--product_recommendation.related_products_display)',
    'Search product boosts (product.metafields.shopify--discovery--product_search_boost.queries)',
    'Variant Image', 'Variant Weight Unit', 'Variant Tax Code', 'Cost per item', 'Status'
  ];

  const rows = [];

  missingProducts.forEach(product => {
    const productData = imageMap.get(product.handle);
    if (!productData) {
      console.log(`⚠️  No images found for ${product.handle}`);
      return;
    }

    const title = generateTitle(product.handle);
    const description = generateDescription(product.handle, title);
    const type = getProductType(product.handle);
    const category = getProductCategory(product.handle);
    const images = sortImages(productData.images);

    // First row - complete product info
    const firstRow = [
      product.handle,                          // Handle
      title,                                   // Title
      description,                             // Body (HTML)
      'ROCCO',                                 // Vendor
      category,                                // Product Category
      type,                                    // Type
      '',                                      // Tags (empty for now)
      'true',                                  // Published
      'Title',                                 // Option1 Name
      'Default Title',                         // Option1 Value
      '',                                      // Option1 Linked To
      '',                                      // Option2 Name
      '',                                      // Option2 Value
      '',                                      // Option2 Linked To
      '',                                      // Option3 Name
      '',                                      // Option3 Value
      '',                                      // Option3 Linked To
      '',                                      // Variant SKU
      '0.0',                                   // Variant Grams
      'shopify',                               // Variant Inventory Tracker
      '50',                                    // Variant Inventory Qty
      'deny',                                  // Variant Inventory Policy
      'manual',                                // Variant Fulfillment Service
      '19.99',                                 // Variant Price
      '',                                      // Variant Compare At Price
      'true',                                  // Variant Requires Shipping
      'true',                                  // Variant Taxable
      '',                                      // Unit Price Total Measure
      '',                                      // Unit Price Total Measure Unit
      '',                                      // Unit Price Base Measure
      '',                                      // Unit Price Base Measure Unit
      '',                                      // Variant Barcode
      images[0] ? images[0].path : '',         // Image Src
      images[0] ? '1' : '',                    // Image Position
      images[0] ? title : '',                  // Image Alt Text
      'false',                                 // Gift Card
      '',                                      // SEO Title
      '',                                      // SEO Description
      '',                                      // Addon Products
      '',                                      // Product rating count
      '',                                      // Color
      '',                                      // Complementary products
      '',                                      // Related products
      '',                                      // Related products settings
      '',                                      // Search product boosts
      '',                                      // Variant Image
      'kg',                                    // Variant Weight Unit
      '',                                      // Variant Tax Code
      '',                                      // Cost per item
      'active'                                 // Status
    ];
    rows.push(firstRow);

    // Additional rows for additional images
    for (let i = 1; i < images.length; i++) {
      const imageRow = new Array(headers.length).fill('');
      imageRow[0] = product.handle;           // Handle
      imageRow[32] = images[i].path;          // Image Src
      imageRow[33] = (i + 1).toString();      // Image Position
      imageRow[34] = `${title} - View ${i + 1}`; // Image Alt Text
      rows.push(imageRow);
    }
  });

  // Write CSV
  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.map(field => escapeCSV(field)).join(',') + '\n';
  });

  fs.writeFileSync(outputPath, csv, 'utf-8');
}

function escapeCSV(value) {
  if (typeof value !== 'string') return value;
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\\')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Main execution
function main() {
  console.log('📦 Generating Shopify product import file...\n');

  const comparisonFile = path.join(__dirname, 'product_comparison.csv');
  const fileListPath = path.join(__dirname, 'file_list.txt');
  const outputPath = path.join(__dirname, 'shopify_import.csv');

  // Get missing products
  console.log('📖 Reading comparison results...');
  const missingProducts = getMissingProducts(comparisonFile);
  console.log(`   Found ${missingProducts.length} products to import\n`);

  // Get image mappings
  console.log('🖼️  Mapping product images...');
  const imageMap = getProductImages(fileListPath);
  console.log(`   Mapped images for ${imageMap.size} products\n`);

  // Generate CSV
  console.log('✍️  Generating Shopify import CSV...');
  generateShopifyCSV(missingProducts, imageMap, outputPath);
  console.log(`   ✓ Import file saved to: ${outputPath}\n`);

  // Summary
  console.log('📊 Summary:');
  console.log(`   Products to import: ${missingProducts.length}`);

  const byPrefix = {};
  missingProducts.forEach(p => {
    byPrefix[p.prefix] = (byPrefix[p.prefix] || 0) + 1;
  });

  console.log('   By prefix:');
  Object.entries(byPrefix).forEach(([prefix, count]) => {
    console.log(`      ${prefix}: ${count} products`);
  });

  console.log('\n✅ Import file ready!');
  console.log('\n⚠️  IMPORTANT NOTES:');
  console.log('   1. Image paths are LOCAL file paths - you need to upload images to Shopify first');
  console.log('   2. Review pricing (default: 19.99) and adjust as needed');
  console.log('   3. Review product descriptions and titles');
  console.log('   4. Check vendor name (default: ROCCO)');
  console.log('   5. All products set to "active" status by default');
  console.log('\n📝 Next steps:');
  console.log('   1. Upload product images to Shopify (Assets or Files)');
  console.log('   2. Update Image Src URLs in the CSV with Shopify CDN URLs');
  console.log('   3. Import the CSV via Shopify Admin > Products > Import');
}

// Run
main();
