import json
import os
import pickle
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple

from dotenv import load_dotenv
from openai import OpenAI
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

load_dotenv()

# Paths
BASE_DIR = Path(__file__).resolve().parent  # repository root
DATA_DIR = BASE_DIR / "data_rag"
CACHE_DIR = BASE_DIR / ".rag_cache"
INDEX_FILE = CACHE_DIR / "index.pkl"

# Settings
SUPPORTED_EXTS = {".txt", ".md"}
CHUNK_SIZE = 900
CHUNK_OVERLAP = 150
DEFAULT_TOP_K = 5

# Runtime caches
_vectorizer: Optional[TfidfVectorizer] = None
_index_matrix = None  # scipy sparse matrix
_chunks: List[Dict[str, Any]] = []

# OpenAI client (optional; gracefully degrade if missing)
# OpenRouter client
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
openai_client: Optional[OpenAI] = None

if OPENROUTER_API_KEY:
    openai_client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
        default_headers={
            "HTTP-Referer": os.getenv("FRONTEND_ORIGIN", "http://localhost:3000"),
            "X-Title": "Kaset Fair AI",
        },
    )


@dataclass
class Chunk:
    """Lightweight chunk metadata for retrieval results."""

    text: str
    source: str
    chunk_id: int


def _ensure_dirs() -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _read_text_file(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="ignore")


def _clean_text(text: str) -> str:
    text = text.replace("\r\n", "\n")
    text = re.sub(r"[#*`_>]+", " ", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


def _chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    chunks: List[str] = []
    if not text:
        return chunks

    step = max(1, chunk_size - overlap)
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk.strip())
        start += step
    return chunks


def _load_documents() -> List[Chunk]:
    _ensure_dirs()
    chunks: List[Chunk] = []
    chunk_counter = 0

    for path in DATA_DIR.glob("**/*"):
        if path.is_dir():
            continue
        if path.suffix.lower() not in SUPPORTED_EXTS:
            # Skip heavy/unsupported formats (pdf/docx etc.)
            continue

        raw_text = _read_text_file(path)
        cleaned = _clean_text(raw_text)
        for idx, piece in enumerate(_chunk_text(cleaned)):
            chunks.append(
                Chunk(
                    text=piece,
                    source=str(path.relative_to(BASE_DIR)),
                    chunk_id=chunk_counter,
                )
            )
            chunk_counter += 1

    return chunks


def _persist_index(
    vectorizer: TfidfVectorizer, matrix, chunks: Sequence[Chunk]
) -> None:
    _ensure_dirs()
    with INDEX_FILE.open("wb") as f:
        pickle.dump({"vectorizer": vectorizer, "matrix": matrix, "chunks": chunks}, f)


def _load_index_from_disk() -> bool:
    global _vectorizer, _index_matrix, _chunks
    if not INDEX_FILE.exists():
        return False
    try:
        with INDEX_FILE.open("rb") as f:
            data = pickle.load(f)
        _vectorizer = data["vectorizer"]
        _index_matrix = data["matrix"]
        _chunks = data["chunks"]
        return True
    except Exception:
        return False


def build_index(force_rebuild: bool = False) -> None:
    """
    Build or load the TF-IDF vector index for documents in data_rag/.
    """
    global _vectorizer, _index_matrix, _chunks

    if not force_rebuild and _vectorizer is not None and _index_matrix is not None and _chunks:
        return

    if not force_rebuild and _load_index_from_disk():
        return

    docs = _load_documents()
    if not docs:
        raise RuntimeError("ไม่พบไฟล์ความรู้ในโฟลเดอร์ data_rag/")

    vectorizer = TfidfVectorizer(
        analyzer="word",
        ngram_range=(1, 2),
        min_df=1,
        max_features=50000,
        sublinear_tf=True,
    )
    matrix = vectorizer.fit_transform([c.text for c in docs])

    _vectorizer = vectorizer
    _index_matrix = matrix
    _chunks = docs

    _persist_index(vectorizer, matrix, docs)


def _similar_chunks(query: str, top_k: int = DEFAULT_TOP_K) -> List[Tuple[Chunk, float]]:
    if not _vectorizer or _index_matrix is None or not _chunks:
        build_index()

    query_vec = _vectorizer.transform([query])
    scores = cosine_similarity(query_vec, _index_matrix).flatten()

    top_indices = scores.argsort()[::-1][: max(top_k, 1)]
    results: List[Tuple[Chunk, float]] = []
    for idx in top_indices:
        score = float(scores[idx])
        if score <= 0:
            continue
        results.append((_chunks[idx], score))
    return results


