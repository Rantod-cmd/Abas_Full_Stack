import json
import os

from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables (expects OPENAI_API_KEY in .env)
load_dotenv()

# Initialize OpenAI-compatible client pointing to OpenRouter
openai_client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)


def llm_agent(user_prompt: str):
    """
    Calls OpenAI to get (text advice, structured JSON for math).
    Two calls keep Markdown and JSON responsibilities separate for reliability.
    """
    if openai_client.api_key is None:
        raise RuntimeError("Missing OPENROUTER_API_KEY. Set it in your .env file.")

    advice_resp = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.6,
        messages=[
            {
                "role": "system",
                "content": (
                    "คุณเป็นที่ปรึกษาการเงินสำหรับร้านค้าที่งานเกษตรแฟร์"
                    "ตอบเป็นภาษาไทย กระชับ และใช้ Markdown bullet/heading ได้"
                ),
            },
            {"role": "user", "content": user_prompt},
        ],
    )
    advice_text = advice_resp.choices[0].message.content.strip()

    assumptions_resp = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "Return only JSON for financial projection inputs with keys: "
                    "project_name (string), duration_days (int), "
                    "products (list of objects with name, unit, price_per_unit, cost_per_unit, "
                    "production_buffer, sales_forecast list length = duration_days), "
                    "fixed_costs (booth_rent_total, setup_cost, daily_labor_cost, "
                    "daily_utilities, daily_transport). Ensure numeric fields are numbers."
                ),
            },
            {"role": "user", "content": user_prompt},
        ],
    )
    assumptions = json.loads(assumptions_resp.choices[0].message.content)
    return advice_text, assumptions
