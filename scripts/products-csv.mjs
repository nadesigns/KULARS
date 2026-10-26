#!/usr/bin/env node
// Turn the preview catalog (assets/js/data.js) into a Shopify product import CSV.
// Images point at the copies the Kulars theme already serves from Shopify's CDN;
// Shopify downloads them into each product on import.
//   node scripts/products-csv.mjs > shopify-products.csv
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const IMG_BASE = process.env.IMG_BASE || 'https://kulars-store.myshopify.com/cdn/shop/t/2/assets/';
const root = fileURLToPath(new URL('..', import.meta.url));
const ctx = { window: {} };
vm.runInNewContext(readFileSync(root + 'assets/js/data.js', 'utf8'), ctx);
const D = ctx.window.KULARS_DATA;

const COLLECTION = { teamwear: 'Teamwear', fanwear: 'Club Shop' };
const slug = s => s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cell = v => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const HEAD = ['Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published',
  'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value',
  'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Policy', 'Variant Fulfillment Service',
  'Variant Price', 'Variant Requires Shipping', 'Variant Taxable',
  'Image Src', 'Image Position', 'Image Alt Text', 'Variant Image', 'SEO Title', 'SEO Description', 'Status'];

const rows = [];
for (const [key, cfg] of Object.entries(D.COLLECTIONS)) {
  for (const p of cfg.products) {
    const handle = slug(p.name);
    const imgs = [...new Set(p.variants.flatMap(v => [...v.imgs, ...(v.extra || [])]))];
    const lines = [];
    p.variants.forEach(v => p.sizes.forEach(size => lines.push({ v, size })));
    lines.forEach(({ v, size }, i) => {
      const first = i === 0;
      const r = {
        Handle: handle,
        'Option1 Name': first ? 'Color' : '', 'Option1 Value': v.c,
        'Option2 Name': first ? 'Size' : '', 'Option2 Value': size,
        'Variant SKU': `KUL-${p.id}-${slug(v.c)}-${slug(size)}`.toUpperCase(),
        'Variant Grams': 0, 'Variant Inventory Tracker': '', 'Variant Inventory Policy': 'deny', 'Variant Fulfillment Service': 'manual',
        'Variant Price': p.price.toFixed(2), 'Variant Requires Shipping': 'TRUE', 'Variant Taxable': 'TRUE',
        'Variant Image': IMG_BASE + v.imgs[0] + '.webp'
      };
      if (first) Object.assign(r, {
        Title: p.name, 'Body (HTML)': `<p>${p.desc}</p>`, Vendor: 'KULARS', Type: cfg.cats[p.cat],
        Tags: [...new Set([COLLECTION[key], cfg.cats[p.cat], p.tag, D.NEEDS[p.need], `kulars:${p.id}`])].join(', '),
        Published: 'TRUE', Status: 'active',
        'SEO Title': `${p.name} | Kulars`, 'SEO Description': p.desc
      });
      if (i < imgs.length) Object.assign(r, { 'Image Src': IMG_BASE + imgs[i] + '.webp', 'Image Position': i + 1, 'Image Alt Text': p.name });
      rows.push(r);
    });
    // more images than variant rows: image-only rows
    for (let i = lines.length; i < imgs.length; i++) {
      rows.push({ Handle: handle, 'Image Src': IMG_BASE + imgs[i] + '.webp', 'Image Position': i + 1, 'Image Alt Text': p.name });
    }
  }
}

process.stdout.write([HEAD, ...rows.map(r => HEAD.map(h => r[h]))].map(r => r.map(cell).join(',')).join('\n') + '\n');
