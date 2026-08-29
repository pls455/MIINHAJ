export function renderFooter(root = document.body) {
  const footer = document.createElement("footer");
  footer.innerHTML = `
    <span>مِنهَاج | Minhaj</span>
    <span>منصة تعليمية للطلاب</span>
  `;
  root.append(footer);
  return footer;
}
