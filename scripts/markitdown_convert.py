#!/usr/bin/env python3
"""MarkItDown CLI wrapper for Book Studio (stdin or file → stdout markdown)."""
from __future__ import annotations

import argparse
import os
import sys
import tempfile
from pathlib import Path


def convert_path(path: str) -> str:
    from markitdown import MarkItDown

    md = MarkItDown(enable_plugins=False)
    result = md.convert(path)
    return result.text_content or ""


def convert_bytes(data: bytes, filename: str) -> str:
    suffix = Path(filename).suffix or ".bin"
    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(data)
            tmp_path = tmp.name
        return convert_path(tmp_path)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert a document to Markdown via MarkItDown")
    parser.add_argument("--file", type=str, help="Path to input file")
    parser.add_argument("--stdin", action="store_true", help="Read file bytes from stdin")
    parser.add_argument("--filename", type=str, default="document.bin", help="Original filename (for stdin)")
    args = parser.parse_args()

    try:
        if args.stdin:
            content = convert_bytes(sys.stdin.buffer.read(), args.filename)
        elif args.file:
            content = convert_path(args.file)
        else:
            parser.error("Provide --file or --stdin")
            return 1

        sys.stdout.write(content)
        if content and not content.endswith("\n"):
            sys.stdout.write("\n")
        return 0
    except Exception as exc:  # noqa: BLE001 — surface conversion errors to Node caller
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
