const CONFERENCES_STRING = `VALUES (?conference ?stream) {
    ("CRYPTO" <https://dblp.org/streams/conf/crypto>)
    ("EUROCRYPT" <https://dblp.org/streams/conf/eurocrypt>)
	  ("TCC" <https://dblp.org/streams/conf/tcc>)
  }`

var dropdown_list = [];
var selected_list = [];
var target;

async function runQuery(query) {
  const endpoint = "https://sparql.dblp.org/sparql";

  const url =
    endpoint +
    "?query=" + encodeURIComponent(query) +
    "&format=application/sparql-results+json";

  const res = await fetch(url);
  const r = await res.json();
  //console.log(r);
  return r.results.bindings;
}

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

const DayRng = mulberry32(seedFromDate(new Date()));

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

async function getTarget() {

  const num_pub_query = `
PREFIX dblp: <https://dblp.org/rdf/schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT (COUNT(DISTINCT ?pub) AS ?count) WHERE {` + CONFERENCES_STRING +
    `  ?pub a dblp:Publication ;
       dblp:publishedInStream ?stream ;
       rdf:type <https://dblp.org/rdf/schema#Inproceedings> .
}`


  const data = await runQuery(num_pub_query);
  const num_pubs = parseInt(data[0].count.value);

  const rand_pub_index = getRandomInt(num_pubs);
  //console.log(rand_pub_index);
  const rand_pub_query = `
PREFIX dblp: <https://dblp.org/rdf/schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT ?pub ?conference ?year ?title (GROUP_CONCAT(?authorName; SEPARATOR=", ") AS ?authors) WHERE {` + CONFERENCES_STRING +
    `?pub a dblp:Publication ;
       dblp:title ?title;
       dblp:publishedInStream ?stream ;
       dblp:yearOfPublication ?year;
       rdf:type <https://dblp.org/rdf/schema#Inproceedings> ;
       dblp:authoredBy ?author .
       ?author rdfs:label ?authorName .
}
GROUP BY ?pub ?conference ?year ?title
ORDER BY ?pub 
LIMIT 1
OFFSET ` + rand_pub_index;
  const rand_pub = (await runQuery(rand_pub_query))[0];
  return (parsePub(rand_pub));
}

async function getCitationNumber(pubID) {
  return 0;
}

async function printTarget() {
  target = (await getTarget());
  //document.getElementById("target").innerText = JSON.stringify(target);
  console.log(target);
}

async function select(item) {
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
  authors_div.innerText = data.authors;
  if (data.authors == target.authors) {
    authors_div.classList.add("success");
  } else {
    authors_div.classList.add("fail");
    var set_authors = new Set(data.authors.split(", "));
    target.authors.split(", ").forEach(author => {
      if (set_authors.has(author)) {
        authors_div.classList.remove("fail");
        authors_div.classList.add("closeHit");
      }
    });
  }
  guess.appendChild(authors_div);

  const conference_div = document.createElement("div");
  conference_div.innerText = data.conference;
  if (data.conference == target.conference) {
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

async function search({ h = 10 } = {}) {
  const q = document.getElementById("search_bar").value;
  const qs = 'CONTAINS(?search,LCASE("' + q.split(" ").filter((word) => word.length > 0).join('")) && CONTAINS(?search,LCASE("') + '"))';
  const search_query = `
PREFIX dblp: <https://dblp.org/rdf/schema#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT ?pub ?title (LCASE(CONCAT(STR(?title), " ", GROUP_CONCAT(?authorName; SEPARATOR=", "))) AS ?search) (GROUP_CONCAT(?authorName; SEPARATOR=", ") AS ?authors) ?conference ?year WHERE {` + CONFERENCES_STRING +
    `?pub a dblp:Publication ;
       dblp:publishedInStream ?stream ;
       dblp:title ?title ;
       dblp:yearOfPublication ?year;
       dblp:authoredBy ?author .
  ?author rdfs:label ?authorName .
}
GROUP BY ?pub ?title ?conference ?year
HAVING (` + qs + `
)
ORDER BY ?title
LIMIT `+ h;
  const search_result = await runQuery(search_query);
  dropdown_list = search_result.map(parsePub);

  const dropdown_div = document.getElementById("dropdown");
  var inner = "";
  dropdown_list.forEach(search_response => {
    inner += "<div class='dropdownChoice' data-publication='" + JSON.stringify(search_response) + "'>" + search_response.title + "</div>";
  });
  dropdown_div.innerHTML = inner;
  for (const child of dropdown_div.children) {
    child.addEventListener("click", () => select(child));
  }
}
