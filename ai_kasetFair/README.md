# Kaset Fair Financial Statement API

FastAPI service that uses OpenAI to generate Thai-language business advice and a CSV-ready financial projection for a booth at a fair. The backend accepts a simple idea prompt and returns Markdown advice plus structured assumptions for downstream calculations.

## Quickstart
1) Create a virtualenv (optional but recommended):  
   `python3 -m venv venv && source venv/bin/activate`
2) Install dependencies:  
   `python -m pip install -r requirement.txt`
3) Configure environment:  
   - Copy `.env.example` to `.env`  
   - Set `OPENAI_API_KEY=your-key`
4) Run the dev server:  
   `uvicorn main:app --reload` (defaults to http://127.0.0.1:8000)

## API Usage
- Endpoint: `POST /generate-plan`
- Body example:
  ```json
  {"idea": "ขายหมูปิ้งในงานเกษตรแฟร์"}
  ```
- Response:
  - `advice_markdown`: Thai Markdown guidance.
  - `financial_csv`: CSV string with daily projections.
  - `assumptions_debug`: JSON assumptions used for calculations.

## Project Structure
- `main.py` — FastAPI app, CORS, routing.
- `ai.py` — OpenAI client setup and `llm_agent`.
- `finance.py` — Financial math and dataframe builder.
- `schemas.py` — Pydantic request models.
- `.env.example` — Environment template (copy to `.env`).

## Notes
- Requires Python 3.11+ recommended.
- Keep `.env` out of version control. Never hardcode secrets.
- If you add tests, prefer `pytest` under `tests/` and mock OpenAI calls.
