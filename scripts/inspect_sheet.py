from PIL import Image
import os

sheet = Image.open('asset_sheet.png')
print("Sheet size:", sheet.size)

os.makedirs('public/assets', exist_ok=True)

# Grid layout analysis:
# Width is 1312, Height is 1199
# Let's inspect coordinates of key items:
# 1. Researcher portrait in top-left
# 2. Skyscraper glitch architecture in top-center
# 3. Orange brush circle in top-right-center
# 4. Polaroids (Research.. and Ideas..) in top-right
# 5. Checklist & handwritten text in mid-left
# 6. Terminal prompt black block in mid-center
# 7. Paper scrap diagram in mid-right-center
# 8. World map & barcode in mid-right
# 9. Architectural blocks & network node diagram at bottom

# Let's crop initial candidate regions and print their info:
crops = {
    "researcher_silhouette.png": (0, 0, 360, 580),
    "glitch_skyscraper.png": (360, 0, 690, 580),
    "orange_circle_full.png": (690, 0, 1025, 400),
    "orange_marks.png": (690, 400, 1025, 580),
    "polaroid_research.png": (1025, 0, 1312, 300),
    "polaroid_ideas.png": (1025, 290, 1312, 580),
    "handwritten_checklist.png": (0, 580, 360, 870),
    "terminal_box.png": (370, 595, 680, 755),
    "brush_bar_black.png": (370, 755, 680, 860),
    "taped_paper_scrap.png": (700, 580, 1015, 870),
    "world_map.png": (1015, 580, 1312, 770),
    "barcode.png": (1020, 770, 1150, 860),
    "globe_wireframe.png": (1190, 770, 1312, 860),
    "glitch_block_1.png": (0, 870, 360, 1199),
    "network_tree.png": (360, 870, 530, 1199),
    "glitch_block_2.png": (530, 870, 790, 1199),
    "duct_tape_and_marks.png": (790, 870, 1312, 1199),
}

for name, box in crops.items():
    cropped = sheet.crop(box)
    cropped.save(os.path.join('public/assets', name))
    print(f"Saved {name}: {box} -> size {cropped.size}")
