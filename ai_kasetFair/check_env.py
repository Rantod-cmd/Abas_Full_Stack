from dotenv import load_dotenv
import os

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print(f"SUPABASE_URL present: {bool(url)}")
print(f"SUPABASE_KEY present: {bool(key)}")
print(f"SUPABASE_SERVICE_ROLE_KEY present: {bool(service_key)}")
