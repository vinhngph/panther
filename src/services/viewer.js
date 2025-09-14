import { scanDocument } from "./utils.js"

(async () => {
    await scanDocument()
    await new Promise((resolve) => {
        const container = document.querySelector("#page-container")
        if (!container) return resolve();
        if (container.scrollTop === 0) return resolve()

        const onScroll = () => {
            if (container.scrollTop === 0) {
                container.removeEventListener("scroll", onScroll);
                resolve();
            }
        }
        container.addEventListener("scroll", onScroll);

        container.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    })
    window.print()
})()