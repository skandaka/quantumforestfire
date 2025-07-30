#!/usr/bin/env python3
"""
Fix all import statements and syntax errors in the backend code
"""

import os
import re


def fix_imports_in_file(filepath):
    """Fix imports in a single file"""
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content

    # Fix absolute imports - remove 'backend.' prefix when inside backend
    replacements = [
        # Main imports
        (r'from backend\.api', 'from api'),
        (r'from backend\.config', 'from config'),
        (r'from backend\.data_pipeline', 'from data_pipeline'),
        (r'from backend\.quantum_models', 'from quantum_models'),
        (r'from backend\.utils', 'from utils'),
        (r'from backend\.physics_models', 'from physics_models'),
        (r'from backend import managers', 'import managers'),
        (r'import backend\.', 'import '),

        # Fix relative imports in subdirectories
        (r'from \.\.config', 'from config'),
        (r'from \.\.data_pipeline', 'from data_pipeline'),
        (r'from \.\.quantum_models', 'from quantum_models'),
        (r'from \.\.utils', 'from utils'),
        (r'from \.\.physics_models', 'from physics_models'),
        (r'from \.\. import managers', 'import managers'),
    ]

    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)

    # Fix specific files with syntax errors
    if 'classiq_fire_spread.py' in filepath:
        # Fix the syntax error at line 214-217
        content = re.sub(
            r'lambda: fire_count \+= 1',
            'lambda: fire_count.__iadd__(1)',
            content,
            flags=re.DOTALL
        )

        # Fix missing imports for Classiq
        if 'from classiq import' in content and 'X' not in content.split('from classiq import')[1].split('\n')[0]:
            content = content.replace(
                'from classiq import (',
                'from classiq import (\n    X,'
            )

    # Fix quantum_simulator.py imports
    if 'quantum_simulator.py' in filepath:
        # Ensure proper imports
        if 'from .classiq_models.classiq_fire_spread' not in content:
            content = content.replace(
                'from backend.config import settings',
                'from config import settings'
            )

        # Fix the mock settings import
        content = content.replace(
            'try:\n    from backend.config import settings\nexcept ImportError:\n    settings = MockSettings()',
            'try:\n    from config import settings\nexcept ImportError:\n    settings = MockSettings()'
        )

    # Fix main.py imports
    if filepath.endswith('main.py'):
        content = re.sub(
            r'from backend\.',
            'from ',
            content
        )

    # Fix utils imports
    if 'utils/' in filepath:
        content = re.sub(r'from \.\.', 'from ', content)

    # Fix data_pipeline imports
    if 'data_pipeline/' in filepath:
        content = re.sub(r'from \.\.', 'from ', content)

    # Fix api imports
    if 'api/' in filepath:
        content = re.sub(r'from \.\.', 'from ', content)

    # Write back only if changed
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"✓ Fixed imports in: {os.path.basename(filepath)}")
        return True
    return False


def fix_all_files():
    """Fix all Python files in the backend directory"""
    fixed_count = 0

    # Get all Python files
    for root, dirs, files in os.walk('.'):
        # Skip virtual environments and cache directories
        dirs[:] = [d for d in dirs if d not in ['__pycache__', '.venv', 'venv', 'env', '.git']]

        for file in files:
            if file.endswith('.py') and file != 'fix_all_imports.py':
                filepath = os.path.join(root, file)
                if fix_imports_in_file(filepath):
                    fixed_count += 1

    return fixed_count


def create_missing_imports():
    """Add any missing imports to files that need them"""

    # Fix classiq_fire_spread.py
    classiq_fire_spread_path = 'quantum_models/classiq_models/classiq_fire_spread.py'
    if os.path.exists(classiq_fire_spread_path):
        with open(classiq_fire_spread_path, 'r') as f:
            content = f.read()

        # Ensure X is imported
        if 'from classiq import' in content and ', X,' not in content:
            content = content.replace(
                'from classiq import (\n',
                'from classiq import (\n    X,\n'
            )

        # Fix the allocate import
        if 'allocate' in content and 'allocate' not in content.split('from classiq import')[1].split(')')[0]:
            imports_section = content.split('from classiq import')[1].split(')')[0]
            if 'allocate' not in imports_section:
                content = content.replace(
                    'within_apply,\n',
                    'within_apply,\n        allocate,\n'
                )

        with open(classiq_fire_spread_path, 'w') as f:
            f.write(content)
        print("✓ Fixed Classiq imports")


def add_missing_init_files():
    """Ensure all packages have __init__.py files"""
    packages = [
        'api',
        'data_pipeline',
        'quantum_models',
        'quantum_models/classiq_models',
        'quantum_models/qiskit_models',
        'physics_models',
        'utils'
    ]

    for package in packages:
        init_file = os.path.join(package, '__init__.py')
        if not os.path.exists(init_file):
            with open(init_file, 'w') as f:
                f.write('')
            print(f"✓ Created {init_file}")


def main():
    print("🔧 Fixing all import statements and syntax errors...")
    print("=" * 50)

    # Change to backend directory if we're not already there
    if os.path.basename(os.getcwd()) != 'backend':
        if os.path.exists('backend'):
            os.chdir('backend')
        else:
            print("❌ Error: backend directory not found!")
            return

    # Ensure all __init__.py files exist
    add_missing_init_files()

    # Fix all imports
    fixed_count = fix_all_files()

    # Add missing imports
    create_missing_imports()

    print("=" * 50)
    print(f"✅ Fixed {fixed_count} files")
    print("\nNow you can run the backend with:")
    print("  python main.py")


if __name__ == "__main__":
    main()