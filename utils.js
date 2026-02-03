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
    topHue: 180,          // Top item color (cyan)
    bottomHue: 340,       // Bottom item color (red)
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
  
  // Interpolate hue (handle wrap-around)
  let hue;
  if (topHue > bottomHue) {
    hue = topHue * (1 - t) + bottomHue * t;
  } else {
    // Wrap around through 360
    const diff = (bottomHue - topHue + 360) % 360;
    hue = (topHue + diff * t) % 360;
  }
  
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
  const data = {
    version: "1.0",
    exported: new Date().toISOString(),
    items: focusItems.map(item => ({
      id: item.id,
      text: item.text,
      percent: item.percent
    }))
  };
  
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `focus-budget-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importData(file, callback) {
  if (!file) return;
  
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      // Validate data structure
      if (!data.items || !Array.isArray(data.items)) {
        alert('Invalid file format: missing items array');
        return;
      }
      
      // Validate each item
      const validItems = data.items.filter(item => 
        item &&
        typeof item.id === 'string' &&
        typeof item.text === 'string' &&
        typeof item.percent === 'number'
      );
      
      if (validItems.length === 0) {
        alert('No valid items found in file');
        return;
      }
      
      if (validItems.length < data.items.length) {
        console.warn(`${data.items.length - validItems.length} invalid items were skipped`);
      }
      
      callback(validItems);
      
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import: Invalid JSON file');
    }
  };
  
  reader.onerror = () => {
    alert('Failed to read file');
  };
  
  reader.readAsText(file);
}
