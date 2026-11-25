# Asset Guidelines — for Sergi

This guide explains what images and files the website needs and how to send them. The site will only show **your real work**. Anything still missing appears as a placeholder that is clearly marked as one.

## 1. Painting photographs

- Shoot from the front with the camera parallel to the canvas, and include the whole painting.
- Use even, diffuse light: daylight near a window or two lamps at 45°. No glare and no reflections.
- No filters and no "enhancing". Colours should match the real painting.
- Send the largest original file you have (JPG/TIFF/PNG at full resolution). Do not send screenshots or WhatsApp-compressed images.
- Optional: detail shots (texture, brushstrokes) and a photo of the painting on a wall for scale.

For each painting, also send: **title, year, medium, dimensions (cm), short description, status** (available / sold / archived).

## 2. Artist lettering (your name)

- The site uses **your own handwritten "Sergi Tugas"**. It will never be replaced with a generic font.
- Best: write it several times in black ink on white paper, scan at 600 dpi or more, and send the scan. It will be turned into an SVG.
- Even better if possible: send a vector file (SVG/AI/PDF).

## 3. Portrait and studio

- A portrait of you, plus studio photos: brushes, paints, sketches, work in progress, printing, packing.
- Horizontal and vertical versions if possible. Original files.

## 4. Doodles and graphic marks

- Stars, dots, strokes, small symbols. Draw them on white paper, one per area with space around each, and scan at 600 dpi.
- Each mark becomes its own SVG file so it can be animated on its own.

## 5. Art Mail Club / PLACES WE KEEP Nº 001

- Final artwork for the A6 postcard (front and back), the 3 stickers, the A7 story card, the collector detail and the envelope/seal.
- Print-ready files (PDF/TIFF, CMYK, with bleed) are kept separately from the web versions. Web versions are generated from the originals.

## How files are organised (for developers)

```
public/images/artist/{portrait,studio}/
public/images/artworks/<painting-slug>/
public/images/collections/places-we-keep/{hero,postcard,stickers,story-card,packaging}/
public/textures/{paper,acrylic,brush}/
public/illustrations/{lettering,doodles,graphic-elements}/
```

- Names are kebab-case and descriptive: `artwork-<slug>-original.jpg`, `hero-lettering.svg`, `hero-doodle-01.svg`.
- Originals are always kept. Optimised WebP/AVIF versions are generated from them and never replace them.
- Alt text describes only what can actually be seen. It is reviewed with Sergi.
- Very large originals may be stored outside the git repo (to be decided in Phase 2).
