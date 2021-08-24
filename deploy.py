import re
import sys
import os
from datetime import datetime
import subprocess

p = subprocess.run(['git', 'status', '--porcelain'], stdout=subprocess.PIPE, encoding='utf-8')
if len(p.stdout) > 0:
    print('there are changed files, you probably don\'t want to deploy\n')
    print(p.stdout)
    sys.exit(1)

print('$ lektor build')
subprocess.run('lektor build', shell=True).check_returncode()

if input('deploy? (y/n) ') == 'y':
    print('$ lektor deploy')
    subprocess.run('lektor deploy', shell=True).check_returncode()
