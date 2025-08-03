// This script generates placeholder PWA icons
// In production, replace these with your actual app icons

const fs = require('fs');
const path = require('path');

const sizes = [192, 256, 384, 512];
const publicDir = path.join(__dirname, '..', 'public');

// Create a simple SVG icon
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0a0a0a"/>
  <text x="256" y="256" font-family="Arial, sans-serif" font-size="200" font-weight="bold" 
        text-anchor="middle" dy=".3em" fill="white">H</text>
</svg>
`;

// Save the SVG
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);

console.log('✅ Icon placeholder created at public/icon.svg');
console.log('⚠️  Please replace with actual app icons for production!');