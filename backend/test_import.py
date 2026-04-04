import os
print('CWD:', os.getcwd())
import sys
sys.path.insert(0, '.')
print('Path:', sys.path[:3])
try:
    import app.main
    print('Import successful')
except Exception as e:
    print('Import failed:', e)