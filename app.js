// ── Application State ──
let focusItems = [];
let selectedFocusId = null;

// ── DOM Cache ──
const DOM = {
  form: null,
  focusInput: null,
  addBtn: null,
  list: null,
  pieChart: null,
  pieWrap: null,
  empty: null,
  controlsSection: null,
  controlsTitle: null,
  controlsPercent: null,
  itemCount: null,
  clearBtn: null,
  exportBtn: null,
};

// ── Initialization ──
function init() {
  // Cache DOM elements
  DOM.form = document.getElementById("focusForm");
  DOM.focusInput = document.getElementById("focusInput");
  DOM.addBtn = document.getElementById("addBtn");
  DOM.list = document.getElementById("focusList");
  DOM.pieChart = document.getElementById("pieChart");
  DOM.pieWrap = document.querySelector(".pieWrap");
  DOM.empty = document.querySelector(".empty");
  DOM.controlsSection = document.getElementById("controlsSection");
  DOM.controlsTitle = document.getElementById("controlsTitle");
  DOM.controlsPercent = document.getElementById("controlsPercent");
  DOM.itemCount = document.getElementById("itemCount");
  DOM.clearBtn = document.getElementById("clearBtn");
  DOM.exportBtn = document.getElementById("exportBtn");

  // Load data
  focusItems = loadFocusItems();
  
  // Setup event listeners
  setupEventListeners();
  
  // Initial render
  render();
}

// ── Event Listeners Setup ──
function setupEventListeners() {
  // Form submission
  DOM.form.addEventListener("submit", handleAddFocus);
  
  // List event delegation
  DOM.list.addEventListener("click", handleListClick);
  DOM.list.addEventListener("dragstart", handleDragStart);
  DOM.list.addEventListener("dragend", handleDragEnd);
  DOM.list.addEventListener("dragover", handleDragOver);
  DOM.list.addEventListener("dragleave", handleDragLeave);
  DOM.list.addEventListener("drop", handleDrop);
  
  // Footer buttons
  DOM.clearBtn.addEventListener("click", handleClearAll);
  DOM.exportBtn.addEventListener("click", handleExport);
  
  // Keyboard shortcuts
  document.addEventListener("keydown", handleKeyboardShortcuts);
}

// ── Event Handlers ──
function handleAddFocus(e) {
  e.preventDefault();
  const text = DOM.focusInput.value.trim();
  if (!text) return;
  
  const newItem = { id: cryptoRandomId(), text, percent: 0 };
  focusItems.push(newItem);
  focusItems = recalcSlicesByRank(focusItems);
  
  debouncedSave(focusItems);
  DOM.focusInput.value = "";
  render();
}

function handleListClick(e) {
  const listItem = e.target.closest('.listItem');
  if (!listItem) return;
  
  const deleteBtn = e.target.closest('.deleteBtn');
  const arrowBtn = e.target.closest('.arrowBtn');
  
  if (deleteBtn) {
    e.stopPropagation();
    const id = deleteBtn.dataset.id;
    const item = focusItems.find(x => x.id === id);
    handleDeleteFocus(id, item?.text);
  } else if (arrowBtn) {
    e.stopPropagation();
    const id = arrowBtn.dataset.id;
    const action = arrowBtn.dataset.action;
    if (action === 'up') moveFocusUp(id);
    else if (action === 'down') moveFocusDown(id);
  } else {
    handleSliceClick(listItem.dataset.id);
  }
}

function handleDragStart(e) {
  const listItem = e.target.closest('.listItem');
  if (!listItem) return;
  
  listItem.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", listItem.dataset.id);
}

function handleDragEnd(e) {
  const listItem = e.target.closest('.listItem');
  if (!listItem) return;
  
  listItem.classList.remove("dragging");
  document.querySelectorAll(".dragOver").forEach(el => el.classList.remove("dragOver"));
}

function handleDragOver(e) {
  e.preventDefault();
  const listItem = e.target.closest('.listItem');
  const dragging = document.querySelector(".dragging");
  
  if (listItem && dragging && dragging !== listItem) {
    listItem.classList.add("dragOver");
  }
}

function handleDragLeave(e) {
  const listItem = e.target.closest('.listItem');
  if (!listItem) return;
  
  if (!listItem.contains(e.relatedTarget)) {
    listItem.classList.remove("dragOver");
  }
}

function handleDrop(e) {
  e.preventDefault();
  const listItem = e.target.closest('.listItem');
  if (!listItem) return;
  
  listItem.classList.remove("dragOver");
  
  const draggedId = e.dataTransfer.getData("text/plain");
  const targetId = listItem.dataset.id;
  
  if (!draggedId || draggedId === targetId) return;
  
  const fromIndex = focusItems.findIndex(x => x.id === draggedId);
  const toIndex = focusItems.findIndex(x => x.id === targetId);
  
  if (fromIndex === -1 || toIndex === -1) return;
  
  // Reorder focusItems
  const [movedItem] = focusItems.splice(fromIndex, 1);
  focusItems.splice(toIndex, 0, movedItem);
  
  focusItems = recalcSlicesByRank(focusItems);
  debouncedSave(focusItems);
  render();
}

