chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        if (!tab.url.includes("www.studocu.")) return;

        await chrome.scripting.executeScript(
            {
                target: { tabId },
                func: () => {
                    const btn = document.querySelector("#viewer-wrapper > div > div > div:nth-child(1) > div:nth-child(1) > button");
                    btn.onclick = null;
                    btn.addEventListener("click", (e) => {
                        e.stopPropagation();

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
                    }, true)
                }
            }
        )
    }
})