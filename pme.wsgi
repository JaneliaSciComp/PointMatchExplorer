import os
import sys
path = '/opt/flaskprojects/pme'

sys.path.append(path)
os.environ['USE_DEBUG'] = '1'

from pme import app as application
