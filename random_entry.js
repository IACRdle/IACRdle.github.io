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

async function getTarget() {

  const num_pub_query =
    `PREFIX dblp: <https://dblp.org/rdf/schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT (COUNT(DISTINCT ?pub) AS ?count) WHERE {
  VALUES (?conference ?stream) {
    ("CRYPTO" <https://dblp.org/streams/conf/crypto>)
    ("EUROCRYPT" <https://dblp.org/streams/conf/eurocrypt>)
	("TCC" <https://dblp.org/streams/conf/tcc>)
  }
  ?pub a dblp:Publication ;
       dblp:publishedInStream ?stream ;
       rdf:type <https://dblp.org/rdf/schema#Inproceedings> .
}`


  const data = await runQuery(num_pub_query);
  const num_pubs = parseInt(data[0].count.value);

  const rand_pub_index = getRandomInt(num_pubs);
  console.log(rand_pub_index);
  const rand_pub_query = `PREFIX dblp: <https://dblp.org/rdf/schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?pub ?conference ?year WHERE {
  VALUES (?conference ?stream) {
    ("CRYPTO" <https://dblp.org/streams/conf/crypto>)
    ("EUROCRYPT" <https://dblp.org/streams/conf/eurocrypt>)
	  ("TCC" <https://dblp.org/streams/conf/tcc>)
  }
  ?pub a dblp:Publication ;
       dblp:publishedInStream ?stream ;
       dblp:yearOfPublication ?year;
       rdf:type <https://dblp.org/rdf/schema#Inproceedings> .
}
GROUP BY ?pub ?conference ?year
ORDER BY ?pub 
LIMIT 1
OFFSET ` + rand_pub_index;
  const rand_pub = (await runQuery(rand_pub_query))[0];
  console.log(rand_pub);

}

async function getCitationNumber(pubID){
  return 0;
}

getTarget();