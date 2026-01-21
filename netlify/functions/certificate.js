const Jimp = require('jimp');
const Airtable = require('airtable');

// Helper function to convert hex color to Jimp color integer
function hexToInt(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return Jimp.rgbaToInt(r, g, b, 255);
}

// Helper to apply color to text area (only dark pixels, which are the text)
function applyTextColor(image, x, y, width, height, color) {
  image.scan(x, y, width, height, function (x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    const alpha = this.bitmap.data[idx + 3];
    
    // Only apply color to dark pixels (text pixels), not light background pixels
    // Check if pixel is dark (text) - sum of RGB is less than a threshold
    const brightness = r + g + b;
    if (alpha > 0 && brightness < 200) { // Dark pixels are text
      const newR = (color >> 24) & 0xFF;
      const newG = (color >> 16) & 0xFF;
      const newB = (color >> 8) & 0xFF;
      this.bitmap.data[idx] = newR;
      this.bitmap.data[idx + 1] = newG;
      this.bitmap.data[idx + 2] = newB;
    }
  });
}

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_APIKEY
}).base('apps18Ovyv8vrAXQ1');

// Handler function
exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get Certification ID from query parameters or path
    let certificationId = event.queryStringParameters?.id || 
                        event.queryStringParameters?.certificationId;
    
    // If not in query params, try to extract from path
    if (!certificationId && event.path) {
      const pathParts = event.path.split('/').filter(Boolean);
      certificationId = pathParts[pathParts.length - 1];
    }

    if (!certificationId || certificationId === 'certificate') {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Certification ID is required. Usage: ?id=CERTIFICATION_ID or /certificate/CERTIFICATION_ID' 
        })
      };
    }

    // Fetch record from Airtable
    const tableName = 'tblSPihAjgmIVAtDL'; // Table ID from URL
    
    // Try to parse as number first (Certification ID might be numeric)
    const certIdNum = parseInt(certificationId, 10);
    const isNumeric = !isNaN(certIdNum);
    
    // Build filter formula - handle both numeric and text IDs
    const filterFormula = isNumeric 
      ? `{Certification ID} = ${certIdNum}`
      : `{Certification ID} = "${certificationId}"`;
    
    const records = await base(tableName).select({
      filterByFormula: filterFormula,
      maxRecords: 1
    }).firstPage();

    if (records.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Certificate not found' })
      };
    }

    const record = records[0];
    const fields = record.fields;

    // Extract certificate data from Airtable
    // Field names might have BOM character, so try both
    const userName = fields['User Name'] || fields['﻿User Name'] || '';
    const courseName = fields['Course Name'] || fields['﻿Course Name'] || '';
    const certId = fields['Certification ID'] || fields['﻿Certification ID'] || certificationId;
    const dateCompleted = fields['Date Completed'] || '';

    // Format date if available
    let formattedDate = '';
    if (dateCompleted) {
      try {
        const date = new Date(dateCompleted);
        formattedDate = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      } catch (e) {
        formattedDate = dateCompleted;
      }
    }

    // Prepare certificate data
    const certificateData = {
      name: userName,
      course: courseName,
      date: formattedDate,
      certificateNumber: certId
    };

    // Render certificate image
    const imageBuffer = await renderCertificate(certificateData);

    // Return image as response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      body: imageBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Error generating certificate:', error);

    // Handle Airtable-specific errors
    if (error.error === 'NOT_FOUND' || error.statusCode === 404) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Certificate not found' })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate certificate',
        message: error.message 
      })
    };
  }
};

