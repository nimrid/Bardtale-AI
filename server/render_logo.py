import math
from PIL import Image, ImageDraw

def create_exact_app_logo(size=512):
    # Create image with smooth gradient
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw smooth gradient background rounded rectangle
    for y in range(size):
        for x in range(size):
            # Check if point is inside rounded rect (radius 128)
            radius = 128
            in_rect = True
            if x < radius and y < radius and (x - radius)**2 + (y - radius)**2 > radius**2:
                in_rect = False
            elif x > size - radius and y < radius and (x - (size - radius))**2 + (y - radius)**2 > radius**2:
                in_rect = False
            elif x < radius and y > size - radius and (x - radius)**2 + (y - (size - radius))**2 > radius**2:
                in_rect = False
            elif x > size - radius and y > size - radius and (x - (size - radius))**2 + (y - (size - radius))**2 > radius**2:
                in_rect = False

            if in_rect:
                factor = (x + y) / (2.0 * size)
                r = int(246 * (1 - factor) + 5 * factor)
                g = int(178 * (1 - factor) + 211 * factor)
                b = int(33 * (1 - factor) + 178 * factor)
                img.putpixel((x, y), (r, g, b, 255))

    img.save("/Users/hng/Documents/antigravity/lively-brahmagupta/client/public/bardtale_logo.png")
    img.save("/Users/hng/Documents/antigravity/lively-brahmagupta/client/public/bardtale_logo.jpg")

if __name__ == "__main__":
    create_exact_app_logo()
