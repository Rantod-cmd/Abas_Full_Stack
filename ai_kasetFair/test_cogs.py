
import os
from dotenv import load_dotenv
load_dotenv()

from aisearch import find_ingredients, ai_fill_ingredients, openai_client

print(f"OpenAI Key present: {bool(os.getenv('OPENAI_API_KEY'))}")
print(f"Client is None: {openai_client is None}")

if openai_client:
    try:
        from openai import OpenAI
        # Try a simple call
        print("Attempting simple chat completion...")
        resp = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": "hi"}],
            max_tokens=5
        )
        print("Success:", resp.choices[0].message.content)
    except Exception as e:
        print("Full Exception:", e)

print("-" * 20)
product = "มีสามเมนู ได้แก่ ยำวุ้นเส้น ยำหมูยอ และ ยำหอยแครง"
try:
    print("Retrying ai_fill_ingredients with debug...")
    # We can't easily patch the internal exception printing without modifying the file, 
    # but the above direct call should reveal the issue if it's Client/API related.
    ingredients = ai_fill_ingredients(product, limit=6)
    print(f"Result: {ingredients}")
except Exception as e:
    print(f"Outer Error: {e}")
