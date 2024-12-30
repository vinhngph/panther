chrome.runtime.onMessage.addListener((request, sender, response) => {
    if (request.action === "download_content") {
        chrome.scripting.executeScript({
            target: { tabId: request.tab.id },
            func: () => {
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
                        newWindow.print();
                    }, 1500);
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
        })
    }
})