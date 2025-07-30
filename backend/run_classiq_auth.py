#!/usr/bin/env python3
"""
Run Classiq authentication
Location: backend/run_classiq_auth.py
"""

import sys
import subprocess


def main():
    print("🔐 Running Classiq Authentication...")
    print("=" * 50)

    try:
        # Run authentication through Python module
        result = subprocess.run([sys.executable, "-m", "classiq", "authenticate"],
                                capture_output=False, text=True)

        if result.returncode == 0:
            print("\n✅ Authentication successful!")
            print("You can now run the Quantum Fire Prediction System.")
        else:
            print("\n❌ Authentication failed!")
            print("Please check your internet connection and try again.")

    except Exception as e:
        print(f"\n❌ Error during authentication: {e}")
        print("Make sure Classiq SDK is installed: pip install classiq")


if __name__ == "__main__":
    main()