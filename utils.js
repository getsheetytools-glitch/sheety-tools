// ── Configuration ──
const CONFIG = {
  PIE: {
    cx: 200,              // Pie center X
    cy: 200,              // Pie center Y
    outerRadius: 180,     // Outer radius
    innerRadius: 90,      // Inner radius (donut hole)
    minSlicePercent: 0.5, // Minimum slice size
  },
  COLOR: {
    topHue: 120,          // Top item color (green)
    bottomHue: 0,         // Bottom item color (red)
    baseSaturation: 75,   // Color saturation
    topLightness: 55,     // Top item brightness
    bottomLightness: 60,  // Bottom item brightness
  },
  DISTRIBUTION: {
    topRatio: 8,          // Top item weight (increased from 5)
    bottomRatio: 1,       // Bottom item weight
  },
  DEBOUNCE_MS: 500,       // Save delay in milliseconds
};

// ── ID Generation ──
function cryptoRandomId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ── Percentage Calculation ──
function recalcSlicesByRank(items) {
  if (!items || items.length === 0) return [];
  
  const n = items.length;
  
  // If only one item, it gets 100%
  if (n === 1) {
    return [{ ...items[0], percent: 100 }];
  }
  
  // Each item is worth 2x the next item
  // Item 1: 2^(n-1), Item 2: 2^(n-2), ..., Item n: 2^0
  // Total = 2^n - 1
  
  const weights = items.map((_, i) => {
    return Math.pow(2, n - 1 - i);
  });
  
  const totalWeight = Math.pow(2, n) - 1; // This equals sum of all weights
  
  // Convert weights to percentages
  const percentages = weights.map(w => (w / totalWeight) * 100);
  
  return items.map((item, i) => ({
    ...item,
    percent: percentages[i]
  }));
}

// ── Color Calculation ──
function colorForRank(index, total) {
  const { topHue, bottomHue, baseSaturation, topLightness, bottomLightness } = CONFIG.COLOR;
  
  if (total === 1) {
    return { h: topHue, s: baseSaturation, l: topLightness };
  }
  
  const t = index / (total - 1); // 0 to 1
  
  // Interpolate hue from green (120) through yellow (60) to red (0)
  // This gives us a natural traffic light gradient
  const hue = topHue * (1 - t) + bottomHue * t;
  
  const lightness = topLightness * (1 - t) + bottomLightness * t;
  
  return { h: hue, s: baseSaturation, l: lightness };
}

// ── Color Conversion ──
function hslToRgb(h, s, l) {
  s = s / 100;
  l = l / 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return `rgb(${r}, ${g}, ${b})`;
}

// ── SVG Path Generation ──
function createDonutPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
  const degToRad = Math.PI / 180;
  
  // Convert angles to radians
  const startRad = startAngle * degToRad;
  const endRad = endAngle * degToRad;
  
  // Calculate outer arc points
  const outerStartX = cx + outerRadius * Math.cos(startRad);
  const outerStartY = cy + outerRadius * Math.sin(startRad);
  const outerEndX = cx + outerRadius * Math.cos(endRad);
  const outerEndY = cy + outerRadius * Math.sin(endRad);
  
  // Calculate inner arc points
  const innerStartX = cx + innerRadius * Math.cos(startRad);
  const innerStartY = cy + innerRadius * Math.sin(startRad);
  const innerEndX = cx + innerRadius * Math.cos(endRad);
  const innerEndY = cy + innerRadius * Math.sin(endRad);
  
  // Determine if we need a large arc
  const sweepAngle = endAngle - startAngle;
  const largeArc = sweepAngle > 180 ? 1 : 0;
  
  // Build the path
  const path = [
    `M ${outerStartX} ${outerStartY}`,                           // Move to outer start
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEndX} ${outerEndY}`, // Outer arc
    `L ${innerEndX} ${innerEndY}`,                               // Line to inner end
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStartX} ${innerStartY}`, // Inner arc
    'Z'                                                           // Close path
  ].join(' ');
  
  return path;
}

