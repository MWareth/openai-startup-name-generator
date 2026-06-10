#!/usr/bin/env python3
"""Pre-fill a LinkedIn post with Playwright, then hand control to you to click Post.

RUN THIS ON YOUR OWN COMPUTER — not in the remote/web session. It opens a real
visible browser, so you can see what it's doing and post yourself.

What it does (human-in-the-loop, never auto-posts):
  1. Opens LinkedIn in a persistent browser profile (logs in once, reuses after).
  2. If logged out, logs in with LINKEDIN_EMAIL / LINKEDIN_PASSWORD env vars.
     (Complete any 2FA / security check by hand in the open window.)
  3. Opens the post composer, types your text, and attaches your image.
  4. STOPS. You review and click "Post" yourself.

------------------------------------------------------------------------------
ONE-TIME SETUP (on your machine):
  pip install playwright
  playwright install chromium

  export LINKEDIN_EMAIL="you@example.com"
  export LINKEDIN_PASSWORD="your-password"      # stored as env var, not in code

USAGE:
  python post_to_linkedin.py --text "Your post..." --image ~/pic.png
  python post_to_linkedin.py --text-file ~/linkedin_post.txt --image ~/pic.png

Notes / honesty:
  • LinkedIn's ToS discourage automation. This keeps you in the loop (you click
    Post) and reuses one session to stay low-key, but use it gently.
  • LinkedIn's HTML changes often; if a selector breaks, the script tells you
    which step failed so you can finish that bit by hand.
------------------------------------------------------------------------------
"""
import os
import re
import sys
import argparse

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
except ImportError:
    sys.exit("Playwright not installed. Run:\n  pip install playwright\n  playwright install chromium")

PROFILE_DIR = os.environ.get(
    "LINKEDIN_PROFILE_DIR", os.path.expanduser("~/.linkedin-playwright-profile")
)


def get_text(args):
    if args.text_file:
        return open(args.text_file, encoding="utf-8").read().strip()
    if args.text:
        return args.text
    sys.exit("Provide --text \"...\" or --text-file <path>")


def ensure_logged_in(page):
    page.goto("https://www.linkedin.com/feed/", wait_until="domcontentloaded")
    # Already in? The feed shows a "Start a post" trigger.
    if page.get_by_role("button", name=re.compile("start a post", re.I)).count():
        return
    # Need to log in.
    if page.locator("input#username").count():
        email = os.environ.get("LINKEDIN_EMAIL")
        pw = os.environ.get("LINKEDIN_PASSWORD")
        if email and pw:
            print("→ Logging in with stored credentials…")
            page.fill("input#username", email)
            page.fill("input#password", pw)
            page.get_by_role("button", name=re.compile("sign in", re.I)).first.click()
        else:
            print("→ No LINKEDIN_EMAIL/PASSWORD set. Log in manually in the window.")
    # Wait for the feed — allow up to 3 min for manual 2FA / security checks.
    print("→ Waiting for the LinkedIn feed (complete any 2FA in the window)…")
    try:
        page.wait_for_url(re.compile(r".*/feed.*"), timeout=180000)
    except PWTimeout:
        input("Couldn't confirm login automatically. Finish logging in, then press Enter… ")


def open_composer(page):
    page.get_by_role("button", name=re.compile("start a post", re.I)).first.click()
    # The editor is a Quill contenteditable inside the share dialog.
    editor = page.locator("div.ql-editor[contenteditable='true']").first
    editor.wait_for(state="visible", timeout=15000)
    return editor


def attach_image(page, image_path):
    """Best-effort image attach; LinkedIn's media UI changes often."""
    try:
        with page.expect_file_chooser(timeout=8000) as fc:
            page.get_by_role("button", name=re.compile("add (a )?(photo|media|image)", re.I)).first.click()
        fc.value.set_files(image_path)
        # After selecting, LinkedIn shows a media editor; "Next"/"Done" returns to composer.
        for label in ("next", "done"):
            btn = page.get_by_role("button", name=re.compile(rf"^{label}$", re.I))
            if btn.count():
                btn.first.click()
                page.wait_for_timeout(800)
        print("✓ Image attached.")
    except Exception as e:
        print(f"⚠ Couldn't auto-attach the image ({e}). Add it by hand: {image_path}")


def main():
    ap = argparse.ArgumentParser(description="Pre-fill a LinkedIn post for manual posting.")
    ap.add_argument("--text")
    ap.add_argument("--text-file")
    ap.add_argument("--image")
    args = ap.parse_args()

    text = get_text(args)
    image = os.path.expanduser(args.image) if args.image else None
    if image and not os.path.exists(image):
        sys.exit(f"Image not found: {image}")

    with sync_playwright() as pw:
        ctx = pw.chromium.launch_persistent_context(
            PROFILE_DIR, headless=False, args=["--start-maximized"], no_viewport=True
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()

        ensure_logged_in(page)
        editor = open_composer(page)

        editor.click()
        editor.type(text, delay=12)  # small delay = more human-like typing
        print("✓ Text filled.")

        if image:
            attach_image(page, image)

        print("\n" + "=" * 60)
        print("✅ Draft is loaded in LinkedIn. REVIEW IT, then click 'Post' yourself.")
        print("=" * 60)
        input("Press Enter here once you've posted (closes the browser)… ")
        ctx.close()


if __name__ == "__main__":
    main()
