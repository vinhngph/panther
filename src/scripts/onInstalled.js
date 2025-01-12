const sd_docs = () => {
    const urls = [
        "https://www.studocu.vn",
        "https://www.studocu.com"
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

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install" || details.reason === "update") {
        sd_docs();
    }
});