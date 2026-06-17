"""MarkItDown HTTP API — Vercel/로컬 Node에서 MARKITDOWN_SERVICE_URL로 호출."""
from __future__ import annotations

import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from markitdown import MarkItDown

app = FastAPI(title="Book Studio MarkItDown API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

_converter = MarkItDown(enable_plugins=False)
MAX_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(50 * 1024 * 1024)))


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/convert")
async def convert(file: UploadFile = File(...)) -> dict[str, str]:
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 50MB)")

    suffix = Path(file.filename or "document.bin").suffix or ".bin"
    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(data)
            tmp_path = tmp.name
        result = _converter.convert(tmp_path)
        return {"markdown": result.text_content or ""}
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
