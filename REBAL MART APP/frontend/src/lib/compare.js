const KEY = "rebel_mart_compare";
export function readCompareIds() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value.map(Number).filter(Number.isFinite).slice(0, 4) : [];
  } catch {
    return [];
  }
}
export function addCompare(productId) {
  const ids = readCompareIds();
  if (ids.includes(Number(productId)) || ids.length >= 4) return false;
  localStorage.setItem(KEY, JSON.stringify([...ids, Number(productId)]));
  window.dispatchEvent(new Event("rebel-compare-change"));
  return true;
}
export function removeCompare(productId) {
  const ids = readCompareIds().filter((id) => id !== Number(productId));
  localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("rebel-compare-change"));
  return ids;
}
export function clearCompare() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("rebel-compare-change"));
}
