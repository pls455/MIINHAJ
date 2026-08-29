import "./core/theme.js";
import { renderNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";

export function bootstrapPublicPage() {
  renderNavbar();
  renderFooter();
}

document.addEventListener("DOMContentLoaded", bootstrapPublicPage);
