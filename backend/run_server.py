import os
import sys

# Set environment variables
os.environ['DATABASE_URL'] = 'postgresql://postgres:CavanCredit1!@localhost:5432/assetsapp'
os.environ['SUPABASE_URL'] = 'https://dhivbpkzvavxtixbedrp.supabase.co'
os.environ['SUPABASE_KEY'] = 'sb_publishable_oHne2zzrJlY09edVjCwP2g_xpIzh2y4'
os.environ['SECRET_KEY'] = '9f3c8b1d6e7a4c2b8d1e5f9a0c3b7d6e4f2a1c9b8e7d6f5a4b3c2d1e0f9a8b7'

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import and run the app
from app.main import app
import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)