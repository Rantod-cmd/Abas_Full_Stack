import requests
import json

def log(msg):
    with open("lotus_log.txt", "a", encoding="utf-8") as f:
        f.write(str(msg) + "\n")
    print(msg)

def test_lotus_post(query):
    url = "https://api-o2o.lotuss.com/lotuss-mobile-bff/product/v5/search"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Origin": "https://www.lotuss.com",
        "Referer": "https://www.lotuss.com/"
    }
    
    # Valid payload
    payload = {"keyword": query, "limit": 15, "page": 1}
    
    log(f"\n--- Testing Keyword Payload ---")
    log(json.dumps(payload))
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        log(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            products = data.get("data", {}).get("products", [])
            log(f"Found {len(products)} products")
            if products:
                # Log first product structure to find price
                log(json.dumps(products[0], indent=2, ensure_ascii=False))
        else:
                log(f"Error: {resp.text[:200]}")
    except Exception as e:
        log(f"Exception: {e}")

if __name__ == "__main__":
    open("lotus_log.txt", "w").close() 
    test_lotus_post("chicken")

if __name__ == "__main__":
    open("lotus_log.txt", "w").close() 
    test_lotus_post("chicken")
