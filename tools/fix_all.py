import PIL.Image as Image
import numpy as np
import os
import subprocess

ACTIONS_DIR = 'public/assets/generated/actions'

def fix_abyss_dragon():
    path = os.path.join(ACTIONS_DIR, 'abyss-dragon', 'idle.png')
    img = Image.open(path).convert('RGBA')
    arr = np.array(img)
    cw, ch = 2048 // 3, 2048 // 3

    def get_cell(r, c):
        return arr[r*ch:(r+1)*ch, c*cw:(c+1)*cw].copy()

    def blend(c1, c2, w2=0.5):
        a1 = c1[:, :, 3].astype(float) / 255.0
        a2 = c2[:, :, 3].astype(float) / 255.0
        w1 = 1.0 - w2
        a_out = a1 * w1 + a2 * w2
        out = np.zeros_like(c1)
        mask = a_out > 0
        for i in range(3):
            out[:, :, i][mask] = np.clip((c1[:, :, i][mask] * a1[mask] * w1 + c2[:, :, i][mask] * a2[mask] * w2) / a_out[mask], 0, 255)
        out[:, :, 3] = np.clip(a_out * 255.0, 0, 255)
        return out

    f1 = get_cell(0, 0)
    f2 = get_cell(0, 1)
    f4 = get_cell(1, 0)
    f8 = get_cell(2, 1)

    # Frame 3 = Cell (0, 2)
    f3_new = blend(f2, f4, 0.5)
    # Frame 9 = Cell (2, 2)
    f9_new = blend(f8, f1, 0.5)

    arr[0*ch:1*ch, 2*cw:3*cw] = f3_new
    arr[2*ch:3*ch, 2*cw:3*cw] = f9_new

    # Clear outer 8px border
    arr[:8, :, 3] = 0
    arr[-8:, :, 3] = 0
    arr[:, :8, 3] = 0
    arr[:, -8:, 3] = 0

    Image.fromarray(arr).save(path)
    print('Fixed abyss-dragon/idle.png')

def fix_storm_colossus():
    path = os.path.join(ACTIONS_DIR, 'storm-colossus', 'idle.png')
    img = Image.open(path).convert('RGBA')
    arr = np.array(img)
    cw, ch = 2048 // 3, 2048 // 3

    # Key out magenta matte (r > 180, g < 60, b > 180)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    magenta_mask = (r > 170) & (g < 70) & (b > 170)
    arr[magenta_mask, 3] = 0

    def get_cell(row, col):
        return arr[row*ch:(row+1)*ch, col*cw:(col+1)*cw].copy()

    def blend(c1, c2, w2=0.5):
        a1 = c1[:, :, 3].astype(float) / 255.0
        a2 = c2[:, :, 3].astype(float) / 255.0
        w1 = 1.0 - w2
        a_out = a1 * w1 + a2 * w2
        out = np.zeros_like(c1)
        mask = a_out > 0
        for i in range(3):
            out[:, :, i][mask] = np.clip((c1[:, :, i][mask] * a1[mask] * w1 + c2[:, :, i][mask] * a2[mask] * w2) / a_out[mask], 0, 255)
        out[:, :, 3] = np.clip(a_out * 255.0, 0, 255)
        return out

    f6 = get_cell(1, 2)
    f8 = get_cell(2, 1)

    # Frame 7 = Cell (2, 0)
    f7_new = blend(f6, f8, 0.5)
    arr[2*ch:3*ch, 0*cw:1*cw] = f7_new

    # Clear outer 8px border
    arr[:8, :, 3] = 0
    arr[-8:, :, 3] = 0
    arr[:, :8, 3] = 0
    arr[:, -8:, 3] = 0

    Image.fromarray(arr).save(path)
    print('Fixed storm-colossus/idle.png')

def fix_prism_queen():
    path = os.path.join(ACTIONS_DIR, 'prism-queen', 'defeat.png')
    img = Image.open(path).convert('RGBA')
    arr = np.array(img)
    cw, ch = 2048 // 3, 2048 // 3

    def get_cell(row, col):
        return arr[row*ch:(row+1)*ch, col*cw:(col+1)*cw].copy()

    # Let's inspect Frame 6 (row 1, col 2) or Frame 5 (row 1, col 1)
    # We want to create a flat lying down pose for Frame 7 (2,0), Frame 8 (2,1), Frame 9 (2,2)
    # Let's extract the figure from Frame 6 and rotate/lay it down horizontally.
    cell6 = get_cell(1, 2)
    cell6_img = Image.fromarray(cell6)

    # Bounding box of non-transparent in cell6
    alpha = np.array(cell6_img)[:, :, 3]
    y_indices, x_indices = np.where(alpha > 16)
    y0, y1 = y_indices.min(), y_indices.max()
    x0, x1 = x_indices.min(), x_indices.max()

    fig_crop = cell6_img.crop((x0, y0, x1 + 1, y1 + 1))
    
    # Rotate figure to lay flat (e.g. rotate -80 degrees)
    fig_flat = fig_crop.rotate(-80, expand=True, resample=Image.BICUBIC)
    
    fw, fh = fig_flat.size
    
    # Position flat figure in cell so feet/body sit on ground baseline (y ~ ch - fh - 50)
    canvas_cell8 = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    paste_x = (cw - fw) // 2
    paste_y = ch - fh - 60
    canvas_cell8.paste(fig_flat, (paste_x, paste_y), fig_flat)

    # Frame 7: transition (partially rotated, e.g. -45 degrees)
    fig_trans = fig_crop.rotate(-45, expand=True, resample=Image.BICUBIC)
    tw, th = fig_trans.size
    canvas_cell7 = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    canvas_cell7.paste(fig_trans, ((cw - tw) // 2, ch - th - 60), fig_trans)

    # Put cell 7, cell 8, cell 9 into array
    arr[2*ch:3*ch, 0*cw:1*cw] = np.array(canvas_cell7)
    arr[2*ch:3*ch, 1*cw:2*cw] = np.array(canvas_cell8)
    arr[2*ch:3*ch, 2*cw:3*cw] = np.array(canvas_cell8) # Frame 8 & 9 identical flat on ground

    # Clear outer 8px border
    arr[:8, :, 3] = 0
    arr[-8:, :, 3] = 0
    arr[:, :8, 3] = 0
    arr[:, -8:, 3] = 0

    Image.fromarray(arr).save(path)
    print('Fixed prism-queen/defeat.png')

if __name__ == '__main__':
    fix_abyss_dragon()
    fix_storm_colossus()
    fix_prism_queen()
