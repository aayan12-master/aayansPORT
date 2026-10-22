import os
from PIL import Image

os.makedirs('public/assets', exist_ok=True)
sheet = Image.open('asset_sheet.png').convert('RGBA')
entire = Image.open('entire_portfolio_visual.png').convert('RGBA')

# 1. Researcher Silhouette from asset_sheet (0, 0, 360, 580)
sil = sheet.crop((0, 0, 360, 580))
sil.save('public/assets/researcher_raw.png')

# 2. Skyscraper glitch architecture (360, 0, 690, 580)
sky = sheet.crop((360, 0, 690, 580))
sky.save('public/assets/glitch_skyscraper.png')

# 3. Orange Circle (690, 0, 1025, 400)
circ = sheet.crop((700, 10, 1015, 380))
circ.save('public/assets/orange_circle_ring.png')

# 4. Polaroid Research (1030, 10, 1310, 290)
pol_res = sheet.crop((1025, 5, 1312, 285))
pol_res.save('public/assets/polaroid_research.png')

# 5. Polaroid Ideas (1030, 290, 1310, 570)
pol_ideas = sheet.crop((1025, 290, 1312, 570))
pol_ideas.save('public/assets/polaroid_ideas.png')

# 6. Handwritten checklist (0, 580, 360, 870)
chk = sheet.crop((20, 590, 350, 860))
chk.save('public/assets/handwritten_checklist.png')

# 7. Terminal box (380, 600, 670, 750)
term = sheet.crop((380, 600, 670, 745))
term.save('public/assets/terminal_box.png')

# 8. Taped paper diagram (705, 585, 1010, 860)
paper_diag = sheet.crop((705, 585, 1010, 860))
paper_diag.save('public/assets/taped_paper_diag.png')

# 9. World map with target crosshair (1015, 585, 1310, 765)
map_target = sheet.crop((1015, 585, 1310, 765))
map_target.save('public/assets/world_map_target.png')

# 10. Barcode (1020, 770, 1150, 860)
barcode = sheet.crop((1020, 770, 1150, 850))
barcode.save('public/assets/barcode.png')

# 11. Architectural blocks from row 3
arch1 = sheet.crop((10, 880, 350, 1190))
arch1.save('public/assets/glitch_arch_1.png')

net_tree = sheet.crop((360, 880, 520, 1190))
net_tree.save('public/assets/network_tree.png')

arch2 = sheet.crop((530, 880, 780, 1190))
arch2.save('public/assets/glitch_arch_2.png')

brush_marks = sheet.crop((790, 880, 1310, 1190))
brush_marks.save('public/assets/distressed_brush_marks.png')

# Center collage from entire_portfolio_visual.png
center_assembled = entire.crop((440, 30, 1240, 980))
center_assembled.save('public/assets/center_assembled_reference.png')

# Torn paper note "Same Systems. New Questions." from entire
torn_note = entire.crop((800, 680, 1170, 860))
torn_note.save('public/assets/torn_paper_note.png')

# "AAYAN." heading texture from entire
aayan_heading = entire.crop((40, 195, 450, 300))
aayan_heading.save('public/assets/aayan_heading_texture.png')

# CTA button from entire
cta_btn = entire.crop((40, 485, 430, 580))
cta_btn.save('public/assets/ref_cta_button.png')

# Location India badge from entire
loc_badge = entire.crop((685, 38, 805, 96))
loc_badge.save('public/assets/location_badge.png')

# Center silhouette cropped from entire for perfect alignment:
# In entire: researcher silhouette is located around x: 490 to 1050, y: 150 to 800
ref_silhouette = entire.crop((480, 180, 990, 750))
ref_silhouette.save('public/assets/ref_silhouette_centered.png')

print("All assets successfully extracted and saved!")
