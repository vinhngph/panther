async function genDoc() {
    if (!document.querySelector("._95f5f1767857")) {
        const genPDF = () => {
            const docSize = document.getElementById("page-container-wrapper")?.childNodes[0].childNodes[0];
            if (!docSize) return;

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

            const printConfig = (width, height) => {
                width = pxToMm(width);
                height = pxToMm(height);

                if (width < height) {
                    const scaleX = 210 / width;
                    const scaleY = 297 / height;

                    return `{
                        @page { 
                            size: A4 portrait; margin: 0; 
                        }
                        #page-container {
                            transform: scale(${scaleX}, ${scaleY});
                            transform-origin: top left;
                        }
                    }`
                } else {
                    const scaleX = 297 / width;
                    const scaleY = 210 / height;

                    return `{
                        @page { 
                            size: A4 landscape; margin: 0; 
                        }
                        #page-container {
                            transform: scale(${scaleX}, ${scaleY});
                            transform-origin: top left;
                        }
                    }`
                }
            }

            const print_opt = printConfig(docSize.clientWidth, docSize.clientHeight);

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

            const newWindow = window.open("");
            newWindow.document.head.innerHTML = docHead;
            newWindow.document.title = docTitle;
            newWindow.document.body.innerHTML = docBody;

            async function download_count_down(newWindow) {
                const notification = newWindow.document.createElement('div');
                Object.assign(notification.style, {
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
                notification.textContent = `Download in ${countdown}...`;
                newWindow.document.body.appendChild(notification);
                newWindow.setTimeout(() => notification.style.opacity = '1', 10);

                await new Promise((resolve) => {
                    const interval = newWindow.setInterval(() => {
                        countdown--;
                        notification.textContent = `Download in ${countdown}...`;
                        if (countdown <= 0) {
                            newWindow.clearInterval(interval);
                            notification.style.opacity = '0';
                            notification.remove();
                            resolve();
                        }
                    }, 1000);
                });

                newWindow.print();
            }
            download_count_down(newWindow);
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

            async function countdownAndScroll(doc, currentPosition) {
                const notification = document.createElement('div');
                Object.assign(notification.style, {
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
                notification.textContent = `Open document in ${countdown}...`;
                document.body.appendChild(notification);
                setTimeout(() => notification.style.opacity = '1', 10);

                await new Promise((resolve) => {
                    const interval = setInterval(() => {
                        countdown--;
                        notification.textContent = `Open document in ${countdown}...`;
                        if (countdown <= 0) {
                            clearInterval(interval);
                            notification.style.opacity = '0';
                            setTimeout(() => notification.remove(), 500);
                            resolve();
                        }
                    }, 1000);
                });

                doc.scrollTo({
                    top: currentPosition,
                    behavior: "smooth"
                });

                genPDF();
            }

            countdownAndScroll(doc, currentPosition);
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