import os
import subprocess
import shutil
from pathlib import Path

# Get the base directory of the project
BASE_DIR = Path(__file__).resolve().parent

# Define source and destination paths
TAILWIND_CSS_PATH = os.path.join(BASE_DIR, 'static', 'ip_app', 'css', 'tailwind.css')
OUTPUT_CSS_PATH = os.path.join(BASE_DIR, 'static', 'ip_app', 'css', 'styles.css')

# Ensure the output directory exists
os.makedirs(os.path.dirname(OUTPUT_CSS_PATH), exist_ok=True)

# Run the Tailwind CLI build command
try:
    print("Compiling Tailwind CSS...")
    subprocess.run([
        'npx', 
        'tailwindcss', 
        '-i', TAILWIND_CSS_PATH, 
        '-o', OUTPUT_CSS_PATH, 
        '--minify'
    ], check=True)
    print(f"Tailwind CSS compiled successfully to {OUTPUT_CSS_PATH}")
except subprocess.CalledProcessError as e:
    print(f"Error compiling Tailwind CSS: {e}")
    exit(1)
