# Repository Guidelines

## Project Structure & Module Organization
- `main.py`: FastAPI app setup, CORS, and the `/generate-plan` endpoint wiring.
- `ai.py`: OpenAI client initialization via `.env` and `llm_agent` for advice + assumptions JSON.
- `finance.py`: Financial calculations and CSV-ready DataFrame builder.
- `schemas.py`: Pydantic request models.
- `.env.example`: Placeholder for secrets; copy to `.env` and set `OPENAI_API_KEY`.

## Build, Test, and Development Commands
- Install deps: `python -m pip install -r requirement.txt`.
- Run dev server: `uvicorn main:app --reload` (default at http://127.0.0.1:8000).
- Generate plan (example): `curl -X POST http://127.0.0.1:8000/generate-plan -H "Content-Type: application/json" -d '{"idea":"ขายหมูปิ้งในงานเกษตรแฟร์"}'`.
- No formal test suite yet; add `pytest` before contributing tests.

## Coding Style & Naming Conventions
- Language: Python 3; prefer type hints and Pydantic models for request/response shapes.
- Imports: stdlib → third-party → local modules.
- Naming: snake_case for functions/variables; PascalCase for classes; module filenames are lowercase.
- Env config: load from `.env` via `python-dotenv`; never hardcode secrets or commit `.env`.

## Testing Guidelines
- Framework: not present. If adding, prefer `pytest` with `tests/` mirroring module names (e.g., `tests/test_finance.py`).
- Keep unit tests deterministic; mock external calls (OpenAI) and cover error paths (missing API key, malformed JSON).

## Commit & Pull Request Guidelines
- Commits: write clear, imperative subjects (e.g., `Add OpenAI agent module`, `Refactor finance calculations`). Keep changes focused.
- PRs: include a short summary, testing notes (e.g., commands run), and any screenshots/logs when modifying API behavior. Link related issues if applicable.

## Security & Configuration Tips
- Required secret: `OPENAI_API_KEY` in `.env`.
- Avoid logging or returning secrets. Validate user inputs via Pydantic models. Keep dependency pins in `requirement.txt` up to date.
