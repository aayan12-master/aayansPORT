from PIL import Image

def make_bg_transparent(img_path, out_path):
    img = Image.open(img_path).convert('RGBA')
    datas = img.getdata()
    new_data = []

    for item in datas:
        r, g, b, a = item
        # If it's light cream background:
        # r > 218, g > 212, b > 195, and r close to g
        if r > 215 and g > 210 and b > 192 and abs(r - g) < 20 and abs(g - b) < 30:
            # Calculate subtle transparency falloff for smooth anti-aliased edge
            diff = (r + g + b) / 3.0
            if diff > 230:
                new_data.append((r, g, b, 0))
            else:
                alpha = int((235 - diff) / 20.0 * 255.0)
                new_data.append((r, g, b, max(0, min(255, alpha))))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(out_path, 'PNG')
    print(f"Processed {img_path} -> {out_path}")

make_bg_transparent('public/assets/researcher_raw.png', 'public/assets/researcher_transparent.png')
make_bg_transparent('public/assets/glitch_skyscraper.png', 'public/assets/skyscraper_transparent.png')
make_bg_transparent('public/assets/orange_circle_ring.png', 'public/assets/orange_ring_transparent.png')
make_bg_transparent('public/assets/world_map_target.png', 'public/assets/world_map_transparent.png')
