const { createCanvas } = require('canvas');

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
    // Get name from query parameters, fallback to default
    const name = event.queryStringParameters?.name || 'John Doe';
    
    // Mock certificate data
    const mockData = {
      name: name,
      course: 'Introduction to Vector Search',
      date: 'January 15, 2024',
      certificateNumber: 'CERT-2024-001'
    };

    // Render certificate image
    const imageBuffer = await renderCertificate(mockData);

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
  // Certificate dimensions (adjust as needed)
  const width = 1200;
  const height = 800;

  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Set background color (light blue/white gradient)
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#E8F4F8');
  gradient.addColorStop(1, '#FFFFFF');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add decorative border
  ctx.strokeStyle = '#2C5282';
  ctx.lineWidth = 8;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // Add inner border
  ctx.strokeStyle = '#4299E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, width - 120, height - 120);

  // Title - use simple font specification that works with node-canvas
  ctx.fillStyle = '#1A365D';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CERTIFICATE OF COMPLETION', width / 2, 150);

  // Subtitle
  ctx.fillStyle = '#2D3748';
  ctx.font = '32px sans-serif';
  ctx.fillText('This is to certify that', width / 2, 220);

  // Name
  ctx.fillStyle = '#1A365D';
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText(name, width / 2, 320);

  // Course
  ctx.fillStyle = '#2D3748';
  ctx.font = '36px sans-serif';
  ctx.fillText(`has successfully completed`, width / 2, 400);
  ctx.fillText(course, width / 2, 460);

  // Date
  if (date) {
    ctx.fillStyle = '#4A5568';
    ctx.font = '28px sans-serif';
    ctx.fillText(`Date: ${date}`, width / 2, 550);
  }

  // Certificate Number
  if (certificateNumber) {
    ctx.fillStyle = '#718096';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Certificate #${certificateNumber}`, width - 100, height - 80);
  }

  // Add decorative elements (optional)
  // Left corner decoration
  ctx.strokeStyle = '#4299E1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(100, 100);
  ctx.lineTo(150, 100);
  ctx.lineTo(100, 150);
  ctx.stroke();

  // Right corner decoration
  ctx.beginPath();
  ctx.moveTo(width - 100, 100);
  ctx.lineTo(width - 150, 100);
  ctx.lineTo(width - 100, 150);
  ctx.stroke();

  // Convert canvas to buffer
  return canvas.toBuffer('image/png');
}

