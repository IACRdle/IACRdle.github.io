function addSearchStrings() {
  for (let i = 0; i < papers.length; i++) {
    papers[i].searchstring = papers[i].title + " ";
    papers[i].searchstring += papers[i].authors.join(" ");
    for (let j = 0; j < papers[i].authors.length; j++) {
      papers[i].searchstring += " " + papers[i].authors[j].replace(/[áåàăâäÁÅ]/g, 'a').replace(/[úùûüÜ]/g, 'u').replace(/[éèëÉ]/g, 'e').replace(/[öÖóøØ]/g, 'o').replace(/[ïíî]/g, 'o').replace(/[çÇćč]/g, 'c').replace('ñ', 'n').replace('ß', 'ss').replace('ž', 'z').replace('š', 's').replace('ý', 'y').replace('æ', 'ae');
    }
    papers[i].searchstring = papers[i].searchstring.toLocaleLowerCase('en-US');
    //console.log(papers[i]);
  }
}
addSearchStrings();

var dropdown_list = [];
var selected_list = [];
var target;
var succeeded_today = false;

function seedFromDate(seed_string) {
  let hash = 2166136261;
  for (let i = 0; i < seed_string.length; i++) {
    hash ^= seed_string.charCodeAt(i);
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

function DayRng(nonce) {
  const d = new Date();
  const dateString = d.toISOString().slice(0, 10);
  return mulberry32(seedFromDate(dateString + nonce));
}
function getRandomInt(nonce, max) {
  return Math.floor(DayRng(nonce) * max);
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
todays_author = authors[getRandomInt("author", authors.length)]
function selectTarget(paper) {
  return paper.authors.includes(todays_author);
}
const filtered_papers = papers.filter(selectTarget);
todays_target_paper = filtered_papers[getRandomInt("paper", filtered_papers.length)];
console.log(todays_target_paper);


async function getCitationNumber(pubID) {
  return 0;
}

function select(item) {
  if (succeeded_today) {
    return;
  }
  const data = JSON.parse(item.dataset.publication);
  selected_list.push(data);
  const guesses = document.getElementById("guesses");
  const guess = document.createElement("div");
  guess.classList.add("guess")

  const title_div = document.createElement("div");
  const title_words = data.title.split(" ");
  const target_title_words = todays_target_paper.title.split(" ");
  for (let i = 0; i < title_words.length; i++) {
    const word = title_words[i];
    if (target_title_words[i] == word) {
      title_div.innerHTML += `<span class="success">${word}</span> `;
    } else if (target_title_words.includes(word)) {
      title_div.innerHTML += `<span class="closeHit">${word}</span> `;
    } else {
      title_div.innerHTML += `<span class="fail">${word}</span> `;
    }
  }
  if (data.title == todays_target_paper.title) {
    title_div.classList.add("success");
      succeeded_today = true;
  }
  guess.appendChild(title_div);

  const authors_div = document.createElement("div");
  authors_div.innerText = data.authors.join(", ");
  if (data.authors.join(", ") == todays_target_paper.authors.join(", ")) {
    authors_div.classList.add("success");
  } else {
    authors_div.classList.add("fail");
    var set_authors = new Set(data.authors);
    todays_target_paper.authors.forEach(author => {
      if (set_authors.has(author)) {
        authors_div.classList.remove("fail");
        authors_div.classList.add("closeHit");
      }
    });
  }
  guess.appendChild(authors_div);

  const conference_div = document.createElement("div");
  switch (data.conf) {
    case "C":
      conference_div.innerText = "Crypto";
      break;
    case "EC":
      conference_div.innerText = "Eurocrypt";
      break;
    case "AC":
      conference_div.innerText = "Asiacrypt";
      break;
    default:
      conference_div.innerText = data.conf;
  }

  if (data.conf == todays_target_paper.conf) {
    conference_div.classList.add("success");
  } else {
    conference_div.classList.add("fail");
  }
  guess.appendChild(conference_div);

  const year_div = document.createElement("div");
  year_div.innerText = data.year;
  if (data.year == todays_target_paper.year) {
    year_div.classList.add("success");
  } else {
    if (Math.abs(data.year - todays_target_paper.year) <= 5) {
      year_div.classList.add("closeHit");
    } else {
      year_div.classList.add("fail");
    }

    if (data.year - todays_target_paper.year < 0) {
      year_div.innerText += "⬆️";
    } else {
      year_div.innerText += "⬇️";
    }
  }
  guess.appendChild(year_div);

  guesses.appendChild(guess);

  if (succeeded_today) {
    const success_box = document.createElement("div");
    const copy_button = document.createElement("button");
    function copy() {
      navigator.clipboard.writeText(`🔥 I finished today's IACRdle in ${selected_list.length} guesses https://IACRdle.github.io`);
      copy_button.innerText = "Result saved to clipboard 📋"
    }
    copy_button.addEventListener("click", copy)
    copy_button.innerText = 'Share with a friend';
    

    success_box.appendChild(copy_button);
    guesses.appendChild(success_box);
  }
  //console.log(data);
}


function search({ h = 10 } = {}) {
  const search_bar_content = document.getElementById("search_bar").value.toLocaleLowerCase("en-US");
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
  found_papers.slice(0, 10).forEach(search_response => {
    inner += `<div class='dropdownChoice' data-publication='${JSON.stringify(search_response)}'>${search_response.title}</div>`;
  });
  dropdown_div.innerHTML = inner;
  for (const child of dropdown_div.children) {
    child.addEventListener("click", () => select(child));
    child.classList.add("selectionOption");
  }
}
