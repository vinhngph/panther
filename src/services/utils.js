const waitContent = async (element) => {
    const imgs = Array.from(element.querySelectorAll("img"))
    const imgPromises = imgs.map(img => {
        if (img.complete) return Promise.resolve();

        return new Promise(resolve => {
            const done = () => {
                img.removeEventListener("load", done);
                img.removeEventListener("error", done);
                resolve()
            }
            img.addEventListener("load", done, { once: true })
            img.addEventListener("error", done, { once: true })
        });
    })

    await Promise.all([...imgPromises])
    await new Promise(requestAnimationFrame)
}

export async function scanDocument() {
    const pageContainer = document.getElementById("page-container");
    if (!pageContainer) {
        alert("Page container element not found");
        return;
    }

    const elements = Array.from(pageContainer.childNodes);
    const progress = progressNotification(elements.length)

    for (let i = 0; i < elements.length; i++) {
        try {
            elements[i].scrollIntoView({
                behavior: "instant",
                block: "start",
            });
            progress.setProgress(i + 1)
            await waitContent(elements[i]);
        } catch (error) {
            alert("Error processing element:", error);
            return;
        }
    }
}

const getCurrentPosition = () => {
    return window.scrollY;
}

const progressNotification = (total) => {
    const notification = document.createElement('div');
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
        opacity: '1',
        transition: 'opacity 0.5s ease',
        fontSize: '20px',
        zIndex: '9999'
    });
    document.body.appendChild(notification)

    return {
        setProgress: (current) => {
            if (current === total) return notification.remove()
            notification.textContent = `Scanning: ${current}/${total}`;
        }
    }
}

const checkContent = () => {
    let a = [];
    const pageContainer = document.getElementById("page-container")?.childNodes;
    for (const e of pageContainer) {
        if (e?.childNodes[0]?.childNodes[0]?.className === "page-content" && e?.childNodes[0]?.childNodes[0]?.childNodes.length !== 2) {
            a.push(e);
        }
    }
    if (a.length === 0) return true;
    return false;
}

const scrollToPosition = async (position) => {
    return new Promise((resolve) => {
        const onScroll = () => {
            if (window.scrollY === position) {
                window.removeEventListener("scroll", onScroll);

                resolve();
            }
        }

        window.scrollTo({
            top: position,
            behavior: "smooth"
        });

        window.addEventListener("scroll", onScroll);
    })
}

const genDoc = async (paperSize) => {
    const docStyles = (
        document.querySelector('link[rel="stylesheet"][href*="doc-assets"][href*=".studocu.com"]') ||
        document.querySelector('link[as="style"][href*="doc-assets"][href*=".studocu.com"]')
    )?.cloneNode(true);

    const newWindow = window.open("");
    newWindow.document.title = document.title;
    newWindow.document.head.appendChild(docStyles);
    newWindow.document.head.appendChild(printConfig(paperSize));
    newWindow.document.body.appendChild(cloneDoc());

    const script = newWindow.document.createElement("script")
    script.src = chrome.runtime.getURL("src/bundle/viewer.bundle.js")
    newWindow.document.body.appendChild(script)
}


const isClear = () => {
    let preBtns = document.querySelectorAll("button")

    let matched = Array.from(preBtns).filter(btn => {
        return Array.from(btn.classList).some(c => c.startsWith("PremiumBannerButton"))
    })

    return matched.length === 0
}

const printConfig = (paperSize) => {
    // Get document size
    const docSize = document.getElementById("page-container-wrapper")?.childNodes[0]?.childNodes[1]?.childNodes[0];
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
    // Convert mm to px
    const mmToPx = (mm) => {
        const div = document.createElement("div");
        div.style.width = "100mm";
        div.style.position = "absolute";
        div.style.visibility = "hidden";
        document.body.appendChild(div);

        const pxPer100Mm = div.getBoundingClientRect().width;
        const pxPerMm = pxPer100Mm / 100;

        document.body.removeChild(div);

        return mm * pxPerMm;
    };

    const docWidth = pxToMm(docSize.clientWidth);
    const docHeight = pxToMm(docSize.clientHeight);

    // portrait: true | landscape: false
    const docStruct = docWidth < docHeight ? "portrait" : "landscape";

    const parsePaperSize = (paperSize) => {
        const values = paperSize.split(".")
        if (values.length === 5) {
            return [values[0], Number(values[1] + "." + values[2]), Number(values[3] + "." + values[4])]
        }
        if (values.length === 3) {
            return [values[0], Number(values[1]), Number(values[2])]
        }
        return null
    }

    const [sizeIndex, sizeX, sizeY] = parsePaperSize(paperSize)

    let docScale;
    let translateX;
    let translateY;

    if (docStruct == "portrait") {
        docScale = Math.min(sizeX / docWidth, sizeY / docHeight);
        translateX = mmToPx((sizeX - (docWidth * docScale)) / 2);
        translateY = mmToPx((sizeY - (docHeight * docScale)) / 2);
    } else {
        docScale = Math.min(sizeY / docWidth, sizeX / docHeight);
        translateX = mmToPx((sizeY - (docWidth * docScale)) / 2);
        translateY = mmToPx((sizeX - (docHeight * docScale)) / 2);
    }

    const css = document.createElement("style");
    css.innerText = `@media print { @page { size: ${sizeIndex} ${docStruct}; margin: 0; } #page-container { transform: scale(${docScale}) translate(${translateX}px, ${translateY}px); transform-origin: top left; }}`;
    return css;
}

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
        if (e.childNodes.length == 2) {
            e.childNodes[1].style = "display: block";
            e.childNodes[1].childNodes[0].style = "display: block";
            return;
        }
        e.childNodes[0].style = "display: block";
        e.childNodes[0].childNodes[0].style = "display: block;";
    });

    return doc;
}

const choosePaperSize = async () => {
    return new Promise((resolve) => {
        const container = document.createElement("iframe")
        container.src = chrome.runtime.getURL("src/assets/modals/papersize.html")
        container.style.position = "fixed";
        container.style.top = "0";
        container.style.left = "0";
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.pointerEvents = "auto"
        container.style.zIndex = "9999"
        container.style.opacity = "0"
        container.style.transition = "opacity 0.3s ease"

        document.body.appendChild(container)
        requestAnimationFrame(() => {
            container.style.opacity = "1"
        })

        function handler(event) {
            if (event.source !== container.contentWindow) return
            if (event.data?.type === "cancelled") {
                cleanup()
                resolve(null)
            }
            if (event.data?.type === "confirmed") {
                cleanup()
                resolve(event.data.value)
            }
        }

        function cleanup() {
            window.removeEventListener("message", handler)
            container.remove()
        }

        window.addEventListener("message", handler)
    })
}

export async function processDocument() {
    if (!isClear()) {
        if (confirm(`Advertisement banners are detected in this document.\nClick "OK" to remove them and refresh the page.\nClick "Cancel" if you believe all banners have been removed.`)) {
            return location.reload();
        }
    }

    const paperSize = await choosePaperSize()
    if (!paperSize) return

    if (!checkContent()) {
        // If document is not loaded yet
        const currentPosition = getCurrentPosition();
        await scanDocument();
        await scrollToPosition(currentPosition);
    }

    return genDoc(paperSize)
}