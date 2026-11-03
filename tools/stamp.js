// Stamp the local CSS and JS links in index.html with a version so browsers fetch fresh copies after an update.
// Run before committing a release: node tools/stamp.js
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
const v = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
const html = fs.readFileSync(file, 'utf8').replace(/((?:href|src)="(?:css|js)\/[^"?]+\.(?:css|js))(?:\?v=[^"]*)?"/g, `$1?v=${v}"`);
fs.writeFileSync(file, html);
console.log('stamped', v, (html.match(/\?v=/g) || []).length, 'links');
