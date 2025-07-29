#!/usr/bin/env python3
"""
Authenticate with Classiq platform
Location: backend/authenticate_classiq.py
"""

from classiq import authenticate

if __name__ == "__main__":
    print("Opening browser for Classiq authentication...")
    print("Please log in with your Classiq account.")
    print("If you don't have an account, you can create one for free at https://platform.classiq.io")

    try:
        authenticate()
        print("\n✅ Authentication successful!")
        print("You can now run the Quantum Fire Prediction System.")
    except Exception as e:
        print(f"\n❌ Authentication failed: {e}")
        print("Please try again or check your internet connection.")