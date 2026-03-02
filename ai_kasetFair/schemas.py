from pydantic import BaseModel
from typing import Optional, Dict, Any

class IngestQuery(BaseModel):
    content: str
    metadata: Optional[Dict[str, Any]] = None

class RagQuery(BaseModel):
    question: str
    top_k: int = 5

class UserQuery(BaseModel):
    name: str
    theme: str
    concept: str
    location: str
    size: str
    equipment: str
    funding: str
    staff: str
    hours: str
    products: str
    store_id: str