import './core/theme.js';
import { renderNavbar, renderFooter } from './components/layout.js';

export function bootstrapPublicPage() {
  renderNavbar();
  renderFooter();
}

document.addEventListener('DOMContentLoaded', bootstrapPublicPage);
