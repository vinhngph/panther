document.getElementById("btn-refesh").addEventListener("click", async () => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab && !tab.url) return;

        const url = new URL(tab.url);
        const domain = url.hostname;

        const allowedDomains = ["www.studocu.com", "www.studocu.vn"];
        if (!allowedDomains.includes(domain)) return;

        if (deleteDomainCookies(domain)) {
            document.getElementById("output").textContent = "Successful";

            chrome.tabs.reload(tab.id, { bypassCache: true });
        } else {
            document.getElementById("output").textContent = "Error";
        }
    } catch (error) {
        console.error(error);
    }
})

document.getElementById("btn-download").addEventListener("click", async () => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab && !tab.url) return;

        const url = new URL(tab.url);
        const domain = url.hostname;

        const allowedDomains = ["www.studocu.com", "www.studocu.vn"];
        if (!allowedDomains.includes(domain)) return;

        chrome.runtime.sendMessage({ action: "download_content", tab })
    } catch (error) {
        console.error(error);
    }
})

async function deleteDomainCookies(domain) {
    try {
        const cookies = await chrome.cookies.getAll({ domain });

        if (cookies.length === 0) return null;

        let pending = cookies.map((cookie) => {
            chrome.cookies.remove({
                url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
                name: cookie.name,
                storeId: cookie.storeId
            })
        })
        await Promise.all(pending);
    } catch (error) {
        console.error(error);
    }
}