// Function to render certificate image
async function renderCertificate({ name, course, date, certificateNumber }) {
  // Certificate dimensions
  const width = 1200;
  const height = 800;

  // Create image with gradient background
  const image = new Jimp(width, height, '#E8F4F8');
  
  // Create gradient effect
  for (let y = 0; y < height; y++) {
    const ratio = y / height;
    const r = Math.floor(232 + (255 - 232) * ratio);
    const g = Math.floor(244 + (255 - 244) * ratio);
    const b = Math.floor(248 + (255 - 248) * ratio);
    const color = Jimp.rgbaToInt(r, g, b, 255);
    
    for (let x = 0; x < width; x++) {
      image.setPixelColor(color, x, y);
    }
  }

  // Draw outer border (8px)
  const borderColor = hexToInt('#2C5282');
  for (let i = 0; i < 8; i++) {
    const offset = 40 + i;
    // Top and bottom
    for (let x = offset; x < width - offset; x++) {
      image.setPixelColor(borderColor, x, offset);
      image.setPixelColor(borderColor, x, height - offset);
    }
    // Left and right
    for (let y = offset; y < height - offset; y++) {
      image.setPixelColor(borderColor, offset, y);
      image.setPixelColor(borderColor, width - offset, y);
    }
  }

  // Draw inner border (2px)
  const innerBorderColor = hexToInt('#4299E1');
  for (let i = 0; i < 2; i++) {
    const offset = 60 + i;
    // Top and bottom
    for (let x = offset; x < width - offset; x++) {
      image.setPixelColor(innerBorderColor, x, offset);
      image.setPixelColor(innerBorderColor, x, height - offset);
    }
    // Left and right
    for (let y = offset; y < height - offset; y++) {
      image.setPixelColor(innerBorderColor, offset, y);
      image.setPixelColor(innerBorderColor, width - offset, y);
    }
  }

  // Load fonts
  const fontTitle = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
  const fontSubtitle = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  const fontName = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
  const fontCourse = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  const fontDate = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
  const fontCertNum = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);

  // Title
  const titleY = 100;
  image.print(fontTitle, 0, titleY, {
    text: 'CERTIFICATE OF COMPLETION',
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_TOP
  }, width);
  applyTextColor(image, 0, titleY, width, 50, hexToInt('#1A365D'));

  // Subtitle
  const subtitleY = 200;
  image.print(fontSubtitle, 0, subtitleY, {
    text: 'This is to certify that',
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_TOP
  }, width);
  applyTextColor(image, 0, subtitleY, width, 40, hexToInt('#2D3748'));

  // Name
  const nameY = 280;
  image.print(fontName, 0, nameY, {
    text: name,
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_TOP
  }, width);
  applyTextColor(image, 0, nameY, width, 60, hexToInt('#1A365D'));

  // Course text
  const courseY1 = 380;
  image.print(fontCourse, 0, courseY1, {
    text: 'has successfully completed',
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_TOP
  }, width);
  
  const courseY2 = 440;
  image.print(fontCourse, 0, courseY2, {
    text: course,
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_TOP
  }, width);
  applyTextColor(image, 0, courseY1, width, 100, hexToInt('#2D3748'));

  // Date
  if (date) {
    const dateY = 530;
    image.print(fontDate, 0, dateY, {
      text: `Date: ${date}`,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, width);
    applyTextColor(image, 0, dateY, width, 30, hexToInt('#4A5568'));
  }

  // Certificate Number
  if (certificateNumber) {
    const certText = `Certificate #${certificateNumber}`;
    const textWidth = Jimp.measureText(fontCertNum, certText);
    const certX = width - 100;
    const certY = height - 80;
    image.print(fontCertNum, certX - textWidth, certY, {
      text: certText,
      alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    });
    applyTextColor(image, certX - textWidth, certY, textWidth, 30, hexToInt('#718096'));
  }

  // Add decorative corner elements
  const decorColor = hexToInt('#4299E1');
  // Left corner (L-shape)
  for (let i = 0; i < 50; i++) {
    image.setPixelColor(decorColor, 100 + i, 100);
    image.setPixelColor(decorColor, 100, 100 + i);
  }
  // Right corner (mirrored L-shape)
  for (let i = 0; i < 50; i++) {
    image.setPixelColor(decorColor, width - 100 - i, 100);
    image.setPixelColor(decorColor, width - 100, 100 + i);
  }

  // Convert to buffer
  return await image.getBufferAsync(Jimp.MIME_PNG);
}

// Export renderCertificate for testing
module.exports.renderCertificate = renderCertificate;
