document.querySelector("button.btn-outline-secondary").addEventListener("click", (e) => {
    e.preventDefault()
    window.parent.postMessage({ type: "cancelled" }, "*")
})

document.querySelector("button.btn-outline-info").addEventListener("click", (e) => {
    e.preventDefault()

    const select = document.querySelector("#paper-size").value
    window.parent.postMessage({ type: "confirmed", value: select }, "*")
})