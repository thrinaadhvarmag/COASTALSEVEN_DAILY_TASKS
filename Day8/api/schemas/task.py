from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TaskCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=100
    )

    description: str | None = None

    status: str = Field(
        default="Pending",
        max_length=20
    )

    priority: str = Field(
        default="Medium",
        max_length=20
    )

    category_id: int | None = None

    project_id: int

    assignee_id: int | None = None

    due_date: datetime | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=100
    )

    description: str | None = None

    status: str | None = Field(
        default=None,
        max_length=20
    )

    priority: str | None = Field(
        default=None,
        max_length=20
    )

    category_id: int | None = None

    project_id: int | None = None

    assignee_id: int | None = None

    due_date: datetime | None = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str | None
    status: str
    priority: str

    category_id: int | None
    project_id: int
    assignee_id: int | None
    due_date: datetime | None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )