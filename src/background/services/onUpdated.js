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
                files: ["src/bundle/download.bundle.js"]
            });

            setTimeout(() => {
                processedTabs.delete(tabId);
            }, 1000);
        }
    }
});