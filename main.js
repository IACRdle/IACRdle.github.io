const CONFERENCES_STRING = `VALUES (?conference ?stream) {
    ("CRYPTO" <https://dblp.org/streams/conf/crypto>)
    ("EUROCRYPT" <https://dblp.org/streams/conf/eurocrypt>)
	  ("TCC" <https://dblp.org/streams/conf/tcc>)
  }`

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

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

async function parsePub(pub) {
  var parsed = {};
  parsed.pub = pub.pub.value;
  parsed.year = parseInt(pub.year.value);
  parsed.conference = pub.conference.value;
  parsed.citation = (await getCitationNumber(""))
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
       dblp:publishedInStream ?stream ;
       dblp:yearOfPublication ?year;
       rdf:type <https://dblp.org/rdf/schema#Inproceedings> .
}
GROUP BY ?pub ?conference ?year
ORDER BY ?pub 
LIMIT 1
OFFSET ` + rand_pub_index;
  const rand_pub = (await runQuery(rand_pub_query))[0];
  return (await parsePub(rand_pub));
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
  console.log(search_result);
}

