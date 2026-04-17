export function toggleLoader(show) {
  const loader = document.getElementById("loader");
  if (loader) loader.classList.toggle("hidden", !show);
}
export function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000)
  
  }
  
 window.toggleLoader = toggleLoader;
