# %%
import bibtexparser
from random import shuffle

# %%
abbrev3 = open("cryptobib/abbrev3.bib")
crypto = open("cryptobib/crypto.bib")
bibtex_str = abbrev3.read() + crypto.read()


# %%
library = bibtexparser.loads(bibtex_str).get_entry_list()


# %%
def only_conferences(entry):
    conference = entry['ID'].split(":")[0]
    if entry['ENTRYTYPE'] != "inproceedings":
        return False
    if conference == "C" or conference == "EC" or conference == "AC" or conference == "TCC":
        return True
    return False

filtered_lib = filter(only_conferences,library)

def strip(entry):
    out = dict()
    out["year"] = entry["year"]
    out["authors"] = entry["author"].replace('{\\"a}',"ä").replace('{\\"u}',"ü").replace('{\\"U}',"Ü").replace('{\\"i}',"ï").replace("{\\'e}","é").replace("{\\r a}","å").replace("{\\aa}","å").replace("{\\'i}","í").replace("{\\^i}","î").replace('{\\"o}',"ö").replace('{\\"O}',"Ö").replace('{\\"e}',"ë").replace("{\\'o}","ó").replace("{\\c c}","ç").replace("{\\ss}","ß").replace("{\\`e}","è").replace("{\\~a}","ã").replace("{\\'u}","ú").replace("{\\'a}","á").replace("{\\^o}","ô").replace("{\\o}","ø").replace("{\\`a}","à").replace("{\\O}","Ø").replace("{\\'E}","É").replace("{\\^u}","û").replace("{\\~n}","ñ").replace("{\\`u}","ù").replace("{\\AA}","Å").replace("{\\u a}","ă").replace("{\\'A}","Á").replace("{\\v{z}}","ž").replace("{\\v z}","ž").replace("{\\'c}","ć").replace("{\\v s}","š").replace("{\\c C}","Ç").replace("{\\'y}","ý").replace("{\\v c}","č").replace("{\\ae}","æ").replace("{","").replace("}","").split(" and\n")
    out["id"] = entry["ID"]
    out["conf"] = entry['ID'].split(":")[0]
    out["title"] = entry["title"].replace("{","").replace("}","")
    return out

processed_lib = list(map(strip,filtered_lib))
shuffle(processed_lib)
processed_lib_string = "const papers = " + str(processed_lib) + ";\n"
# %%
paper_per_author = dict()
for paper in processed_lib:
    for author in paper["authors"]:
        if author in paper_per_author:
            paper_per_author[author] += 1
        else:
            paper_per_author[author] = 1

#print(paper_per_author)

most_published_authors = []
for author in paper_per_author:
    if paper_per_author[author] >= 50:
        most_published_authors.append(author)
#print(most_published_authors)
most_published_authors_string = "const authors = " + str(most_published_authors) + ";"
# %%
with open("data.js", "w") as f:
  f.write(processed_lib_string + most_published_authors_string)

# %%
len(processed_lib)
# %%
'''
import requests
from bs4 import BeautifulSoup
import re
import time

# %%
headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0'
}
def get_citations(paper):
    url = 'https://scholar.google.com/scholar?q='
    url += "+".join(paper["title"].split(" "))
    for author in paper["authors"]:
        url += "+" + "+".join(author.split(" "))
    #print(url)
    try:
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.content, 'html.parser')
        regex = re.compile(".scholar.cites.*")
        content_divs = soup.find('a',{"href":regex})
        citations = int(content_divs.get_text().split(" ")[-1])
    except:
        citations = 0
    return citations

# %%
for i in range(20):
    num_citation = get_citations(processed_lib[i])
    processed_lib[i]["citations"] = num_citation
    time.sleep(0.2)
    
# %%

processed_lib[:20]
# %%
'''