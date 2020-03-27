import json
import slugify
import os
import shutil
from string import Template

with open('../data-crawler/loslesen.at/karte.json') as json_data:
    d = json.load(json_data)
    print(d["places"])
    for b in d["places"]:
        directory = '../in/' + slugify.slugify(b["ort"])
        name = slugify.slugify(b["titel"])

        shutil.rmtree(directory, ignore_errors=True)

        name = name.replace(slugify.slugify(b["ort"]), '')

        if name.endswith('-'):
            name = name[:-1]
        if name.startswith('-'):
            name = name[1:]

        if not os.path.exists(directory):
            os.makedirs(directory)
        if not os.path.exists(directory + '/' + name):
            os.makedirs(directory + '/' + name)

        d={ 'titel':b["titel"], 'postalcode':b["plz"], 'address':b["adresse"] }

        if not os.path.isfile(directory + '/' + name + '/index.html'):
            open(directory + '/' + name + '/index.html', 'w').close()
            open(directory + '/' + name + '/data.json', 'w').close()
        
        # f = open(directory + '/' + name + '/index.html')
        f2 = open(directory + '/' + name + '/index.html', 'r')
        #src = Template( f.read() )
        #txt = src.substitute(d)
        txt = f2.read()
        f2.close()
        # txt = txt.replace('title', b["titel"])
        f2 = open(directory + '/' + name + '/data.json', 'w')
        f2.write(json.dumps({ 'titel': b["titel"], 'postalcode': b["plz"], 'address': b["adresse"] }))
        f2.close()
        f2 = open(directory + '/' + name + '/index.html', 'w')
        f2.write('Name: ' +b["titel"] + ' -- ' + b["adresse"] + ', ' + b["plz"] + ' ' + b["ort"])
        f2.close()

        print('-----------------')
        print(directory + '/' + name)


'''
{
        "id": "292",
        "titel": "B\u00fccherei Stephanshart",
        "plz": "3321",
        "ort": "Ardagger",
        "adresse": "Dorfplatz 1",
        "lat": "48.1586267",
        "lng": "14.818266",
        "web": "",
        "email": "evaleo.dietl@aon.at",
        "telefon": "+4369910608996",
        "beschreibung": "",
        "typ": "[\"barrierefrei\"]"
    }
'''