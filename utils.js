// ── Configuration ──
const CONFIG = {
  PIE: {
    cx: 200,
    cy: 200,
    outerRadius: 180,
    innerRadius: 90,
    minSlicePercent: 0.5,
  },
  COLOR: {
    topHue: 120,
    bottomHue: 0,
    baseSaturation: 75,
    topLightness: 55,
    bottomLightness: 60,
  },
  DISTRIBUTION: {
    topRatio: 8,
    bottomRatio: 1,
  },
  DEBOUNCE_MS: 500,
};

// ── ID Generation ──
function cryptoRandomId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
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
  if (n === 1) return [{ ...items[0], percent: 100 }];
  const weights = items.map((_, i) => Math.pow(2, n - 1 - i));
  const totalWeight = Math.pow(2, n) - 1;
  const percentages = weights.map(w => (w / totalWeight) * 100);
  return items.map((item, i) => ({ ...item, percent: percentages[i] }));
}

// ── Color Calculation ──
function colorForRank(index, total) {
  const { topHue, bottomHue, baseSaturation, topLightness, bottomLightness } = CONFIG.COLOR;
  if (total === 1) return { h: topHue, s: baseSaturation, l: topLightness };
  const t = index / (total - 1);
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
  if (h >= 0 && h < 60)        { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180){ r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240){ r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300){ r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360){ r = c; g = 0; b = x; }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return `rgb(${r}, ${g}, ${b})`;
}

// ── SVG Path Generation ──
function createDonutPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
  const degToRad = Math.PI / 180;
  const startRad = startAngle * degToRad;
  const endRad = endAngle * degToRad;
  const outerStartX = cx + outerRadius * Math.cos(startRad);
  const outerStartY = cy + outerRadius * Math.sin(startRad);
  const outerEndX = cx + outerRadius * Math.cos(endRad);
  const outerEndY = cy + outerRadius * Math.sin(endRad);
  const innerStartX = cx + innerRadius * Math.cos(startRad);
  const innerStartY = cy + innerRadius * Math.sin(startRad);
  const innerEndX = cx + innerRadius * Math.cos(endRad);
  const innerEndY = cy + innerRadius * Math.sin(endRad);
  const sweepAngle = endAngle - startAngle;
  const largeArc = sweepAngle > 180 ? 1 : 0;
  const path = [
    `M ${outerStartX} ${outerStartY}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEndX} ${outerEndY}`,
    `L ${innerEndX} ${innerEndY}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStartX} ${innerStartY}`,
    'Z'
  ].join(' ');
  return path;
}

