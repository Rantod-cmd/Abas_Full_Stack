from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field

class IngestQuery(BaseModel):
    content: str
    metadata: Optional[Dict[str, Any]] = None

class RagQuery(BaseModel):
    question: str
    top_k: int = 5

class CogsQuery(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    store_id: str = Field(..., alias="storeId")
    product: str

class PlanRequest(BaseModel):
    """
    Accepts either a simple idea string or full booth form fields.
    Using optional fields avoids 422 when the frontend sends the entire form.
    """
    model_config = ConfigDict(extra="allow", populate_by_name=True)
    idea: Optional[str] = None
    name: Optional[str] = None
    theme: Optional[str] = None
    concept: Optional[str] = None
    location: Optional[str] = None
    size: Optional[str] = None
    equipment: Optional[str] = None
    funding: Optional[str] = None
    staff: Optional[str] = None
    hours: Optional[str] = None
    products: Optional[str] = None
    store_id: Optional[str] = Field(default=None, alias="storeId")

class UserQuery(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

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
    store_id: str = Field(..., alias="storeId")
