#!/usr/bin/env python3
import sys
import argparse
from urllib.request import urlopen
from html.parser import HTMLParser
from string import Template
from datetime import datetime

parser = argparse.ArgumentParser()
parser.add_argument('url', type=str)
args = parser.parse_args()

resp = urlopen(args.url)
if resp.status != 200:
    sys.exit(f'response code was {resp.status}')

body = resp.read().decode('utf-8')

class TitleParserDone(Exception):
    pass

class TitleParser(HTMLParser):
    in_title = False
    title = ''

    def handle_starttag(self, tag, attrs):
        if tag.lower() == 'title':
            self.in_title = True
   
    def handle_data(self, data):
        if self.in_title:
            self.title = data
            raise TitleParserDone

parser = TitleParser()
try:
    parser.feed(body)
except TitleParserDone:
    pass

title = parser.title
print(title)
title_inp = input('title (above by default): ')
desc = input('description (md): ')

if title_inp != '':
    title = title_inp

tmpl = Template('''
#### link ####
date: $date
----
url: $url
----
title: $title
----
description:
$description
''')

dt = datetime.now().isoformat().split('T')[0]
final = tmpl.substitute(date=dt, url=args.url, title=title, description=desc)

with open('content/links/contents.lr', 'a') as brf:
    brf.write(final)
