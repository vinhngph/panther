chrome.webNavigation.onCompleted.addListener((details) => {
    const origin = new URL(details.url).origin;

    chrome.cookies.get({ name: "sd_docs", url: origin }, (cookie) => {
        if (!cookie) return;

        chrome.cookies.remove({
            url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
            name: cookie.name,
            storeId: cookie.storeId
        })
    })
}, { url: [{ hostEquals: "www.studocu.com", schemes: ["https"] }, { hostEquals: "www.studocu.vn", schemes: ["https"] }] })