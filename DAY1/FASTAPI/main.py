from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Student Management API")

# ---------- Pydantic Model ----------
class Student(BaseModel):
    name: str
    age: int
    course: str

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    course: Optional[str] = None

# ---------- In-memory "database" ----------
students_db = {}
next_id = 1

# ---------- CREATE (POST) ----------
@app.post("/students", status_code=201)
def create_student(student: Student):
    global next_id
    students_db[next_id] = student
    response = {"id": next_id, **student.dict()}
    next_id += 1
    return response

# ---------- READ ALL (GET) ----------
@app.get("/students")
def get_all_students():
    return [{"id": sid, **s.dict()} for sid, s in students_db.items()]

# ---------- READ ONE (GET with path parameter) ----------
@app.get("/students/{student_id}")
def get_student(student_id: int):
    if student_id not in students_db:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"id": student_id, **students_db[student_id].dict()}

# ---------- UPDATE (PUT) ----------
@app.put("/students/{student_id}")
def update_student(student_id: int, updated: StudentUpdate):
    if student_id not in students_db:
        raise HTTPException(status_code=404, detail="Student not found")

    stored = students_db[student_id]
    update_data = updated.dict(exclude_unset=True)
    updated_student = stored.copy(update=update_data)
    students_db[student_id] = updated_student

    return {"id": student_id, **updated_student.dict()}

# ---------- DELETE ----------
@app.delete("/students/{student_id}")
def delete_student(student_id: int):
    if student_id not in students_db:
        raise HTTPException(status_code=404, detail="Student not found")
    del students_db[student_id]
    return {"message": f"Student {student_id} deleted successfully"}
