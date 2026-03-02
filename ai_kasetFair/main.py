import io
import os
from typing import Any, Dict, Optional

import pandas as pd
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client

from ai import llm_agent

from finance import calculate_financials
from rag import build_index as build_rag_index, answer as rag_answer
from schemas import CogsQuery, PlanRequest, RagQuery, UserQuery

load_dotenv()


def _patch_gotrue_proxy_bug() -> None:
    """
    gotrue 2.9.1 passes `proxy` to httpx.Client, but httpx expects `proxies`.
    Patch the SyncClient used internally so Supabase can initialize.
    """
    try:
        import gotrue._sync.gotrue_base_api as base_api
        import httpx

        class _ProxyFriendlyClient(httpx.Client):
            def __init__(self, *args, proxy=None, **kwargs):
                if proxy:
                    kwargs["proxies"] = proxy
                super().__init__(*args, **kwargs)

        base_api.SyncClient = _ProxyFriendlyClient
    except Exception as exc:  # pragma: no cover - best effort
        print(f"Supabase proxy patch skipped: {exc}")


_patch_gotrue_proxy_bug()

def _pick_supabase_key() -> str:
    """
    Prefer API keys (service_role or anon). Skip database passwords (sb_secret).
    """
    candidates = [
        os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
        os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
        os.getenv("SUPABASE_KEY"),
    ]
    for raw in candidates:
        key = (raw or "").strip()
        if not key or key.startswith("sb_secret"):
            continue
        return key
    return ""


SUPABASE_URL = (
    os.getenv("SUPABASE_URL")
    or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    or ""
).strip().rstrip("/")
SUPABASE_KEY = _pick_supabase_key()
FRONTEND_ORIGIN = (os.getenv("FRONTEND_ORIGIN") or "http://localhost:3000").strip().rstrip("/")


def _has_valid_supabase_config(url: str, key: str) -> bool:
    """Minimal check: both values must be non-empty."""
    return bool(url) and bool(key)


def _is_probably_db_password(key: str) -> bool:
    """
    Supabase DB passwords start with sb_ and are not JWTs; SDK needs a project API key (eyJ...).
    """
    return key.startswith("sb_") or key.count(".") < 2


def init_supabase_client():
    """
    Initialize Supabase client if credentials are present and valid.
    Returns None when configuration is missing or invalid so the app can still run.
    """
    if not _has_valid_supabase_config(SUPABASE_URL, SUPABASE_KEY):
        print("Supabase not configured: SUPABASE_URL or SUPABASE_KEY missing/invalid; skipping.")
        return None
    if _is_probably_db_password(SUPABASE_KEY):
        print(
            "Supabase client initialization skipped: SUPABASE_KEY looks like a database password "
            "(sb_secret...). Use the project API key from Settings > API."
        )
        return None
    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as exc:
        print(f"Supabase client initialization failed: {exc}")
        return None


supabase = init_supabase_client()


def _normalize_assumptions(raw: Any, duration_days: int = 9) -> Dict[str, Any]:
    if not isinstance(raw, dict):
        raise ValueError("รูปแบบ assumptions จาก AI ไม่ถูกต้อง")

    normalized: Dict[str, Any] = dict(raw)
    normalized["duration_days"] = duration_days

    products = normalized.get("products") or []
    if not isinstance(products, list):
        products = []
    cleaned_products = []
    for product in products:
        if not isinstance(product, dict):
            continue
        item = dict(product)
        forecast = item.get("sales_forecast") or []
        if not isinstance(forecast, list):
            forecast = []
        # clip/extend to required duration
        if len(forecast) < duration_days:
            forecast = (forecast + [0] * duration_days)[:duration_days]
        else:
            forecast = forecast[:duration_days]
        item["sales_forecast"] = forecast
        cleaned_products.append(item)
    normalized["products"] = cleaned_products

    fixed_defaults = {
        "booth_rent_total": 0,
        "setup_cost": 0,
        "daily_labor_cost": 0,
        "daily_utilities": 0,
        "daily_transport": 0,
    }
    fixed_costs = normalized.get("fixed_costs") or {}
    if not isinstance(fixed_costs, dict):
        fixed_costs = {}
    for key, default in fixed_defaults.items():
        value = fixed_costs.get(key, default)
        try:
            fixed_costs[key] = float(value)
        except (TypeError, ValueError):
            fixed_costs[key] = default
    normalized["fixed_costs"] = fixed_costs

    # Preserve Traffic Metrics (default to 0 if missing)
    normalized["foot_traffic"] = int(normalized.get("foot_traffic") or 0)
    normalized["interest_rate"] = int(normalized.get("interest_rate") or 0)
    normalized["conversion_rate"] = int(normalized.get("conversion_rate") or 0)

    return normalized


