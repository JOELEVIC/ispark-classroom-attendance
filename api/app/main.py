

from fastapi import FASTAPI

app = FASTAPI()

@app.get("/")
def root(): 
    return {"message":" Hello there "}