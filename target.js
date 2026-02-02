printTarget();

document.querySelector("#search_bar").addEventListener("keypress",function(event) {
    if (event.key === "Enter") {
        search();
    }
})