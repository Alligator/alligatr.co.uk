import re
import sys
import os
from datetime import datetime

title = input('title: ')

slug = title.lower().replace(' ', '-')
slug = re.sub('[^a-z-]', '', slug)
print(f'slug will be {slug}')
if input('is this ok? (y/n) ') != 'y':
    sys.exit(0)

dt = datetime.now().isoformat().split('T')[0]

os.mkdir(os.path.join('content', 'blog', slug))
f = open(os.path.join('content', 'blog', slug, 'contents.lr'), 'w', encoding='utf-8');
f.write(f'''\
title: {title}
---
body:
---
date: {dt}
''')
f.close()

print(os.path.join('content', 'blog', slug, 'contents.lr'))
# dt=$(date -I)
# mkdir "content/blog/$slug"

# printf "title: %s\n---\nbody:\n---\ndate: %s" "$title" "$dt" >> "content/blog/$slug/contents.lr"

# $EDITOR "content/blog/$slug/contents.lr"