def _sections_from_llm(query: str, context: str) -> List[Dict[str, Any]]:
    if not openai_client:
        raise RuntimeError("OpenAI client is not configured.")

    system_prompt = (
        "คุณคือ 'Senior Business Consultant' ประจำงานเกษตรแฟร์ ที่เชี่ยวชาญการวิเคราะห์ข้อมูลเชิงลึก "
        "หน้าที่ของคุณคือให้คำแนะนำทางธุรกิจโดยใช้ข้อมูลจริงจากส่วน CONTEXT ที่กำหนดให้เท่านั้น (ห้ามคิดเอง) "
        
        "ขั้นตอนการทำงาน:"
        "1. [Data Matching]: วิเคราะห์สินค้าของผู้ถาม แล้วค้นหาข้อมูลใน CONTEXT โดยมองหา:"
        "   - คู่แข่งทางตรง (สินค้าเหมือนกัน)"
        "   - สินค้าทดแทน (สินค้าคล้ายกัน เช่น ขายน้ำเหมือนกัน)"
        "   - กรณีศึกษาที่น่าสนใจ (ร้านที่ขายดีหรือมีปัญหา เพื่อนำมาเป็นบทเรียน)"
        
        "2. [Insight Extraction]: ดึงข้อมูลตัวเลข (ราคา, ต้นทุน) และกลยุทธ์ (โปรโมชั่น, การจัดร้าน) ของร้านเหล่านั้นออกมา"
        
        "3. [Advisory Generation]: สร้างคำแนะนำแบ่งเป็นหมวดหมู่ 4-6 หมวด ตามความเหมาะสมของข้อมูล เช่น:"
        "   - 'Strategy & Pricing': การตั้งราคาเมื่อเทียบกับตลาดใน Context"
        "   - 'Operations & Cost': การบริหารจัดการร้านและวัตถุดิบ"
        "   - 'Marketing & Promotion': โปรโมชั่นที่เคยได้ผลจริงในงาน"
        "   - 'Risk Management': ปัญหาที่ร้านอื่นเคยเจอและวิธีป้องกัน"
        
        "4. [Output Format]: ตอบกลับเป็น JSON object เท่านั้น รูปแบบ: "
        "   {{ 'sections': [ {{ 'title': 'ชื่อหมวดหมู่', 'bullets': ['คำแนะนำที่ 1 (อ้างอิงร้าน A)', 'คำแนะนำที่ 2 (อ้างอิงราคา X บาท)'] }} ] }} "
        "   *หมายเหตุ: เนื้อหาใน bullets ต้องกระชับ เจาะจง และอ้างอิงข้อมูลจาก Context เสมอ*"
    )
    user_prompt = f"QUESTION:\n{query}\n\nCONTEXT:\n{context}"

    resp = openai_client.chat.completions.create(
        model="openai/gpt-4o",  # Use OpenRouter model ID
        temperature=0.3,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    content = resp.choices[0].message.content
    data = json.loads(content)
    sections = data.get("sections")
    if not isinstance(sections, list):
        raise ValueError("LLM did not return valid sections")
    normalized: List[Dict[str, Any]] = []
    for section in sections:
        title = str(section.get("title", "")).strip() or "คำแนะนำเพิ่มเติม"
        bullets = section.get("bullets") or []
        if isinstance(bullets, str):
            bullets = [bullets]
        normalized.append({"title": title, "bullets": [str(b).strip() for b in bullets if str(b).strip()]})
    return normalized


def _fallback_sections(context_chunks: Sequence[Tuple[Chunk, float]]) -> List[Dict[str, Any]]:
    snippets = [chunk.text[:200] for chunk, _ in context_chunks[:2] if chunk.text]
    base_titles = [
        "การวางแผนต้นทุน",
        "การตั้งราคา",
        "การจัดการเงินสด",
        "การตลาดและโปรโมชั่น",
        "การประเมินผล",
        "การพัฒนาร้าน",
    ]
    sections: List[Dict[str, Any]] = []
    for title in base_titles:
        bullets: List[str] = []
        if snippets:
            bullets.append(f"สรุปจากร้านคล้ายกัน: {snippets[0]}")
            if len(snippets) > 1:
                bullets.append(f"ข้อมูลเพิ่มเติม: {snippets[1]}")
        else:
            bullets.append("ยังไม่มีข้อมูลในคลังความรู้")
        sections.append({"title": title, "bullets": bullets})
    return sections


def _build_answer_text(sections: Sequence[Dict[str, Any]]) -> str:
    lines: List[str] = []
    for idx, section in enumerate(sections, start=1):
        title = section.get("title", "").strip() or f"หัวข้อที่ {idx}"
        lines.append(f"{idx}. {title}")
        bullets = section.get("bullets") or []
        for bullet in bullets:
            bullet_text = str(bullet).strip()
            if bullet_text:
                lines.append(f"- {bullet_text}")
    return "\n".join(lines)


def answer(query: str, top_k: int = DEFAULT_TOP_K) -> Dict[str, Any]:
    """
    Run retrieval-augmented generation and return a structured response.
    """
    if not query or not query.strip():
        raise ValueError("กรุณาระบุคำถามเพื่อให้ AI ตอบกลับ")

    try:
        build_index()
    except RuntimeError as exc:
        message = str(exc) or "ยังไม่มีข้อมูลในคลังความรู้"
        sections = [{"title": "สถานะข้อมูล", "bullets": [message]}]
        return {"answer_text": _build_answer_text(sections), "sections": sections, "sources": []}

    results = _similar_chunks(query, top_k=top_k)
    if not results:
        return {
            "answer_text": "ยังไม่มีข้อมูลในคลังความรู้สำหรับตอบคำถามนี้",
            "sections": [
                {"title": "สถานะข้อมูล", "bullets": ["ยังไม่มีข้อมูลใน data_rag/ หรือคะแนนค้นหาเป็นศูนย์"]}
            ],
            "sources": [],
        }

    context = "\n\n".join([f"[{chunk.source} #{chunk.chunk_id}]\n{chunk.text}" for chunk, _ in results])

    try:
        sections = _sections_from_llm(query, context)
    except Exception:
        sections = _fallback_sections(results)

    answer_text = _build_answer_text(sections)
    sources = [
        {"file": result.source, "chunk_id": result.chunk_id, "score": round(score, 4)}
        for result, score in results
    ]

    return {
        "answer_text": answer_text,
        "sections": sections,
        "sources": sources,
    }


if __name__ == "__main__":
    try:
        build_index(force_rebuild=True)
        print(f"RAG index built successfully at {INDEX_FILE} (chunks: {len(_chunks)})")
    except Exception as exc:
        print("Failed to build RAG index:", exc)
