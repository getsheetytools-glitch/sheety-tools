// ── Storage Module ──
const STORAGE_KEY = "sheety:focusBudget:v1";

// Debounced save function
let saveTimeout;
function debouncedSave(data, immediate = false) {
  if (immediate) {
    clearTimeout(saveTimeout);
    return saveFocusItems(data);
  }
  
  clearTimeout(saveTimeout);
  return new Promise((resolve) => {
    saveTimeout = setTimeout(() => {
      const result = saveFocusItems(data);
      resolve(result);
    }, CONFIG.DEBOUNCE_MS);
  });
}

function saveFocusItems(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Failed to save focusItems:", error);
    alert("Failed to save changes. You may be out of storage space.");
    return false;
  }
}

function loadFocusItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item => 
      item && 
      typeof item.id === "string" && 
      typeof item.text === "string" && 
      typeof item.percent === "number" && 
      item.percent > 0
    );
  } catch (error) {
    console.error("Failed to load focusItems:", error);
    return [];
  }
}

function clearFocusItems() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Failed to clear focusItems:", error);
    return false;
  }
}
