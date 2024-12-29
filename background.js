chrome.runtime.onMessage.addListener((request, sender, response) => {
    if (request.action === "download_content") {
        chrome.scripting.executeScript({
            target: { tabId: request.tab.id },
            func: () => {
                let head = document.querySelector('link[rel="stylesheet"][href*="doc-assets.studocu.com"]').outerHTML;
                let tit = document.getElementsByTagName("h1")[0].innerHTML;

                let content = document.getElementById('page-container');
                content.querySelectorAll('[class*="banner-wrapper"]').forEach(element => {
                    element.remove();
                })
                let pages = content.childNodes;

                const width = pages[0].offsetWidth;
                const height = pages[0].offsetHeight;

                if (width > height) {
                    print_opt = "{@page { size: A5 landscape; margin: 0; }}";
                } else {
                    print_opt = "{@page { size: A5 portrait; margin: 0; }}";
                }

                let pdf = pages[0].parentNode.parentNode.parentNode.innerHTML;

                newWindow = window.open("", "_blank");
                newWindow.document.getElementsByTagName("head")[0].innerHTML = head + "<style> .nofilter{filter: none !important;} </style>" + "<style> @media print " + print_opt + "</style>";
                newWindow.document.title = tit;
                newWindow.document.getElementsByTagName("body")[0].innerHTML = pdf;
                newWindow.document.getElementsByTagName("body")[0].childNodes[0].style = "";

                setTimeout(function () {
                    newWindow.print();
                }, 1000);
            }
        })
    }
})