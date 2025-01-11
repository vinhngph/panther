function generateDocument() {
    function docView() {
        const head = document.querySelector('link[rel="stylesheet"][href*="doc-assets"][href*=".studocu.com"]').outerHTML;
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

        const print_opt = pages[0].offsetWidth > pages[0].offsetHeight ? "{@page { size: A5 landscape; margin: 0; }}" : "{@page { size: A5 portrait; margin: 0; }}"

        let newWindow = window.open("", "_blank");
        newWindow.document.getElementsByTagName("head")[0].innerHTML = `<meta charset="UTF-8">` + `<meta name="viewport" content="width=device-width, initial-scale=1.0">` + head + "<style> @media print " + print_opt + "</style>";
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
                    alert("Please reload this page to clear all banners!");
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