function handleKeyboardShortcuts(e) {
  if (!selectedFocusId) return;
  
  // Only trigger if Ctrl/Cmd is pressed (to avoid interfering with form inputs)
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveFocusUp(selectedFocusId);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveFocusDown(selectedFocusId);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      const item = focusItems.find(x => x.id === selectedFocusId);
      handleDeleteFocus(selectedFocusId, item?.text);
    }
  } else if (e.key === 'Escape') {
    selectedFocusId = null;
    render();
  }
}

function handleClearAll() {
  if (!focusItems.length) return;
  if (!confirm(`Delete all ${focusItems.length} focus items? This cannot be undone.`)) return;
  
  focusItems = [];
  selectedFocusId = null;
  clearFocusItems();
  render();
}

function handleExport() {
  if (!focusItems.length) {
    alert('No focus items to export.');
    return;
  }
  exportData(focusItems);
}

function handleDeleteFocus(id, text) {
  if (!confirm(`Delete "${text}"?`)) return;
  
  focusItems = focusItems.filter(x => x.id !== id);
  if (selectedFocusId === id) selectedFocusId = null;
  
  focusItems = recalcSlicesByRank(focusItems);
  debouncedSave(focusItems, true); // Immediate save for deletions
  render();
}

function handleSliceClick(id) {
  selectedFocusId = selectedFocusId === id ? null : id;
  render();
}

// ── Movement Functions ──
function moveFocusUp(id) {
  const index = focusItems.findIndex(x => x.id === id);
  if (index <= 0) return;
  
  [focusItems[index - 1], focusItems[index]] = [focusItems[index], focusItems[index - 1]];
  focusItems = recalcSlicesByRank(focusItems);
  debouncedSave(focusItems);
  render();
}

function moveFocusDown(id) {
  const index = focusItems.findIndex(x => x.id === id);
  if (index === -1 || index >= focusItems.length - 1) return;
  
  [focusItems[index], focusItems[index + 1]] = [focusItems[index + 1], focusItems[index]];
  focusItems = recalcSlicesByRank(focusItems);
  debouncedSave(focusItems);
  render();
}

function moveFocusTop(id) {
  const index = focusItems.findIndex(x => x.id === id);
  if (index <= 0) return;
  
  const [item] = focusItems.splice(index, 1);
  focusItems.unshift(item);
  focusItems = recalcSlicesByRank(focusItems);
  debouncedSave(focusItems);
  render();
}

function moveFocusBottom(id) {
  const index = focusItems.findIndex(x => x.id === id);
  if (index === -1 || index >= focusItems.length - 1) return;
  
  const [item] = focusItems.splice(index, 1);
  focusItems.push(item);
  focusItems = recalcSlicesByRank(focusItems);
  debouncedSave(focusItems);
  render();
}

// ── Render Functions ──
function render() {
  renderPieChart();
  renderFocusList();
  updateControls();
  updateFooter();
}

