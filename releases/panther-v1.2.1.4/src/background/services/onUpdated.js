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
            });

            chrome.scripting.executeScript({
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
    ];

    btns.forEach((btn) => {
        if (!btn) return;
        btn.onclick = null;
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();

            // Execute this function
            (async function () {
                // ----------------------------------------------------------
                // Clone this document
                // ----------------------------------------------------------
                const cloneDoc = () => {
                    const doc = document.getElementById("page-container-wrapper")?.cloneNode(true);
                    if (!doc) {
                        alert("Error: Clone document");
                        return;
                    }

                    // Data processing
                    doc.style = null;
                    doc.querySelectorAll('[class*="banner-wrapper"]').forEach(e => {
                        if (!e) return;
                        e.remove();
                    });
                    doc.childNodes[0].childNodes.forEach((e) => {
                        e.childNodes[0].style = "display: block";
                    });

                    return doc;
                }
                // ----------------------------------------------------------


                // ----------------------------------------------------------
                // Print configurations
                // ----------------------------------------------------------
                const printConfig = () => {
                    // Get document size
                    const docSize = document.getElementById("page-container-wrapper")?.childNodes[0].childNodes[0];
                    if (!docSize) return;

                    // Convert px to mm
                    const pxToMm = (px) => {
                        const div = document.createElement("div");
                        div.style.width = "100mm";
                        div.style.position = "absolute";
                        div.style.visibility = "hidden";
                        document.body.appendChild(div);

                        const mmPerPx = 100 / div.getBoundingClientRect().width;
                        document.body.removeChild(div);

                        return px * mmPerPx;
                    }

                    // portrait: true | landscape: false
                    const docStruct = docSize.clientWidth < docSize.clientHeight ? "portrait" : "landscape";

                    const docScale = [];
                    if (docStruct == "portrait") {
                        docScale.push(210 / pxToMm(docSize.clientWidth));
                        docScale.push(297 / pxToMm(docSize.clientHeight));
                    } else {
                        docScale.push(297 / pxToMm(docSize.clientWidth));
                        docScale.push(210 / pxToMm(docSize.clientHeight));
                    }


                    const css = document.createElement("style");
                    css.innerText = `@media print { @page { size: A4 ${docStruct}; margin: 0; } #page-container { transform: scale(${docScale[0]}, ${docScale[1]}); transform-origin: top left; }}`;
                    return css;
                }
                // ----------------------------------------------------------


                // ----------------------------------------------------------
                // Get current position
                const getCurrentPosition = () => {
                    return document.getElementById("document-wrapper")?.scrollTop;
                }
                // ----------------------------------------------------------

                // ----------------------------------------------------------
                // Scan document
                // ----------------------------------------------------------
                const scanDoc = async () => {
                    const pageContainer = document.getElementById("page-container");
                    if (!pageContainer) {
                        alert("Page container element not found");
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
                            alert("Error processing element:", error);
                            return;
                        }
                    }
                }
                // ----------------------------------------------------------

                // ----------------------------------------------------------
                // Countdown
                // ----------------------------------------------------------
                const countdownNotification = async (doc, message) => {
                    const notification = doc.createElement('div');

                    // Styling
                    Object.assign(notification.style, {
                        fontFamily: "sans-serif",
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        backgroundColor: '#FF5722',
                        color: 'white',
                        padding: '15px',
                        borderRadius: '5px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                        opacity: '0',
                        transition: 'opacity 0.5s ease',
                        fontSize: '20px',
                        zIndex: '9999'
                    });

                    let countdown = 5;
                    notification.textContent = `${message} in ${countdown}...`;

                    doc.body.appendChild(notification);
                    setTimeout(() => notification.style.opacity = '1', 10);

                    await new Promise((resolve) => {
                        const interval = setInterval(() => {
                            countdown--;
                            notification.textContent = `${message} in ${countdown}...`;
                            if (countdown <= 0) {
                                clearInterval(interval);
                                notification.remove();
                                resolve();
                            }
                        }, 1000);
                    });
                }
                // ----------------------------------------------------------

                // ----------------------------------------------------------
                // Check document is loaded or not
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
                // ----------------------------------------------------------

                // ----------------------------------------------------------
                // Scroll to specific position
                // ----------------------------------------------------------
                const scrollToPosition = async (position) => {
                    return new Promise((resolve) => {
                        const documentWrapper = document.getElementById("document-wrapper");

                        const onScroll = () => {
                            if (documentWrapper.scrollTop === position) {
                                documentWrapper.removeEventListener("scroll", onScroll);

                                resolve();
                            }
                        }

                        documentWrapper.scrollTo({
                            top: position,
                            behavior: "smooth"
                        });

                        documentWrapper.addEventListener("scroll", onScroll);
                    })
                }
                // ----------------------------------------------------------

                // ----------------------------------------------------------
                // Generate document
                // ----------------------------------------------------------
                const genDoc = async () => {
                    const docStyles = document.querySelector('link[rel="stylesheet"][href*="doc-assets"][href*=".studocu.com"]').cloneNode(true);

                    const newWindow = window.open("");
                    newWindow.document.title = document.title;
                    newWindow.document.head.appendChild(docStyles);
                    newWindow.document.head.appendChild(printConfig());
                    newWindow.document.body.appendChild(cloneDoc());

                    await countdownNotification(newWindow.document, "Download");
                    newWindow.print();
                }
                // ----------------------------------------------------------



                // ----------------------------------------------------------
                // Main processing
                // ----------------------------------------------------------
                // Valid this document is clean.
                // ----------------------------------------------------------
                if (!!document.querySelectorAll(`button[data-test-selector="preview-banner-upgrade-second-cta"]`).length) {
                    if (confirm(`Advertisement banners are detected in this document.\nClick "OK" to remove them and refresh the page.\nClick "Cancel" if you believe all banners have been removed.`)) {
                        location.reload();
                        return;
                    }
                }

                if (!checkContent()) {
                    // If document is not loaded yet
                    const currentPosition = getCurrentPosition();
                    await scanDoc();
                    await countdownNotification(document, "Open document");
                    await scrollToPosition(currentPosition);
                }
                return genDoc()
                // ----------------------------------------------------------
            })();
        }, true)
    });
}