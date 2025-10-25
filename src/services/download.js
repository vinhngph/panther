import { processDocument } from "./utils.js"

(async () => {
    const selector = 'button[aria-label="Download"]';

    const wrapper = document.getElementById("main-wrapper") || document.body;

    let queue = new Set();
    let scheduled = false;

    const flushQueue = () => {
        queue.forEach(handleButton);
        queue.clear();
        scheduled = false;
    }

    const scheduleFlush = () => {
        if (!scheduled) {
            scheduled = true;
            queueMicrotask(flushQueue);
        }
    }

    const handleButton = (btn) => {
        if (btn.dataset.processed) return;
        btn.dataset.processed = "true";

        btn.onclick = null;
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();

            processDocument();
        }, true)
    }

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== 1) continue;

                if (node.matches(selector)) queue.add(node)

                const nodes = node.querySelectorAll?.(selector)
                nodes?.forEach(btn => queue.add(btn))
            }
        }
        if (queue.size) scheduleFlush();
    })
    observer.observe(wrapper, { childList: true, subtree: true });

    window.addEventListener("beforeunload", () => observer.disconnect());

    wrapper.querySelectorAll(selector).forEach(handleButton);
    scheduleFlush();
})()