function renderPieChart() {
  DOM.pieChart.innerHTML = "";
  
  if (focusItems.length === 0) {
    DOM.pieChart.style.display = "none";
    DOM.empty.style.display = "flex";
    return;
  }
  
  DOM.pieChart.style.display = "block";
  DOM.empty.style.display = "none";
  
  let currentAngle = -90; // Start at top
  const { cx, cy, outerRadius, innerRadius } = CONFIG.PIE;
  
  focusItems.forEach((item, index) => {
    const sweepAngle = (item.percent / 100) * 360;
    const endAngle = currentAngle + sweepAngle;
    
    const pathData = createDonutPath(cx, cy, innerRadius, outerRadius, currentAngle, endAngle);
    const color = colorForRank(index, focusItems.length);
    const colorStr = hslToRgb(color.h, color.s, color.l);
    
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.classList.add("slice");
    g.dataset.id = item.id;
    if (selectedFocusId === item.id) g.classList.add("selected");
    
    const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathEl.setAttribute("d", pathData);
    pathEl.setAttribute("fill", colorStr);
    pathEl.setAttribute("stroke", "rgba(11, 13, 18, 0.8)");
    pathEl.setAttribute("stroke-width", "2");
    pathEl.setAttribute("shape-rendering", "geometricPrecision");
    
    g.appendChild(pathEl);
    
    // Add text label for the item name
    const midAngle = (currentAngle + endAngle) / 2;
    const labelRadius = (innerRadius + outerRadius) / 2;
    const labelX = cx + labelRadius * Math.cos(midAngle * Math.PI / 180);
    const labelY = cy + labelRadius * Math.sin(midAngle * Math.PI / 180);
    
    // Only show label if slice is big enough
    if (sweepAngle > 15) {
      // Add a background rectangle for better text visibility
      const textBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      
      // Truncate text if too long
      let displayText = item.text;
      if (displayText.length > 20) {
        displayText = displayText.substring(0, 17) + "...";
      }
      
      // Create text first to measure it
      text.setAttribute("x", labelX);
      text.setAttribute("y", labelY);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("fill", "white");
      text.setAttribute("font-size", "14");
      text.setAttribute("font-weight", "700");
      text.setAttribute("pointer-events", "none");
      text.setAttribute("style", "text-shadow: 0 2px 4px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.9);");
      text.textContent = displayText;
      
      g.appendChild(text);
    }
    
    g.addEventListener("click", () => handleSliceClick(item.id));
    
    DOM.pieChart.appendChild(g);
    currentAngle = endAngle;
  });
  
  // Add center count
  const centerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  centerGroup.setAttribute("pointer-events", "none");
  
  const countText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  countText.setAttribute("x", cx);
  countText.setAttribute("y", cy - 10);
  countText.setAttribute("text-anchor", "middle");
  countText.setAttribute("dominant-baseline", "middle");
  countText.setAttribute("fill", "rgba(255, 255, 255, 0.9)");
  countText.setAttribute("font-size", "36");
  countText.setAttribute("font-weight", "700");
  countText.textContent = focusItems.length;
  
  const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  labelText.setAttribute("x", cx);
  labelText.setAttribute("y", cy + 15);
  labelText.setAttribute("text-anchor", "middle");
  labelText.setAttribute("dominant-baseline", "middle");
  labelText.setAttribute("fill", "rgba(255, 255, 255, 0.6)");
  labelText.setAttribute("font-size", "13");
  labelText.setAttribute("font-weight", "500");
  labelText.textContent = focusItems.length === 1 ? "item" : "items";
  
  centerGroup.appendChild(countText);
  centerGroup.appendChild(labelText);
  DOM.pieChart.appendChild(centerGroup);
}

function renderFocusList() {
  DOM.list.innerHTML = "";
  
  focusItems.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "listItem";
    li.dataset.id = item.id;
    li.draggable = true;
    if (selectedFocusId === item.id) li.classList.add("selected");
    
    const color = colorForRank(index, focusItems.length);
    const colorStr = hslToRgb(color.h, color.s, color.l);
    
    li.innerHTML = `
      <div class="indicator" style="background: ${colorStr};"></div>
      <div class="dragHandle" title="Drag to reorder">⋮⋮</div>
      <div class="itemContent">
        <div class="itemText">${escapeHtml(item.text)}</div>
        <div class="itemMeta">${item.percent.toFixed(0)}%</div>
      </div>
      <div class="itemActions">
        <button class="arrowBtn" data-action="up" data-id="${item.id}" aria-label="Move up" ${index === 0 ? 'disabled' : ''}>↑</button>
        <button class="arrowBtn" data-action="down" data-id="${item.id}" aria-label="Move down" ${index === focusItems.length - 1 ? 'disabled' : ''}>↓</button>
        <button class="deleteBtn" data-id="${item.id}" aria-label="Delete ${escapeHtml(item.text)}">✕</button>
      </div>
    `;
    
    DOM.list.appendChild(li);
  });
}

function updateControls() {
  if (!selectedFocusId) {
    DOM.controlsSection.style.display = "none";
    return;
  }
  
  const item = focusItems.find(x => x.id === selectedFocusId);
  if (!item) {
    DOM.controlsSection.style.display = "none";
    return;
  }
  
  DOM.controlsSection.style.display = "block";
  
  const index = focusItems.findIndex(x => x.id === selectedFocusId);
  
  DOM.controlsTitle.textContent = item.text;
  DOM.controlsPercent.textContent = `${item.percent.toFixed(0)}%`;
  
  const moveTopBtn = document.getElementById("moveTopBtn");
  const moveUpBtn = document.getElementById("moveUpBtn");
  const moveDownBtn = document.getElementById("moveDownBtn");
  const moveBottomBtn = document.getElementById("moveBottomBtn");
  
  moveTopBtn.disabled = index === 0;
  moveUpBtn.disabled = index === 0;
  moveDownBtn.disabled = index === focusItems.length - 1;
  moveBottomBtn.disabled = index === focusItems.length - 1;
  
  moveTopBtn.onclick = () => moveFocusTop(selectedFocusId);
  moveUpBtn.onclick = () => moveFocusUp(selectedFocusId);
  moveDownBtn.onclick = () => moveFocusDown(selectedFocusId);
  moveBottomBtn.onclick = () => moveFocusBottom(selectedFocusId);
}

function updateFooter() {
  DOM.itemCount.textContent = focusItems.length;
  DOM.clearBtn.disabled = focusItems.length === 0;
  DOM.exportBtn.disabled = focusItems.length === 0;
}

// ── Start the app ──
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
