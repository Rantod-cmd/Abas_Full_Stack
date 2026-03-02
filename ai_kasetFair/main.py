from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import io
import uvicorn
import os
from dotenv import load_dotenv
from supabase import create_client, Client

from ai import llm_agent
from finance import calculate_financials
from schemas import UserQuery, IngestQuery, RagQuery
import pandas as pd

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") 
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====================================
#  NEW — Endpoint รับข้อมูลร้านค้า-ส่งให้ ai ประมวล
# ====================================
@app.post("/ai")
async def process_booth(form: UserQuery):
    try:
        print("📌 Received Booth Form:", form)
        
        prompt = f"""
            วิเคราะห์สินค้าและวางแผนการตลาดสำหรับร้านค้านี้ โดยใช้เฉพาะ products:

            {form.products}
            """
        # 1. Call AI
        print("📌 STEP 1: Calling LLM...")
        advice_text, assumptions = llm_agent(prompt)
        
        # ปรับจำนวนวันขายจริง (9 วัน)
        assumptions['duration_days'] = 9
        for product in assumptions['products']:
            product['sales_forecast'] = product['sales_forecast'][:9]
        
        # 2. Calculate 
        print("📌 STEP 2: Calculating financials...")
        df_human, df_numeric = calculate_financials(assumptions)
        total_revenue = df_numeric['revenue'].sum()
        net_profit = df_numeric['profit'].sum()
        breakeven_day = next((i+1 for i, p in enumerate(df_numeric['accumulated_profit']) if p >= 0), None)
        
        # 3. Convert to CSV String
        print("📌 STEP 3: Converting CSV...")
        csv_buffer = io.StringIO()
        df_human.to_csv(csv_buffer, index=False, encoding='utf-8-sig')
        csv_string = csv_buffer.getvalue()
        
        # 4. Save into Supabase
        print("📌 STEP 4: Inserting to Supabase...")
        data_to_insert = {
            "store_id": form.store_id,
            "idea": str(form.products),
            "advice": advice_text,
            "assumptions": assumptions,
            "financial_csv": csv_string,
            "total_revenue": total_revenue,
            "net_profit": net_profit,
            "breakeven_day": breakeven_day
            # "breakeven_day": 9
        }
        
        result = supabase.table("business_plans").insert(data_to_insert).execute()
        print("📌 SUPABASE RESULT:", result)

        result_dict = result.model_dump()
        print("📌 SUPABASE RAW RESULT:", result_dict)

        if result_dict.get("error"):
            raise Exception(result_dict["error"].get("message"))
        
        # 6) ส่งกลับหน้าเว็บ
        return {
            "status": "success",
            "advice_markdown": advice_text,
            "assumptions_debug": assumptions,
            "total_revenue": total_revenue,
            "net_profit": net_profit,
            "breakeven_day": breakeven_day,
            "financial_csv": csv_string
        }
    except Exception as e:
        print("❌ AI ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
