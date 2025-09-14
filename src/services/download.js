import { processDocument } from "./utils.js"

(async () => {
    document.querySelectorAll(`[aria-label="Download"]`).forEach((btn) => {
        if (!btn) return;
        btn.onclick = null;
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();

            processDocument()
        }, true)
    });
})()