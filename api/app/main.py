

from fastapi import FastAPI

from app.routers import (
    program,
    trainer,
    trainee,
    cohort,
    enrollment,
    cohort_class,
    reports,
    attendance
)

app = FastAPI(
    title="iSpark Classroom Attendance API",
    description="API for managing classroom attendance, cohorts, trainees, trainers, and reports.",
    version="1.0.0",
)

app.include_router(program.router)
app.include_router(trainer.router)
app.include_router(trainee.router)
app.include_router(cohort.router)
app.include_router(enrollment.router)
app.include_router(cohort_class.router)
app.include_router(reports.router)
app.include_router(attendance.router)

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
