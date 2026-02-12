document.getElementById("search_bar").addEventListener('input', search);
const tip_element = document.getElementById("tip");
tip_element.innerText = "Today's paper was coauthored by " + todays_author;