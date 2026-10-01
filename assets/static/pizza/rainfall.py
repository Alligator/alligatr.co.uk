import json
from pprint import pprint
from collections import defaultdict

f = open('rainfall_source', 'r').read().strip().split('\n')
years = defaultdict(lambda: [0,0,0,0,0,0,0,0,0,0,0,0])

for line in f:
  for i, pair in enumerate(line.split('  ')):
    rain, year = pair.strip().split(' ')
    years[year][i] = float(rain)

y = []
for year,m in years.iteritems():
  y.append({'year': year, 'rainfall': m})
y = sorted(y, key=lambda x: x['year'])
json.dump(y, open('rainspark.json', 'w'))
