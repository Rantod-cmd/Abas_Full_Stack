import numpy as np
import pandas as pd


def calculate_financials(data):
    days = [f"Day {i}" for i in range(1, data["duration_days"] + 1)]
    rows = []

    total_revenue = np.zeros(len(days))
    total_cogs = np.zeros(len(days))

    # Process Products
    for product in data["products"]:
        sales = np.array(product["sales_forecast"], dtype=float)
        price = float(product["price_per_unit"])
        cost = float(product["cost_per_unit"])
        buffer = product.get("production_buffer", 0)

        # Normalize buffer:
        # - if buffer looks like percent integer (e.g. 10 means 10%), use 0.10
        # - if buffer is between 0 and 1, assume it's already fraction
        # - if buffer is intended as absolute units, use that logic (here we assume percent by default)
        if isinstance(buffer, (int, float)):
            if buffer > 1:
                buffer_frac = buffer / 100.0   # treat 10 -> 0.10
            else:
                buffer_frac = float(buffer)    # already 0.1 or 0.05 etc
        else:
            buffer_frac = 0.0

        production_qty = sales * (1 + buffer_frac)
        # ถ้าคุณต้องการใช้ buffer เป็นจำนวนชิ้น ควรใช้:
        # production_qty = sales + buffer_absolute
        revenue = sales * price
        cogs = production_qty * cost

        total_revenue += revenue
        total_cogs += cogs

        rows.append([f"*** {product['name']} ***", ""] + [""] * len(days))
        rows.append(["ประมาณการยอดขาย (ชิ้น)", ""] + list(sales))
        rows.append(["ราคาขายต่อหน่วย (บาท)", f"{price:.2f}"] + [f"{price:.2f}"] * len(days))
        rows.append(["รายได้ (บาท)", ""] + list(revenue))
        rows.append(["ต้นทุนขายรวม (COGS) (บาท)", f"{cost:.2f}/unit"] + list(np.round(cogs, 2)))
        rows.append(["", ""] + [""] * len(days))

    # Fixed Costs & Summary
    daily_opex_val = (
        data["fixed_costs"]["daily_labor_cost"]
        + data["fixed_costs"]["daily_utilities"]
        + data["fixed_costs"]["daily_transport"]
    )
    daily_opex = np.array([daily_opex_val] * len(days))

    gross_profit = total_revenue - total_cogs
    net_profit = gross_profit - daily_opex

    initial_investment = data["fixed_costs"]["booth_rent_total"] + data["fixed_costs"]["setup_cost"]
    accumulated_profit = np.cumsum(net_profit) - initial_investment

    rows.append(["=== สรุปผลประกอบการ (Summary) ===", ""] + [""] * len(days))
    rows.append(["รวมรายได้ (Total Revenue)", ""] + list(total_revenue))
    rows.append(["รวมต้นทุนขาย (Total COGS)", ""] + list(np.round(total_cogs, 2)))
    rows.append(["กำไรขั้นต้น (Gross Profit)", ""] + list(np.round(gross_profit, 2)))
    rows.append(["ค่าใช้จ่ายดำเนินงาน (OpEx)", ""] + list(daily_opex))
    rows.append(["กำไรสุทธิ (Net Profit)", ""] + list(np.round(net_profit, 2)))
    rows.append(["", ""] + [""] * len(days))
    rows.append(["เงินลงทุนเริ่มแรก", f"-{initial_investment}"] + [""] * len(days))
    rows.append(["กำไรสะสม (Accumulated)", ""] + list(np.round(accumulated_profit, 2)))

    columns = ["รายการ (Item)", "Note"] + days
    df_human = pd.DataFrame(rows, columns=columns)

    # === Numeric table for calculations ===
    df_numeric = pd.DataFrame({
        "day": [i+1 for i in range(len(days))],
        "revenue": total_revenue,
        "cogs": total_cogs,
        "opex": daily_opex,
        "profit": net_profit,
        "accumulated_profit": accumulated_profit
    })

    return df_human, df_numeric
