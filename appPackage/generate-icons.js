// Generate Teams app icons for DWx Traffic Manager
// Run with: node generate-icons.js

const fs = require('fs');
const { createCanvas } = require('canvas');

// Generate color icon (192x192)
function generateColorIcon() {
  const size = 192;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background with rounded corners
  const radius = 32;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();

  // Gradient background (DWx blue)
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#0078D4');  // Microsoft Blue
  gradient.addColorStop(1, '#106EBE');  // Darker blue
  ctx.fillStyle = gradient;
  ctx.fill();

  // Add subtle shadow effect
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;

  // "DWx" text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 72px Segoe UI, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 1;
  ctx.fillText('DWx', size / 2, size / 2 - 10);

  // "Traffic" text (smaller)
  ctx.font = '600 24px Segoe UI, Arial, sans-serif';
  ctx.fillText('Traffic', size / 2, size / 2 + 45);

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('color.png', buffer);
  console.log('Created: color.png (192x192)');
}

// Generate outline icon (32x32)
function generateOutlineIcon() {
  const size = 32;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Transparent background (default)

  // White rounded rectangle outline
  const radius = 4;
  const lineWidth = 2;
  const offset = lineWidth / 2;

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = lineWidth;

  ctx.beginPath();
  ctx.moveTo(radius + offset, offset);
  ctx.lineTo(size - radius - offset, offset);
  ctx.quadraticCurveTo(size - offset, offset, size - offset, radius + offset);
  ctx.lineTo(size - offset, size - radius - offset);
  ctx.quadraticCurveTo(size - offset, size - offset, size - radius - offset, size - offset);
  ctx.lineTo(radius + offset, size - offset);
  ctx.quadraticCurveTo(offset, size - offset, offset, size - radius - offset);
  ctx.lineTo(offset, radius + offset);
  ctx.quadraticCurveTo(offset, offset, radius + offset, offset);
  ctx.closePath();
  ctx.stroke();

  // "DWx" text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px Segoe UI, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DWx', size / 2, size / 2);

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('outline.png', buffer);
  console.log('Created: outline.png (32x32)');
}

// Check if canvas module is available
try {
  generateColorIcon();
  generateOutlineIcon();
  console.log('\nIcons generated successfully!');
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log('The "canvas" module is required. Install it with:');
    console.log('  npm install canvas');
    console.log('\nAlternatively, use an online SVG to PNG converter for the SVG files.');
  } else {
    console.error('Error generating icons:', error);
  }
}
