function getBaseDomain(hostname) {
    const parts = hostname.split('.');

    if (parts.length <= 2) {
        return hostname;
    }

    const topLevelDomain = parts.slice(-2).join('.');
    return topLevelDomain;
}

function generateDocument() {
    function docView() {
        const head = document.querySelector('link[rel="stylesheet"][href*="doc-assets.studocu.com"]').outerHTML;
        const tit = document.getElementsByTagName("h1")[0].innerHTML;

        let content = document.getElementById('page-container');
        content.querySelectorAll('[class*="banner-wrapper"]').forEach(element => {
            element.remove();
        })
        let pages = content.childNodes;

        for (i = 0; i < pages.length; i++) {
            pages[i].childNodes[0].style = "display: block;";
        }

        const pdf = pages[0].parentNode.parentNode.parentNode.innerHTML;

        const width = pages[0].offsetWidth;
        const height = pages[0].offsetHeight;

        if (width > height) {
            print_opt = "{@page { size: A5 landscape; margin: 0; }}";
        } else {
            print_opt = "{@page { size: A5 portrait; margin: 0; }}";
        }

        let newWindow = window.open("", "_blank");
        newWindow.document.getElementsByTagName("head")[0].innerHTML = head + "<style> .nofilter{filter: none !important;} </style>" + "<style> @media print " + print_opt + "</style>";
        newWindow.document.title = tit;
        newWindow.document.getElementsByTagName("body")[0].innerHTML = pdf;
        newWindow.document.getElementsByTagName("body")[0].childNodes[0].style = "";
        newWindow.document.close();

        setTimeout(() => {
            const e = newWindow.document.getElementById("page-container");
            if (e) {
                e.scrollTo({
                    top: e.scrollHeight,
                    behavior: "smooth",
                });
            }

            setTimeout(() => {
                newWindow.print();
            }, 1500);
        }, 1000);
    }

    const documentWrapper = document.getElementById("document-wrapper");
    if (documentWrapper) {
        documentWrapper.scrollTo({
            top: documentWrapper.scrollHeight,
            behavior: "smooth",
        });
    }

    setTimeout(function () {
        docView();
    }, 5000);
}

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

document.getElementById("btn-refresh").addEventListener("click", async () => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab && !tab.url) return;

        const url = new URL(tab.url);
        const domain = getBaseDomain(url.hostname);

        const allowedDomains = ["studocu.com", "studocu.vn"];
        if (!allowedDomains.includes(domain)) return;

        chrome.scripting.executeScript(
            {
                target: { tabId: tab.id },
                func: () => !!document.querySelector("._95f5f1767857")
            },
            (results) => {
                const flag = results[0]?.result;
                if (flag) {
                    if (deleteDomainCookies(domain)) {
                        setTimeout(() => {
                            chrome.tabs.reload(tab.id);
                        }, 1000);
                    } else {
                        alert("There are some errors!");
                    }
                } else {
                    alert("Nothing to clear!");
                }
            }
        )
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

        chrome.scripting.executeScript(
            {
                target: { tabId: tab.id },
                func: () => !!document.querySelector("._95f5f1767857")
            },
            (results) => {
                const flag = results[0]?.result;
                if (flag) {
                    alert("Please use \"Refresh\" function to clear all banners!");
                } else {
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: generateDocument
                    })
                }
            }
        )
    } catch (error) {
        console.error(error);
    }
})