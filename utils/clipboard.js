// utils/clipboard.js
export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    // modern secure API
    return navigator.clipboard.writeText(text);
  } else {
    // fallback for older browsers / insecure contexts
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = 0;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    if (!successful) {
      return Promise.reject(new Error("copy failed"));
    }
    return Promise.resolve();
  }
}
export default copyToClipboard;
