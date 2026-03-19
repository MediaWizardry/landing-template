#!/usr/bin/env python3
"""
brand-generate.py — Generate brand assets using Google Gemini API (Nano Banana)

Generates logo, hero image, and product mockup from config.json.
Requires: pip install google-generativeai

Usage:
  GEMINI_API_KEY=... python3 tools/brand-generate.py [config.json]

Assets are saved to public/assets/
"""

import json
import sys
import os
import base64
from pathlib import Path

try:
    import google.generativeai as genai
except ImportError:
    print("Error: Install google-generativeai — pip install google-generativeai")
    sys.exit(1)


def main():
    # ── Config ──
    config_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("config.json")
    if not config_path.exists():
        print(f"Error: {config_path} not found")
        sys.exit(1)

    config = json.loads(config_path.read_text())
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set")
        sys.exit(1)

    genai.configure(api_key=api_key)

    # ── Extract brand info ──
    brand = config.get("brand", {})
    product = config["product_name"]
    desc = config.get("meta_description", "")
    hero_sub = config.get("hero", {}).get("subheadline", desc)

    primary = brand.get("primary", "#6366F1")
    secondary = brand.get("secondary", "#EC4899")
    accent = brand.get("accent", "#F59E0B")
    dark = brand.get("dark", "#0F172A")

    # ── Output directory ──
    output_dir = config_path.parent / "public" / "assets"
    output_dir.mkdir(parents=True, exist_ok=True)

    # ── Asset definitions ──
    # Each asset: (filename, prompt, aspect_ratio, model)
    # Use Pro model for logo (needs precision), Flash for hero/mockup (speed)
    assets = [
        (
            "logo.png",
            f"""Create a minimal, modern logo mark (icon only, NO text) for a tech product called "{product}".
Brand essence: {hero_sub}
Color palette: primary {primary}, secondary {secondary}, accent {accent}.
Style: clean geometric shapes, professional, suitable for dark backgrounds.
Background: solid dark color ({dark}).
The mark should be simple enough to work at 32x32px but detailed enough to look premium at 512x512px.
Modern SaaS aesthetic — think Stripe, Linear, Vercel level quality.""",
            "1:1",
            "gemini-2.0-flash-exp"
        ),
        (
            "hero.png",
            f"""Create an abstract hero image for a landing page.
Product: "{product}" — {hero_sub}
Style: dark background ({dark}), with flowing abstract shapes and subtle glowing light trails
in {primary} and {secondary}. Ethereal, futuristic, premium feel.
NO text, NO UI elements, NO devices — pure abstract art suitable as a background/accent image.
Should feel like light moving through space. High-end SaaS aesthetic.
Aspect ratio: 16:9, high resolution.""",
            "16:9",
            "gemini-2.0-flash-exp"
        ),
        (
            "mockup.png",
            f"""Create a photorealistic product mockup showing a modern laptop displaying a SaaS dashboard.
The dashboard is for "{product}" — {hero_sub}
Dashboard UI: dark theme using {dark} as background, with data visualizations, cards, and charts
accented in {primary} and {secondary}. Clean, modern interface — think Linear or Vercel dashboard.
The laptop should be a MacBook Pro style device, slightly angled (3/4 perspective),
floating with a subtle shadow beneath it.
Background: very dark, almost black, with subtle gradient lighting in {primary} at low opacity.
The screen should look realistic with the UI clearly visible and readable.
Professional product photography style.""",
            "16:9",
            "gemini-2.0-flash-exp"
        ),
    ]

    # ── Generate ──
    for filename, prompt, aspect_ratio, model_name in assets:
        out_path = output_dir / filename
        print(f"\n{'='*60}")
        print(f"Generating: {filename}")
        print(f"Model: {model_name}")
        print(f"{'='*60}")

        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                [prompt],
                generation_config={
                    "response_modalities": ["TEXT", "IMAGE"],
                }
            )

            # Extract image from response
            saved = False
            if response.candidates:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, "inline_data") and part.inline_data:
                        img_bytes = base64.b64decode(part.inline_data.data)
                        out_path.write_bytes(img_bytes)
                        size_kb = len(img_bytes) / 1024
                        print(f"  Saved: {out_path} ({size_kb:.0f} KB)")
                        saved = True
                        break

            if not saved:
                print(f"  Warning: No image data in response for {filename}")
                # Print any text response for debugging
                for part in response.candidates[0].content.parts:
                    if hasattr(part, "text") and part.text:
                        print(f"  Response text: {part.text[:200]}")

        except Exception as e:
            print(f"  Error generating {filename}: {e}")
            continue

    # ── Generate favicon from logo ──
    logo_path = output_dir / "logo.png"
    favicon_path = output_dir / "favicon.png"
    if logo_path.exists() and not favicon_path.exists():
        try:
            # If PIL is available, resize logo to favicon
            from PIL import Image
            img = Image.open(logo_path)
            img = img.resize((32, 32), Image.LANCZOS)
            img.save(favicon_path)
            print(f"\n  Generated favicon from logo: {favicon_path}")
        except ImportError:
            # No PIL — just copy logo as favicon
            import shutil
            shutil.copy2(logo_path, favicon_path)
            print(f"\n  Copied logo as favicon (install Pillow for proper resizing)")

    print(f"\n{'='*60}")
    print(f"Done! Assets saved to: {output_dir}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
