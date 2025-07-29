#!/usr/bin/env python3
"""
Fix import statements in all Python files
Location: backend/fix_imports.py
"""

import os
import re


def fix_imports_in_file(filepath):
    """Fix imports in a single file"""
    with open(filepath, 'r') as f:
        content = f.read()

    # Replace backend.xxx imports with relative imports
    replacements = [
        (r'from backend\.api', 'from api'),
        (r'from backend\.config', 'from config'),
        (r'from backend\.data_pipeline', 'from data_pipeline'),
        (r'from backend\.quantum_models', 'from quantum_models'),
        (r'from backend\.utils', 'from utils'),
        (r'from backend\.physics_models', 'from physics_models'),
        (r'from backend import managers', 'import managers'),
        (r'import backend\.', 'import '),
    ]

    modified = False
    for pattern, replacement in replacements:
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            modified = True
            content = new_content

    if modified:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed imports in: {filepath}")


# Fix all Python files
for root, dirs, files in os.walk('.'):
    # Skip virtual environments and cache directories
    dirs[:] = [d for d in dirs if d not in ['__pycache__', '.venv', 'venv', 'env', '.git']]

    for file in files:
        if file.endswith('.py') and file != 'fix_imports.py':
            filepath = os.path.join(root, file)
            fix_imports_in_file(filepath)

print("Import fixes complete!")