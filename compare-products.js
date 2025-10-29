const fs = require('fs');
const path = require('path');

// Read the Shopify export CSV
function parseShopifyCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Split by newlines but handle multi-line fields
  const lines = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if (char === '\n' && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else if (char === '\r' && nextChar === '\n' && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
      i++; // Skip the \n
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  const headers = parseCSVLine(lines[0]);
  const handleIndex = headers.indexOf('Handle');
  const titleIndex = headers.indexOf('Title');
  const statusIndex = headers.indexOf('Status');
  const imageSrcIndex = headers.indexOf('Image Src');

  const products = new Map();

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);

    const handle = fields[handleIndex]?.trim();
    if (!handle || handle === '') continue;

    if (!products.has(handle)) {
      products.set(handle, {
        handle,
        title: fields[titleIndex] || '',
        status: fields[statusIndex] || '',
        imageCount: 0,
        images: []
      });
    }

    // Count images (Image Src field)
    const imageSrc = fields[imageSrcIndex];
    if (imageSrc && imageSrc.trim() && imageSrc.startsWith('http')) {
      products.get(handle).imageCount++;
      products.get(handle).images.push(imageSrc);
    }
  }

  return products;
}

// Simple CSV line parser (handles quoted fields)
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

// Read the file list
function parseFileList(filePath) {
  const content = fs.readFileSync(filePath, 'utf-16le');
  const lines = content.split('\n').filter(line => line.trim() && !line.includes('output.txt') && !line.includes('file_list.txt'));

  const products = new Map();

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Extract directory name from path
    // Example: C:\Users\user\Downloads\Shop\D01.beige.set.long\front-1.jpg
    const parts = trimmed.split('\\');
    const dirName = parts[parts.length - 2]; // Get the directory name

    if (!dirName) return;

    // Normalize: remove prefix and convert to kebab-case
    const normalized = normalizeProductName(dirName);

    if (!products.has(normalized)) {
      products.set(normalized, {
        originalName: dirName,
        normalized,
        prefix: extractPrefix(dirName),
        imageCount: 0,
        images: []
      });
    }

    products.get(normalized).imageCount++;
    products.get(normalized).images.push(trimmed);
  });

  return products;
}

// Normalize product name: remove prefix and convert to kebab-case
function normalizeProductName(name) {
  // Remove prefixes: D01., D03., Do1., Do2.
  let normalized = name.replace(/^(D01\.|D03\.|Do1\.|Do2\.)/, '');

  // Convert dots to hyphens
  normalized = normalized.replace(/\./g, '-');

  // Convert to lowercase
  normalized = normalized.toLowerCase();

  return normalized;
}

// Extract prefix from product name
function extractPrefix(name) {
  const match = name.match(/^(D01\.|D03\.|Do1\.|Do2\.)/);
  return match ? match[1].replace('.', '') : 'NONE';
}

// Compare products and generate report
function compareProducts(shopifyProducts, fileProducts) {
  const results = [];

  // Track which products we've processed
  const processedFiles = new Set();

  // Check matched products (in both Shopify and files)
  for (const [handle, shopifyData] of shopifyProducts) {
    const fileData = fileProducts.get(handle);

    if (fileData) {
      results.push({
        productName: handle,
        status: 'Matched',
        shopifyHandle: handle,
        shopifyStatus: shopifyData.status,
        fileDirectory: fileData.originalName,
        imagesInShopify: shopifyData.imageCount,
        imagesInFiles: fileData.imageCount,
        prefix: fileData.prefix
      });
      processedFiles.add(handle);
    } else {
      results.push({
        productName: handle,
        status: 'Missing images',
        shopifyHandle: handle,
        shopifyStatus: shopifyData.status,
        fileDirectory: 'N/A',
        imagesInShopify: shopifyData.imageCount,
        imagesInFiles: 0,
        prefix: 'N/A'
      });
    }
  }

  // Check products in files but not in Shopify
  for (const [normalized, fileData] of fileProducts) {
    if (!processedFiles.has(normalized)) {
      results.push({
        productName: normalized,
        status: 'Missing from Shopify',
        shopifyHandle: 'N/A',
        shopifyStatus: 'N/A',
        fileDirectory: fileData.originalName,
        imagesInShopify: 0,
        imagesInFiles: fileData.imageCount,
        prefix: fileData.prefix
      });
    }
  }

  return results;
}

// Generate CSV output
function generateCSV(results, outputPath) {
  const headers = [
    'Product Name',
    'Status',
    'Shopify Handle',
    'Shopify Status',
    'File Directory',
    'Images in Shopify',
    'Images in Files',
    'Original Prefix'
  ];

  let csv = headers.join(',') + '\n';

  results.forEach(result => {
    const row = [
      escapeCSV(result.productName),
      escapeCSV(result.status),
      escapeCSV(result.shopifyHandle),
      escapeCSV(result.shopifyStatus),
      escapeCSV(result.fileDirectory),
      result.imagesInShopify,
      result.imagesInFiles,
      escapeCSV(result.prefix)
    ];
    csv += row.join(',') + '\n';
  });

  fs.writeFileSync(outputPath, csv, 'utf-8');
}

function escapeCSV(value) {
  if (typeof value !== 'string') return value;
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Main execution
function main() {
  console.log('🔍 Starting product comparison...\n');

  // File paths
  const shopifyCSV = path.join(__dirname, 'products_export_spain_store.csv');
  const fileList = path.join(__dirname, 'file_list.txt');
  const outputCSV = path.join(__dirname, 'product_comparison.csv');

  // Parse files
  console.log('📖 Reading Shopify export...');
  const shopifyProducts = parseShopifyCSV(shopifyCSV);
  console.log(`   Found ${shopifyProducts.size} products in Shopify\n`);

  console.log('📖 Reading file list...');
  const fileProducts = parseFileList(fileList);
  console.log(`   Found ${fileProducts.size} product directories\n`);

  // Compare
  console.log('🔄 Comparing products...');
  const results = compareProducts(shopifyProducts, fileProducts);

  // Statistics
  const matched = results.filter(r => r.status === 'Matched').length;
  const missingFromShopify = results.filter(r => r.status === 'Missing from Shopify').length;
  const missingImages = results.filter(r => r.status === 'Missing images').length;

  console.log('\n📊 Results:');
  console.log(`   ✓ Matched: ${matched} products`);
  console.log(`   ⚠️  Missing from Shopify: ${missingFromShopify} products`);
  console.log(`   ⚠️  Missing images: ${missingImages} products\n`);

  // Generate CSV
  console.log('💾 Generating CSV report...');
  generateCSV(results, outputCSV);
  console.log(`   ✓ Report saved to: ${outputCSV}\n`);

  console.log('✅ Comparison complete!');
  console.log(`\nNext step: Review ${outputCSV} and prepare import for ${missingFromShopify} products.`);
}

// Run
main();
