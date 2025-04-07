chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install" || details.reason === "update") {
        const urls = [
            "https://www.studocu.com",
            "https://www.studeersnel.nl",
            "https://www.studocu.id",
            "https://www.studocu.vn"
        ];

        urls.forEach((url) => {
            chrome.cookies.get({ name: "sd_docs", url }, (cookie) => {
                if (!cookie) return;

                chrome.cookies.remove({
                    url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
                    name: cookie.name,
                    storeId: cookie.storeId
                });
            });
        });
    }
});