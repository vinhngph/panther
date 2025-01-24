async function genDoc() {
    if (!document.querySelector("._95f5f1767857")) {
        const genPDF = () => {
            const docSize = document.getElementById("page-container-wrapper")?.childNodes[0].childNodes[0];
            if (!docSize) return;

            const print_opt = docSize.offsetWidth > docSize.offsetHeight ? "{@page { size: A5 landscape; margin: 0; }}" : "{@page { size: A5 portrait; margin: 0; }}"

            const docStyles = document.querySelector('link[rel="stylesheet"][href*="doc-assets"][href*=".studocu.com"]').outerHTML;

            const doc = document.getElementById("page-container-wrapper")?.cloneNode(true);
            if (!doc) return;
            doc.style = null;
            doc.querySelectorAll('[class*="banner-wrapper"]').forEach(element => {
                if (!element) return;
                element.remove();
            })
            doc.childNodes[0].childNodes.forEach((element) => {
                element.childNodes[0].style = "display: block";
            })

            const docHead = docStyles + "<style> @media print " + print_opt + "</style>";
            const docTitle = document.title;
            const docBody = doc.outerHTML;
            const docHTML = `<!DOCTYPE html><html lang="en"><title>${docTitle}</title>${docHead}</head><body>${docBody}</body></html>`

            const hideFrame = document.createElement("iframe");
            hideFrame.style.display = "none";
            hideFrame.onload = () => {
                const closePrint = () => {
                    document.body.removeChild(hideFrame);
                }
                hideFrame.contentWindow.onbeforeunload = closePrint;
                hideFrame.contentWindow.onafterprint = closePrint;
                hideFrame.contentWindow.print();
            };
            hideFrame.srcdoc = docHTML;
            document.body.appendChild(hideFrame);
        }

        const loadContent = async () => {
            const doc = document.getElementById("document-wrapper");
            if (!doc) return;
            const currentPosition = doc.scrollTop;

            const pageContainer = document.getElementById("page-container");

            if (!pageContainer) {
                console.error("Page container element not found");
                return;
            }

            const elements = Array.from(pageContainer.childNodes);
            for (const element of elements) {
                try {
                    const content = element.childNodes[0];
                    if (content?.className === "page-content" && content.childNodes.length !== 2) {
                        element.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                        });

                        await new Promise((resolve) => {
                            const observer = new MutationObserver((mutations, observerInstance) => {
                                if (content.childNodes.length === 2 && content.childNodes[0].childNodes.length > 0) {
                                    observerInstance.disconnect();
                                    resolve();
                                }
                            });
                            observer.observe(content, { childList: true, subtree: true });
                        });
                    }
                } catch (error) {
                    console.error("Error processing element:", error);
                }
            }

            doc.scrollTo({
                top: currentPosition,
                behavior: "smooth"
            });
        };

        const checkContent = () => {
            let a = [];
            const pageContainer = document.getElementById("page-container").childNodes;
            for (const e of pageContainer) {
                if (e.childNodes[0].className === "page-content" && e.childNodes[0].childNodes.length !== 2) {
                    a.push(e);
                }
            }
            if (a.length === 0) return true;
            return false;
        }

        if (checkContent()) {
            return genPDF();
        } else {
            if (!confirm(`Would you like me to scan this document for download?\n\n*Please configure Destination to "Save as PDF" to ensure the content is formatted correctly.`)) return;

            try {
                await loadContent();

                return genDoc();
            } catch (error) {
                alert("Failed to load content");
            }
        }
    } else {
        return alert("Please reload this page to clear all banners!");
    }
}

document.getElementById("btn-download").addEventListener("click", async () => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab && !tab.url) return;

        const url = new URL(tab.url);
        const domain = url.hostname;

        const allowedDomains = [
            "www.studocu.com",
            "www.studeersnel.nl",
            "www.studocu.id",
            "www.studocu.vn"
        ];
        if (!allowedDomains.includes(domain)) return;

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: genDoc
        })
    } catch (error) {
        console.error(error);
    }
})