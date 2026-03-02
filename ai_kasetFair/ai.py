import json
import os

from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables (expects OPENAI_API_KEY in .env)
load_dotenv()

# Initialize OpenAI client for OpenRouter
openai_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
    default_headers={
        "HTTP-Referer": os.getenv("FRONTEND_ORIGIN", "http://localhost:3000"),  # Optional: For OpenRouter rankings
        "X-Title": "Kaset Fair AI",               # Optional: For OpenRouter rankings
    },
)


MODEL_NAME = "openai/gpt-4o"  # Explicitly use OpenRouter model ID


def llm_agent(user_prompt: str):
    """
    Calls OpenAI to get (text advice, structured JSON for math).
    Two calls keep Markdown and JSON responsibilities separate for reliability.
    """
    if openai_client.api_key is None:
        raise RuntimeError("Missing OPENROUTER_API_KEY. Set it in your .env file.")

    # Single call optimization: Request both advice and assumptions in one JSON object
    system_prompt = (
        "You are a professional business consultant for a booth at Kaset Fair (Thailand). "
        "Your goal is to provide HIGHLY SPECIFIC, ACTIONABLE, and CREATIVE advice tailored EXACTLY to the user's product. "
        "RULES:\n"
        "- Do NOT provide generic advice (e.g., 'save costs', 'do marketing', 'hire staff').\n"
        "- FOCUS on the specific product. For example, if selling 'Crispy Pork', suggest 'Tamarind dipping sauce', 'Live frying station', or 'Walking-friendly packaging'.\n"
        "- Tone: Professional, encouraging, and modern.\n"
        "- Avoid referencing 'old data' or generic templates.\n\n"
        "Return a JSON object with two keys:\n"
        "1. 'advice_markdown': (string) คำแนะนำภาษาไทย ที่สร้างสรรค์และเจาะจงกับสินค้ามากๆ (Specific & Actionable) ความยาวพอประมาณ มีหัวข้อชัดเจน\n"
        "2. 'assumptions': (object) Financial projection inputs with keys: "
        "project_name (string), duration_days (int, must be 9), "
        "foot_traffic (int, average daily), interest_rate (int, percent), conversion_rate (int, percent), "
        "products (list of objects with name, unit, price_per_unit, cost_per_unit, "
        "production_buffer, sales_forecast list length = 9), "
        "fixed_costs (booth_rent_total, setup_cost, daily_labor_cost, "
        "daily_utilities, daily_transport).\n"
        "Ensure all numeric fields are numbers."
    )

    response = openai_client.chat.completions.create(
        model=MODEL_NAME,
        temperature=0.4,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    content = response.choices[0].message.content
    if not content:
        raise ValueError("Empty response from OpenAI")

    data = json.loads(content)
    advice_text = data.get("advice_markdown", "ไม่สามารถสร้างคำแนะนำได้")
    assumptions = data.get("assumptions", {})

    return advice_text, assumptions
