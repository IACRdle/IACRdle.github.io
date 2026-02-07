function addSearchStrings() {
  for (let i = 0; i < papers.length; i++) {
    papers[i].searchstring = (papers[i].title + papers[i].authors.join(" ")).toLocaleLowerCase("en-US");
  }
}
addSearchStrings();

var dropdown_list = [];
var selected_list = [];
var target;

function seedFromDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const dateString = d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  let hash = 2166136261;
  for (let i = 0; i < dateString.length; i++) {
    hash ^= dateString.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;

  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

var DayRng = mulberry32(seedFromDate(new Date()));

function getRandomInt(max) {
  return Math.floor(DayRng * max);
}

function parsePub(pub) {
  var parsed = {};
  //console.log(JSON.stringify(pub));
  if (pub.pub !== undefined) parsed.id = pub.pub.value;
  if (pub.year !== undefined) parsed.year = parseInt(pub.year.value);
  if (pub.conference !== undefined) parsed.conference = pub.conference.value;
  if (pub.title !== undefined) parsed.title = pub.title.value;
  if (pub.authors !== undefined) parsed.authors = pub.authors.value;
  parsed.citation = 0;//TODO
  return parsed;
}

function getTarget() {
  function selectTarget(paper) {
    return paper.authors.includes("Yuval Ishai");
  }
  const filtered_papers = papers.filter(selectTarget);
  return filtered_papers[getRandomInt(filtered_papers.length)];
}

async function getCitationNumber(pubID) {
  return 0;
}

function printTarget() {
  target = getTarget();
  //document.getElementById("target").innerText = JSON.stringify(target);
  console.log(target);
}

function select(item) {
  const data = JSON.parse(item.dataset.publication);
  selected_list.push(data);
  const guesses = document.getElementById("guesses");
  const guess = document.createElement("div");
  guess.classList.add("guess")

  const title_div = document.createElement("div");
  title_div.innerText = data.title;
  if (data.title == target.title) {
    title_div.classList.add("success");
  }
  guess.appendChild(title_div);

  const authors_div = document.createElement("div");
  authors_div.innerText = data.authors.join(", ");
  if (data.authors == target.authors) {
    authors_div.classList.add("success");
  } else {
    authors_div.classList.add("fail");
    var set_authors = new Set(data.authors);
    target.authors.forEach(author => {
      if (set_authors.has(author)) {
        authors_div.classList.remove("fail");
        authors_div.classList.add("closeHit");
      }
    });
  }
  guess.appendChild(authors_div);

  const conference_div = document.createElement("div");
  conference_div.innerText = data.conf;
  if (data.conf == target.conf) {
    conference_div.classList.add("success");
  } else {
    conference_div.classList.add("fail");
  }
  guess.appendChild(conference_div);

  const year_div = document.createElement("div");
  year_div.innerText = data.year;
  if (data.year == target.year) {
    year_div.classList.add("success");
  } else {
    if (Math.abs(data.year - target.year) <= 5) {
      year_div.classList.add("closeHit");
    } else {
      year_div.classList.add("fail");
    }

    if (data.year - target.year < 0) {
      year_div.innerText += "⬆️";
    } else {
      year_div.innerText += "⬇️";
    }
  }
  guess.appendChild(year_div);

  guesses.appendChild(guess);
  //console.log(data);
}


function search({ h = 10 } = {}) {
  const search_bar_content = document.getElementById("search_bar").value;
  const search_words = search_bar_content.split(" ").filter((word) => word.length > 0);
  //console.log(search_words);

  function paper_contains(paper) {
    for (let index = 0; index < search_words.length; index++) {
      const word = search_words[index];
      
      if (!paper.searchstring.includes(word)) {
        //console.log(paper.title.toLowerCase(), word);
        return false;
      }
    }
    return true;
  }

  const found_papers = papers.filter(paper_contains);

  const dropdown_div = document.getElementById("dropdown");
  var inner = "";
  found_papers.slice(0,10).forEach(search_response => {
    inner += "<div class='dropdownChoice' data-publication='" + JSON.stringify(search_response) + "'>" + search_response.title + "</div>";
  });
  dropdown_div.innerHTML = inner;
  for (const child of dropdown_div.children) {
    child.addEventListener("click", () => select(child));
    child.classList.add("selectionOption");
  }
}
