from fastapi import FastAPI

app = FastAPI(title="Karyo API")

@app.get("/health")
def health():
    return {"status": "ok"}
