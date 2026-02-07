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
    out["authors"] = entry["author"].split(" and\n")
    out["id"] = entry["ID"]
    out["conf"] = entry['ID'].split(":")[0]
    out["title"] = entry["title"].replace("{","").replace("}","")
    return out

processed_lib = "const papers = " + str(list(map(strip,filtered_lib))) + ";"

# %%
with open("data.js", "w") as f:
  f.write(processed_lib)