// ── HTML Escaping ──
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ── Export/Import Functions ──
function exportData(focusItems) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Helper to convert HSL to RGB
  function hslToRgb(h, s, l) {
    s = s / 100;
    l = l / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }
  
  // Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Focus Budget', 105, 20, { align: 'center' });
  
  // Date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
  doc.text(date, 105, 27, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  
  // Draw pie chart
  const centerX = 105;
  const centerY = 90;
  const outerRadius = 40;
  const innerRadius = 20;
  
  let currentAngle = -90; // Start at top
  
  focusItems.forEach((item, index) => {
    const sweepAngle = (item.percent / 100) * 360;
    const endAngle = currentAngle + sweepAngle;
    
    // Get color
    const t = focusItems.length > 1 ? index / (focusItems.length - 1) : 0;
    const hue = 120 * (1 - t); // Green to red
    const [r, g, b] = hslToRgb(hue, 75, 55);
    
    doc.setFillColor(r, g, b);
    doc.setDrawColor(11, 13, 18);
    doc.setLineWidth(0.5);
    
    // Draw arc (simplified - draw as filled polygon)
    const segments = Math.max(10, Math.ceil(Math.abs(sweepAngle) / 10));
    const points = [];
    
    // Add center point for donut hole
    for (let i = 0; i <= segments; i++) {
      const angle = (currentAngle + (sweepAngle * i / segments)) * Math.PI / 180;
      // Outer edge
      points.push([
        centerX + outerRadius * Math.cos(angle),
        centerY + outerRadius * Math.sin(angle)
      ]);
    }
    
    // Add inner edge in reverse
    for (let i = segments; i >= 0; i--) {
      const angle = (currentAngle + (sweepAngle * i / segments)) * Math.PI / 180;
      points.push([
        centerX + innerRadius * Math.cos(angle),
        centerY + innerRadius * Math.sin(angle)
      ]);
    }
    
    // Draw the polygon
    doc.path(points.map((p, i) => ({
      op: i === 0 ? 'm' : 'l',
      c: p
    })).concat([{ op: 's' }]));
    doc.fillStroke();
    
    currentAngle = endAngle;
  });
  
  // Draw center circle (white)
  doc.setFillColor(255, 255, 255);
  doc.circle(centerX, centerY, innerRadius, 'F');
  
  // Add item count in center
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(focusItems.length.toString(), centerX, centerY - 3, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(focusItems.length === 1 ? 'item' : 'items', centerX, centerY + 4, { align: 'center' });
  
  // Add summary list
  let yPos = 145;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Focus Items:', 20, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  focusItems.forEach((item, index) => {
    // Get color for indicator
    const t = focusItems.length > 1 ? index / (focusItems.length - 1) : 0;
    const hue = 120 * (1 - t);
    
    // Draw color circle
    const [r, g, b] = hslToRgb(hue, 75, 55);
    doc.setFillColor(r, g, b);
    doc.circle(22, yPos - 1.5, 1.5, 'F');
    
    // Add text
    doc.setTextColor(0, 0, 0);
    const text = `${index + 1}. ${item.text} (${item.percent.toFixed(1)}%)`;
    const splitText = doc.splitTextToSize(text, 160);
    doc.text(splitText, 28, yPos);
    
    yPos += splitText.length * 5 + 2;
    
    // Add new page if needed
    if (yPos > 270 && index < focusItems.length - 1) {
      doc.addPage();
      yPos = 20;
    }
  });
  
  // Add note at bottom
  yPos += 8;
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const note = doc.splitTextToSize(
    'Each item is worth 2x the item below it. Focus your attention on green items first, then yellow, then red.',
    170
  );
  doc.text(note, 20, yPos);
  
  // Save
  const filename = `focus-budget-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
