const scanDocument = async () => {
    const pageContainer = document.getElementById("page-container");
    if (!pageContainer) {
        alert("Page container element not found");
        return;
    }

    const elements = Array.from(pageContainer.childNodes);
    for (const element of elements) {
        try {
            const content = element.childNodes[0]?.childNodes[0];
            element.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });

            await waitContent(content);
        } catch (error) {
            alert("Error processing element:", error);
            return;
        }
    }
}

const getCurrentPosition = () => {
    return window.scrollY;
}

const waitContent = async (element) => {
    const imgs = Array.from(element.querySelectorAll("img"))
    const imgPromises = imgs.map(img => {
        if (img.complete) return Promise.resolve();

        return new Promise(resolve => img.addEventListener("load", resolve));
    })

    await Promise.all([...imgPromises])
    await new Promise(requestAnimationFrame)
}

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

const genDoc = async () => {
    const docStyles = (
        document.querySelector('link[rel="stylesheet"][href*="doc-assets"][href*=".studocu.com"]') ||
        document.querySelector('link[as="style"][href*="doc-assets"][href*=".studocu.com"]')
    )?.cloneNode(true);

    const newWindow = window.open("");
    newWindow.document.title = document.title;
    newWindow.document.head.appendChild(docStyles);
    newWindow.document.head.appendChild(printConfig());
    newWindow.document.body.appendChild(cloneDoc());

    await countdownNotification(newWindow.document, "Download");
    newWindow.print();
}


const isClear = () => {
    let preBtns = document.querySelectorAll("button")

    let matched = Array.from(preBtns).filter(btn => {
        return Array.from(btn.classList).some(c => c.startsWith("PremiumBannerButton"))
    })

    return matched.length === 0
}

const printConfig = () => {
    // Get document size
    const docSize = document.getElementById("page-container-wrapper")?.childNodes[0]?.childNodes[0]?.childNodes[0];
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

    let docScale;
    let translateX;
    let translateY;

    if (docStruct == "portrait") {
        docScale = Math.min(210 / docWidth, 297 / docHeight);
        translateX = mmToPx((210 - (docWidth * docScale)) / 2);
        translateY = mmToPx((297 - (docHeight * docScale)) / 2);
    } else {
        docScale = Math.min(297 / docWidth, 210 / docHeight);
        translateX = mmToPx((297 - (docWidth * docScale)) / 2);
        translateY = mmToPx((210 - (docHeight * docScale)) / 2);
    }


    const css = document.createElement("style");
    css.innerText = `@media print { @page { size: A4 ${docStruct}; margin: 0; } #page-container { transform: scale(${docScale}) translate(${translateX}px, ${translateY}px); transform-origin: top left; }}`;
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
        e.childNodes[0].style = "display: block";
        e.childNodes[0].childNodes[0].style = "display: block;";
    });

    return doc;
}

export async function processDocument() {
    if (!isClear()) {
        if (confirm(`Advertisement banners are detected in this document.\nClick "OK" to remove them and refresh the page.\nClick "Cancel" if you believe all banners have been removed.`)) {
            return location.reload();
        }
    }

    if (!checkContent()) {
        // If document is not loaded yet
        const currentPosition = getCurrentPosition();
        await scanDocument();
        await scrollToPosition(currentPosition);
    }
    return genDoc()
}