// ── HTML Escaping ──
function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ── Export Function ──
function exportData(focusItems) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, H = 297;
  const margin = 14;

  // ── Helpers ──────────────────────────────────────────
  function hsl2rgb(h, s, l) {
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60)       { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else              { r = c; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }

  function itemRgb(index, total) {
    const t = total > 1 ? index / (total - 1) : 0;
    return hsl2rgb(120 * (1 - t), 75, 52);
  }

  // Draw a donut slice using doc.lines() with relative delta coords
  function drawSlice(cx, cy, outerR, innerR, startDeg, sweepDeg, rgb) {
    if (Math.abs(sweepDeg) < 0.1) return;
    const segments = Math.max(10, Math.ceil(Math.abs(sweepDeg) / 6));
    const startRad = startDeg * Math.PI / 180;
    const endRad   = (startDeg + sweepDeg) * Math.PI / 180;

    const startX = cx + outerR * Math.cos(startRad);
    const startY = cy + outerR * Math.sin(startRad);

    const lines = [];
    let px = startX, py = startY;

    // Outer arc
    for (let i = 1; i <= segments; i++) {
      const angle = (startDeg + sweepDeg * i / segments) * Math.PI / 180;
      const nx = cx + outerR * Math.cos(angle);
      const ny = cy + outerR * Math.sin(angle);
      lines.push([nx - px, ny - py]);
      px = nx; py = ny;
    }

    // Line to inner arc end
    const ieX = cx + innerR * Math.cos(endRad);
    const ieY = cy + innerR * Math.sin(endRad);
    lines.push([ieX - px, ieY - py]);
    px = ieX; py = ieY;

    // Inner arc (reverse)
    for (let i = segments - 1; i >= 0; i--) {
      const angle = (startDeg + sweepDeg * i / segments) * Math.PI / 180;
      const nx = cx + innerR * Math.cos(angle);
      const ny = cy + innerR * Math.sin(angle);
      lines.push([nx - px, ny - py]);
      px = nx; py = ny;
    }

    doc.setFillColor(...rgb);
    doc.setDrawColor(24, 24, 27);
    doc.setLineWidth(0.5);
    doc.lines(lines, startX, startY, [1, 1], 'FD', true);
  }

  // ── Header bar ───────────────────────────────────────
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, W, 20, 'F');

  // Green dot accent
  doc.setFillColor(46, 201, 126);
  doc.circle(margin + 3, 10, 2.2, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(240, 240, 236);
  doc.text('Focus Budget', margin + 9, 11.5);

  // Date centred
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(168, 168, 160);
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(dateStr, W / 2, 11.5, { align: 'center' });

  // sheety.tools right
  doc.setFontSize(7.5);
  doc.setTextColor(106, 106, 98);
  doc.text('sheety.tools', W - margin, 11.5, { align: 'right' });

  // ── Pie chart ────────────────────────────────────────
  const cx    = margin + 34;
  const cy    = 72;
  const outerR = 32;
  const innerR = 16;

  let angle = -90;
  focusItems.forEach((item, i) => {
    const sweep = (item.percent / 100) * 360;
    drawSlice(cx, cy, outerR, innerR, angle, sweep, itemRgb(i, focusItems.length));
    angle += sweep;
  });

  // Donut hole
  doc.setFillColor(255, 255, 255);
  doc.circle(cx, cy, innerR - 0.4, 'F');

  // Center count
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(24, 24, 27);
  doc.text(focusItems.length.toString(), cx, cy + 1.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(120, 120, 120);
  doc.text(focusItems.length === 1 ? 'item' : 'items', cx, cy + 6, { align: 'center' });

  // ── Ranked list ──────────────────────────────────────
  const listX = margin + 74;
  let y = 32;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(24, 24, 27);
  doc.text('Priority Ranking', listX, y);
  y += 1.5;

  // Green underline
  doc.setDrawColor(46, 201, 126);
  doc.setLineWidth(0.5);
  doc.line(listX, y, listX + 55, y);
  y += 6;

  focusItems.forEach((item, i) => {
    const rgb = itemRgb(i, focusItems.length);

    // Color pill
    doc.setFillColor(...rgb);
    doc.roundedRect(listX, y - 3.5, 2.5, 4.5, 0.4, 0.4, 'F');

    // Rank
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    doc.text(`${i + 1}`, listX + 7.5, y, { align: 'right' });

    // Item name — truncate if too wide
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);
    let label = item.text;
    const maxW = 82;
    while (doc.getTextWidth(label) > maxW && label.length > 4) label = label.slice(0, -1);
    if (label !== item.text) label += '…';
    doc.text(label, listX + 9, y);

    // Percentage
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...rgb);
    doc.text(`${item.percent.toFixed(1)}%`, W - margin, y, { align: 'right' });

    // Row separator
    if (i < focusItems.length - 1) {
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.line(listX, y + 2.5, W - margin, y + 2.5);
    }

    y += 8;

    if (y > 260 && i < focusItems.length - 1) {
      doc.addPage();
      y = 20;
    }
  });

  // ── Key principle box ────────────────────────────────
  const boxY = Math.max(y + 12, 120);

  doc.setFillColor(232, 250, 242);
  doc.setDrawColor(46, 201, 126);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, boxY, W - margin * 2, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 24, 27);
  doc.text('Key Principle', margin + 5, boxY + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(55, 55, 55);
  const principle = doc.splitTextToSize(
    'Each item is worth 2× the next. Green = highest priority, red = lowest. Focus on green items first for maximum impact.',
    W - margin * 2 - 10
  );
  doc.text(principle, margin + 5, boxY + 13);

  // ── Footer ───────────────────────────────────────────
  doc.setFillColor(245, 245, 243);
  doc.rect(0, H - 12, W, 12, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text('Generated by Focus Budget · sheety.tools', W / 2, H - 4.5, { align: 'center' });

  doc.save(`focus-budget-${new Date().toISOString().split('T')[0]}.pdf`);
}
