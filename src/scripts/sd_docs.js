chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        if (!tab.url.includes("www.studocu.")) return;

        const origin = new URL(tab.url).origin;

        chrome.cookies.get({ name: "sd_docs", url: origin }, (cookie) => {
            if (!cookie) return;

            chrome.cookies.remove({
                url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
                name: cookie.name,
                storeId: cookie.storeId
            })
        })
    }
})