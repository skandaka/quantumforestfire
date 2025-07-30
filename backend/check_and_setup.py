"""
Check and setup script to ensure everything is properly configured
Location: backend/check_and_setup.py
"""

import os
import sys
from pathlib import Path


def check_environment():
    """Check if all required environment variables are set"""
    print("🔍 Checking environment configuration...")

    required_vars = {
        'NASA_FIRMS_API_KEY': 'Get from https://firms.modaps.eosdis.nasa.gov/api/area',
        'NOAA_API_KEY': 'NOAA Weather API (often not required)',
        'USGS_API_KEY': 'USGS API (often not required)',
        'IBM_QUANTUM_TOKEN': 'Get from https://quantum-computing.ibm.com/',
        'REDIS_URL': 'Default: redis://localhost:6379/0'
    }

    missing = []

    # Load .env file
    from dotenv import load_dotenv
    load_dotenv()

    for var, description in required_vars.items():
        value = os.getenv(var)
        if not value or value.startswith('your_') or value == 'demo_key':
            missing.append(f"{var}: {description}")
            print(f"❌ {var} - Not configured")
        else:
            print(f"✅ {var} - Configured")

    if missing:
        print("\n⚠️  Missing or invalid API keys:")
        for m in missing:
            print(f"   {m}")
        print("\nTo get real API keys:")
        print("1. NASA FIRMS: Register at https://earthdata.nasa.gov/")
        print("2. IBM Quantum: Sign up at https://quantum-computing.ibm.com/")
        print("3. Update your .env file with the real keys")
        return False

    return True


def check_classiq_auth():
    """Check if Classiq is authenticated"""
    print("\n🔍 Checking Classiq authentication...")
    try:
        from classiq import get_authentication_token
        token = get_authentication_token()
        if token:
            print("✅ Classiq authenticated")
            return True
        else:
            print("❌ Classiq not authenticated")
            print("Run: python authenticate_classiq.py")
            return False
    except Exception as e:
        print(f"❌ Classiq error: {e}")
        return False


def check_redis():
    """Check Redis connection"""
    print("\n🔍 Checking Redis connection...")
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379)
        r.ping()
        print("✅ Redis is running")
        return True
    except:
        print("❌ Redis is not running")
        print("Start Redis with: redis-server")
        return False


def main():
    print("🔥 Quantum Fire Prediction System - Configuration Check")
    print("=" * 60)

    all_good = True

    # Check environment
    if not check_environment():
        all_good = False

    # Check Classiq
    if not check_classiq_auth():
        all_good = False

    # Check Redis
    if not check_redis():
        all_good = False

    print("\n" + "=" * 60)

    if all_good:
        print("✅ All systems configured correctly!")
        print("\nYou can now run:")
        print("  python main.py")
    else:
        print("⚠️  Some configuration issues need to be resolved")
        print("\nPlease fix the issues above before running the system")


if __name__ == "__main__":
    main()