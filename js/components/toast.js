let container;

function getContainer() {
  if (container?.isConnected) return container;
  container = document.createElement("div");
  container.className = "toast-container";
  container.setAttribute("aria-live", "polite");
  document.body.append(container);
  return container;
}

export function showToast(message, type = "info", duration = 3500) {
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;
  getContainer().append(toast);
  window.setTimeout(() => toast.remove(), duration);
}
