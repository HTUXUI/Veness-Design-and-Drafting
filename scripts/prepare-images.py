"""Builds web-ready images and the collections manifest from the supplied image library.
Run: python scripts/prepare-images.py "<path to IMAGERY folder>"
Indices refer to the library's sorted filename order."""
import json, os, sys
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else r"C:/Users/harve/Downloads/IMAGERY-20261012T212752Z-1-001/IMAGERY"
OUT = os.path.join(os.path.dirname(__file__), "..", "src")
IMG = os.path.join(OUT, "assets", "img"); os.makedirs(IMG, exist_ok=True)
files = sorted(os.listdir(SRC))
WIDTHS = [480, 960, 1536]

C = [
 dict(slug="country-homes", name="Country homes", type="New home design", status="Concept render", cover=70,
      alt="Concept render of a low country home with timber cladding and a metal roof, set in open grassland",
      blurb="Low, timber-clad homes with metal roofs, set into open paddocks and bushland. Deep verandahs, gravel drives and generous glazing connect each home to its landscape.",
      imgs=[70,2,4,3,20,14,18,19,13,7,21,88,5,8,71,72]),
 dict(slug="hillside-residences", name="Hillside residences", type="New home design", status="Concept render", cover=80,
      alt="Concept render of a two-storey home with gabled glazing on a hillside at sunset",
      blurb="Larger two-storey concepts that use slope and view, with gabled glazing, layered rooflines and gravel approaches.",
      imgs=[80,73,74,75,76,77,78,79,81,86]),
 dict(slug="modern-farmhouse", name="Modern farmhouse homes", type="New home design", status="Concept render", cover=41,
      alt="Concept render of a white board-and-batten farmhouse-style home with a front verandah and dormer windows",
      blurb="White board-and-batten homes with dark roofs, front porches and timber garage doors, designed for suburban and village blocks.",
      imgs=[41,25,26,27,28,30,32,33,34,35,36,37,38,39,40,42,43,44,45,51]),
 dict(slug="contemporary-family-homes", name="Contemporary family homes", type="New home design", status="Concept render", cover=64,
      alt="Concept render of a contemporary single-storey family home with a timber entry and a landscaped front garden",
      blurb="Clean-lined single and two-storey homes in render, stone and timber, with covered entries and low-maintenance native gardens.",
      imgs=[64,24,29,31,52,57,58,59,60,61,62,63,65,66,67,68,69]),
 dict(slug="bowral-streetscapes", name="Bowral streetscape concepts", type="New home design", status="Concept render", cover=53,
      alt="Concept render of a Bowral street lined with new homes, with a stone entry sign in the foreground",
      blurb="Concept streetscapes showing how a group of homes can sit together in the Southern Highlands landscape.",
      imgs=[53,54,55,56]),
 dict(slug="formal-garden-homes", name="Homes with formal gardens", type="New home design", status="Concept render", cover=83,
      alt="Concept render of a single-storey home with a hedged front garden and a stepped entry path",
      blurb="Traditional and transitional homes set behind structured gardens, with symmetrical frontages and stepped entries.",
      imgs=[83,82,84,85]),
 dict(slug="living-spaces", name="Living spaces", type="Interior design", status="Concept render", cover=48,
      alt="Concept render of an open-plan living area with exposed timber beams, a fireplace and a kitchen island",
      blurb="Open living areas and fireplace walls with warm timber, built-in shelving and a calm natural palette.",
      imgs=[48,0,87,91,50,49,46,15]),
 dict(slug="kitchen-and-dining", name="Kitchen and dining", type="Interior design", status="Status to be confirmed", cover=23,
      alt="White kitchen with under-cabinet lighting, a cooktop, built-in oven and a coffee station",
      blurb="Kitchen and dining areas planned for everyday use, with practical joinery, concealed storage and soft lighting.",
      imgs=[23,97]),
 dict(slug="studies-and-nooks", name="Studies and nooks", type="Interior design", status="Concept render", cover=16,
      alt="Concept render of a home study with a timber desk, built-in shelving and a garden view",
      blurb="Small working spaces carved out of the plan: built-in desks, shelving and good daylight.",
      imgs=[16,22,98]),
 dict(slug="entries-and-storage", name="Entries, laundry and storage", type="Interior design", status="Concept render", cover=47,
      alt="Concept render of a home entry with a console table, mirror and timber-framed opening",
      blurb="The practical spaces that make a house work: entries with seating, mudroom joinery and well-planned laundries.",
      imgs=[47,89,11,90,92,1,17]),
]

used = {}
def process(i, base):
    im = Image.open(os.path.join(SRC, files[i])).convert("RGB")
    w, h = im.size; ws = [x for x in WIDTHS if x < w] + [min(w, WIDTHS[-1])]
    ws = sorted(set(ws))
    for tw in ws:
        r = im if tw == w else im.resize((tw, round(h * tw / w)), Image.LANCZOS)
        r.save(os.path.join(IMG, f"{base}-{tw}.webp"), "WEBP", quality=78, method=5)
    return dict(id=base, w=w, h=h, widths=ws)

manifest = []
for c in C:
    items = []
    for n, i in enumerate(c["imgs"], 1):
        if i in used: raise SystemExit(f"image {i} used twice")
        used[i] = c["slug"]
        base = f"{c['slug']}-{n:02d}"
        d = process(i, base); d["alt"] = f"{c['alt']}" if n == 1 else f"{c['name']}: concept view {n}"
        d["source"] = files[i]; items.append(d)
    out = {k: v for k, v in c.items() if k not in ("imgs", "cover")}; out["images"] = items
    manifest.append(out)
json.dump(manifest, open(os.path.join(OUT, "data", "collections.json"), "w"), indent=1)

# Logo: mark + reversed lockup (navy wordmark recoloured off-white; the V mark is untouched)
logo = Image.open(os.path.join(SRC, "VDD Logo.png")).convert("RGBA")
rev = logo.copy(); px = rev.load()
for y in range(520, rev.size[1]):
    for x in range(rev.size[0]):
        r, g, b, a = px[x, y]
        if a: px[x, y] = (245, 243, 239, a)
rev.save(os.path.join(OUT, "assets", "logo-reversed.png"))
mark = logo.crop((120, 60, 520, 515)); mark.save(os.path.join(OUT, "assets", "logo-mark.png"))
fav = Image.new("RGBA", (128, 128), (8, 8, 8, 255)); m = mark.copy(); m.thumbnail((104, 104)); fav.alpha_composite(m, ((128 - m.width) // 2, (128 - m.height) // 2)); fav.save(os.path.join(OUT, "assets", "favicon.png"))
skipped = [files[i] for i in range(len(files)) if i not in used]
print("images used:", len(used)); print("not used:", skipped)
