const CONFERENCES_STRING = `VALUES (?conference ?stream) {
    ("CRYPTO" <https://dblp.org/streams/conf/crypto>)
    ("EUROCRYPT" <https://dblp.org/streams/conf/eurocrypt>)
	  ("TCC" <https://dblp.org/streams/conf/tcc>)
  }`

var dropdown_list = [];

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
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeDateSeededRng(date) {
  return mulberry32(seedFromDate(date));
}

const DayRng = makeDateSeededRng(new Date());

function getRandomInt(max) {
  return Math.floor(DayRng() * max);
}

function parsePub(pub) {
  var parsed = {};
  if (pub.pub !== undefined) parsed.id = pub.pub.value;
  if (pub.year !== undefined) parsed.year = parseInt(pub.year.value);
  if (pub.conference !== undefined) parsed.conference = pub.conference.value;
  if (pub.title !== undefined) parsed.title = pub.title.value;
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
  console.log(rand_pub_index);
  const rand_pub_query = `
PREFIX dblp: <https://dblp.org/rdf/schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?pub ?conference ?year WHERE {` + CONFERENCES_STRING +
    `?pub a dblp:Publication ;
       dblp:title ?title;
       dblp:publishedInStream ?stream ;
       dblp:yearOfPublication ?year;
       rdf:type <https://dblp.org/rdf/schema#Inproceedings> .
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
  const target = (await getTarget())
  console.log(target)
  document.querySelector("#target").innerText = JSON.stringify(target);
}

async function search({ h = 10 } = {}) {
  const q = document.querySelector("#search_bar").value;
  const qs = 'CONTAINS(?search,LCASE("' + q.split(" ").filter((word) => word.length > 0).join('")) && CONTAINS(?search,LCASE("') + '"))';
  const search_query = `
PREFIX dblp: <https://dblp.org/rdf/schema#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT ?pub ?title (LCASE(CONCAT(STR(?title), " ", GROUP_CONCAT(?authorName; SEPARATOR=", "))) AS ?search) WHERE {` + CONFERENCES_STRING +
    `?pub a dblp:Publication ;
       dblp:publishedInStream ?stream ;
       dblp:title ?title ;
       dblp:authoredBy ?author .
  ?author rdfs:label ?authorName .
}
GROUP BY ?pub ?title
HAVING (` + qs + `
)
ORDER BY ?title
LIMIT `+ h;
  const search_result = await runQuery(search_query);
  dropdown_list = search_result.map(parsePub);

  const dropdown_div = document.querySelector("#dropdown");
  var inner = "";
  dropdown_list.forEach(search_response => {
    inner += "<div class='dropdownChoice' value='" + search_response.id + "'>" + search_response.title + "</div>";
  });
  dropdown_div.innerHTML = inner;
}
