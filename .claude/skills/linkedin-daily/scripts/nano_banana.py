#!/usr/bin/env python3
"""Generate an image with Nano Banana (Google Gemini image model).

Dependency-free (stdlib only). Auth via the GEMINI_API_KEY env var.

Get a key: https://aistudio.google.com/apikey  (Google AI Studio → API keys)
Then set it as an environment variable/secret:
    export GEMINI_API_KEY=AIza...

Usage:
    python3 nano_banana.py "<image prompt>" [output.png]

Notes:
- Uses the Gemini image model (a.k.a. "Nano Banana"). Model id is overridable
  with GEMINI_IMAGE_MODEL (default: gemini-2.5-flash-image).
- Requires outbound network access to generativelanguage.googleapis.com — in a
  locked-down environment, that host must be on the allowlist.
"""
import os
import sys
import json
import base64
import urllib.request
import urllib.error

MODEL = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")
ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


def main():
    if len(sys.argv) < 2:
        sys.exit('Usage: nano_banana.py "<image prompt>" [output.png]')
    prompt = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else "nano_banana.png"

    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        sys.exit(
            "ERROR: GEMINI_API_KEY is not set.\n"
            "Get one at https://aistudio.google.com/apikey and export it:\n"
            "  export GEMINI_API_KEY=AIza...\n"
            "Store it as an environment secret in Claude Code on the web."
        )

    url = ENDPOINT.format(model=MODEL) + "?key=" + key
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
    }).encode()

    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        sys.exit(f"ERROR: Gemini API {e.code}\n{e.read().decode(errors='replace')}")
    except urllib.error.URLError as e:
        sys.exit(f"ERROR: network failure reaching Gemini: {e.reason}\n"
                 "(In a locked-down env, allowlist generativelanguage.googleapis.com.)")

    # Find the first inline image part in the response.
    for cand in data.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                with open(out, "wb") as f:
                    f.write(base64.b64decode(inline["data"]))
                print(f"✓ Saved image to {out}")
                return

    sys.exit("ERROR: no image returned. Raw response:\n" +
             json.dumps(data, indent=2)[:2000])


if __name__ == "__main__":
    main()
