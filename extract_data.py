# %%
import bibtexparser


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
processed_lib_string = "const papers = " + str(processed_lib) + ";"

# %%
with open("data.js", "w") as f:
  f.write(processed_lib_string)
'''
# %%
import requests
from bs4 import BeautifulSoup

# %%
url = 'https://scholar.google.com/scholar?q=Beyond-Birthday-Bound+Security+with+HCTR2%3A+Cascaded+Construction+and+Tweak-Based+Key+Derivation'
headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0'
}
try:
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.content, 'html.parser')
except:
    pass

# %%
content_divs = soup.find_all('div', class_="gs_flb")
content_divs
# %%
'''
