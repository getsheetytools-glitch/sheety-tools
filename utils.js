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
  
  // Helper function to convert HSL to RGB
  function hslToRgbArray(h, s, l) {
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
    
    return [r, g, b];
  }
  
  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Focus Budget', 105, 20, { align: 'center' });
  
  // Subtitle with date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
  doc.text(`Generated on ${date}`, 105, 28, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Summary
  doc.setFontSize(11);
  doc.text(`Total Focus Items: ${focusItems.length}`, 20, 40);
  
  // Prepare table data
  const tableData = focusItems.map((item, index) => {
    const bar = '█'.repeat(Math.round(item.percent / 2)); // Visual bar
    return [
      (index + 1).toString(),
      item.text,
      `${item.percent.toFixed(1)}%`,
      bar
    ];
  });
  
  // Create table with colors
  doc.autoTable({
    startY: 48,
    head: [['Rank', 'Focus Item', 'Allocation', 'Visual']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 13, 18],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 90 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 50, halign: 'left', fontStyle: 'bold' }
    },
    didParseCell: function(data) {
      // Color code the rows based on rank
      if (data.section === 'body') {
        const rowIndex = data.row.index;
        const total = focusItems.length;
        
        // Calculate color (green to red gradient)
        const t = total > 1 ? rowIndex / (total - 1) : 0;
        const hue = 120 * (1 - t) + 0 * t; // Green (120) to Red (0)
        
        const [r, g, b] = hslToRgbArray(hue, 75, 85); // Lighter for background
        data.cell.styles.fillColor = [r, g, b];
        
        // Darker text for light backgrounds
        if (hue > 80) {
          data.cell.styles.textColor = [0, 0, 0];
        }
      }
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    }
  });
  
  // Add explanation section
  let finalY = doc.lastAutoTable.finalY + 15;
  
  // Check if we need a new page
  if (finalY > 250) {
    doc.addPage();
    finalY = 20;
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('How to Use This Focus Budget', 20, finalY);
  
  finalY += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const explanationText = 
    'Each item is worth twice the item below it. Your highest priority item gets the most ' +
    'focus, and each subsequent item receives proportionally less attention. Use this to ' +
    'guide your daily decisions.';
  
  const splitText = doc.splitTextToSize(explanationText, 170);
  doc.text(splitText, 20, finalY);
  
  finalY += splitText.length * 5 + 8;
  
  // Color legend
  doc.setFillColor(76, 175, 80); // Green
  doc.circle(22, finalY, 2, 'F');
  doc.text('Green items: Highest priority, deserve the most focus', 28, finalY + 1);
  
  finalY += 6;
  doc.setFillColor(255, 235, 59); // Yellow
  doc.circle(22, finalY, 2, 'F');
  doc.text('Yellow items: Medium priority, important but not critical', 28, finalY + 1);
  
  finalY += 6;
  doc.setFillColor(244, 67, 54); // Red
  doc.circle(22, finalY, 2, 'F');
  doc.text('Red items: Lower priority, address when top items are handled', 28, finalY + 1);
  
  // Save the PDF
  const filename = `focus-budget-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