def _build_plan_response(
    user_prompt: str,
    store_id: Optional[str] = None,
    idea: Optional[str] = None,
    duration_days: int = 9,
) -> Dict[str, Any]:
    # 1) AI assumptions
    advice_text, assumptions_raw = llm_agent(user_prompt)
    assumptions = _normalize_assumptions(assumptions_raw, duration_days=duration_days)

    # 2) Financials
    df_human, df_numeric = calculate_financials(assumptions)
    total_revenue = float(df_numeric["revenue"].sum())
    net_profit = float(df_numeric["profit"].sum())
    breakeven_day = next(
        (i + 1 for i, p in enumerate(df_numeric["accumulated_profit"]) if p >= 0), None
    )

    # 3) CSV
    csv_buffer = io.StringIO()
    df_human.to_csv(csv_buffer, index=False, encoding="utf-8-sig")
    csv_string = csv_buffer.getvalue()

    # 4) Persist (optional)
    storage_status = "skipped (Supabase not configured)"
    # Treat "initial" as None to avoid UUID errors
    if store_id == "initial":
        store_id = None

    if supabase and store_id:
        try:
            # 4.1 Insert into business_plans
            data_to_insert = {
                "store_id": store_id,
                "idea": idea or user_prompt,
                "advice": advice_text,
                "assumptions": assumptions,
                "financial_csv": csv_string,
                "total_revenue": total_revenue,
                "net_profit": net_profit,
                "breakeven_day": breakeven_day,
            }
            result = supabase.table("business_plans").insert(data_to_insert).execute()
            if hasattr(result, "model_dump"):
                result_dict = result.model_dump()
            else:
                result_dict = {
                    "data": getattr(result, "data", None),
                    "error": getattr(result, "error", None),
                }
            if result_dict.get("error"):
                raise Exception(result_dict["error"].get("message"))
            
            storage_status = "stored in Supabase (business_plans)"
        except Exception as exc:
            storage_status = f"supabase error: {exc}"
            print("❌ SUPABASE ERROR:", exc)
    elif supabase:
        storage_status = "skipped (missing store_id)"
        print("📌 Supabase client available but store_id missing; skipping persistence.")
    else:
        print("📌 Supabase client not available; skipping persistence.")
    return {
        "status": "success",
        "advice_markdown": advice_text,
        "assumptions_debug": assumptions,
        "total_revenue": total_revenue,
        "net_profit": net_profit,
        "breakeven_day": breakeven_day,
        "financial_csv": csv_string,
        "storage_status": storage_status,
    }


def _prompt_from_plan_request(payload: PlanRequest) -> Dict[str, Optional[str]]:
    """
    Build a prompt from flexible request data. Accepts either an idea string or booth form fields.
    """
    if payload.idea:
        return {
            "prompt": f"วิเคราะห์ไอเดียร้านค้าในงานเกษตรแฟร์ และให้แผนการเงินเบื้องต้น:\n\n{payload.idea}",
            "idea": payload.idea,
            "store_id": payload.store_id,
        }

    parts = []
    if payload.name:
        parts.append(f"ชื่อร้าน: {payload.name}")
    if payload.products:
        parts.append(f"สินค้า: {payload.products}")
    if payload.concept:
        parts.append(f"คอนเซ็ปต์: {payload.concept}")
    if payload.theme:
        parts.append(f"ธีม: {payload.theme}")
    if payload.location:
        parts.append(f"ทำเล: {payload.location}")
    if payload.funding:
        parts.append(f"เงินลงทุน: {payload.funding}")
    if payload.staff:
        parts.append(f"พนักงาน: {payload.staff}")
    if payload.hours:
        parts.append(f"เวลาเปิด: {payload.hours}")

    if not parts:
        raise ValueError("กรุณาระบุ idea หรือข้อมูลร้านค้าอย่างน้อย 1 รายการ")

    prompt = "วิเคราะห์สินค้าและวางแผนการตลาดสำหรับร้านค้าต่อไปนี้:\n\n" + "\n".join(parts)
    return {"prompt": prompt, "idea": payload.products or payload.name, "store_id": payload.store_id}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/")
def health_check():
    return {"status": "ok", "message": "Service is live"}


@app.on_event("startup")
async def warm_rag_index():
    try:
        build_rag_index()
    except Exception as e:
        print("⚠️ RAG index build skipped:", e)


# ====================================
#  RAG — Knowledge-base QA
# ====================================
@app.post("/rag")
async def rag_endpoint(payload: RagQuery):
    try:
        result = rag_answer(payload.question, top_k=payload.top_k)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print("❌ RAG ERROR:", e)
        raise HTTPException(status_code=500, detail="เกิดข้อผิดพลาดในการประมวลผล RAG")


# ====================================
#  NEW — Endpoint รับข้อมูลร้านค้า-ส่งให้ ai ประมวล
# ====================================
@app.get("/ai")
def ai_info():
    return {"status": "ok", "message": "AI Endpoint is ready. Use POST to interact."}


@app.post("/ai")
async def ai(payload: dict):
    try:
        print("📌 Received Booth Form:", payload)
        
        api_key = os.getenv("OPENROUTER_API_KEY")
        print(f"🔑 OPENROUTER_API_KEY present: {bool(api_key)}, Length: {len(api_key) if api_key else 0}")

        # Extract products from the payload dictionary directly
        products = payload.get("products")
        store_id = payload.get("store_id")
        
        # ✅ Handle empty products to prevent AI crash
        if not products or not str(products).strip():
            shop_name = payload.get("name", "ร้านค้าทั่วไป")
            products = f"สินค้าและบริการของร้าน {shop_name} ในงานเกษตรแฟร์"
            print(f"⚠️ Products empty, using default: {products}")
        
        # Only use last 1000 chars to avoid token limits
        prompt = f"""
        วิเคราะห์ความเป็นไปได้ของธุรกิจขาย {products} ในงานเกษตรแฟร์ 2568
        ข้อมูลร้านค้า: {payload}
        """
        return _build_plan_response(
            user_prompt=prompt, store_id=store_id, idea=str(products)
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("❌ AI ERROR:", e)
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")


@app.post("/generate-plan")
async def generate_plan(payload: PlanRequest):
    """
    Accept flexible payloads: either { idea } or full booth form fields.
    Avoids 422 errors when the frontend posts the entire form.
    """
    try:
        prompt_data = _prompt_from_plan_request(payload)
        return _build_plan_response(
            user_prompt=prompt_data["prompt"],
            store_id=prompt_data.get("store_id"),
            idea=prompt_data.get("idea"),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("❌ GENERATE-PLAN ERROR:", e)
        raise HTTPException(status_code=500, detail=f"Generate Plan Error: {str(e)}")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
