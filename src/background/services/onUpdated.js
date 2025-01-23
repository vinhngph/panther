const processedTabs = new Set();

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        const url = new URL(tab.url);
        const domain = url.hostname;

        const allowedDomains = [
            "www.studocu.com",
            "www.studeersnel.nl",
            "www.studocu.id",
            "www.studocu.vn"
        ];
        if (!allowedDomains.includes(domain)) return;

        if (!processedTabs.has(tabId)) {
            processedTabs.add(tabId);


            const origin = url.origin;
            chrome.cookies.get({ name: "sd_docs", url: origin }, (cookie) => {
                if (!cookie) return;

                chrome.cookies.remove({
                    url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
                    name: cookie.name,
                    storeId: cookie.storeId
                })
            })
            await chrome.scripting.executeScript({
                target: { tabId },
                func: main
            });


            setTimeout(() => {
                processedTabs.delete(tabId);
            }, 1000);
        }
    }
});

const main = async () => {
    const btns = [
        document.querySelector("#viewer-wrapper > div > div > div:nth-child(1) > div:nth-child(1) > button"),
        document.querySelector("#viewer-wrapper > div > div > section:nth-child(2) > div > div > div:nth-child(1) > div:nth-child(2) > button")
    ]

    btns.forEach((btn) => {
        if (!btn) return;
        btn.onclick = null;
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();

            genDoc();
        }, true)
    })

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
                const pageContainer = document.getElementById("page-container");

                if (!pageContainer) {
                    throw new Error("Page container element not found");
                }

                const elements = Array.from(pageContainer.childNodes);

                const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

                for (const element of elements) {
                    try {
                        const content = element.childNodes[0];
                        if (content?.className === "page-content" && content.childNodes.length !== 2) {
                            element.scrollIntoView({
                                behavior: "smooth",
                                block: "start"
                            });

                            let attempts = 0;
                            const maxAttempts = 10;

                            while (content.childNodes.length !== 2 && attempts < maxAttempts) {
                                await wait(500);
                                attempts++;
                            }

                            if (attempts >= maxAttempts) {
                                console.warn("Content loading timeout");
                            }
                        }
                    } catch (error) {
                        console.error("Error processing element:", error);
                    }
                }
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
                genPDF();
            } else {
                if (!confirm(`May I scan this document to download it?\n*Please choose option "Save as PDF" to ensure the content is properly formatted.`)) return;

                const doc = document.getElementById("document-wrapper");
                if (!doc) return;
                const currentPosition = doc.scrollTop;

                try {
                    await loadContent();
                    doc.scrollTo({
                        top: currentPosition,
                        behavior: "smooth"
                    })
                    genDoc();
                } catch (error) {
                    alert("Failed to load content");
                }
            }
        } else {
            return alert("Please reload this page to clear all banners!");
        }
    }
}