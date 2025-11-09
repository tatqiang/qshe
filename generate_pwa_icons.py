#!/usr/bin/env python3
"""
Generate PWA icons from favicon.png
Creates all required icon sizes for iOS PWA support
"""

from PIL import Image, ImageDraw
import os

def create_icon(source_img, output_path, size, maskable=False):
    """Create an icon of specified size"""
    # Create canvas with teal background (#388087)
    canvas = Image.new('RGB', (size, size), color='#388087')
    
    # Calculate padding for maskable icons (10% safe zone)
    if maskable:
        padding = int(size * 0.1)
        draw_size = size - (padding * 2)
    else:
        padding = 0
        draw_size = size
    
    # Resize source image
    icon = source_img.resize((draw_size, draw_size), Image.Resampling.LANCZOS)
    
    # Paste on canvas
    canvas.paste(icon, (padding, padding), icon if icon.mode == 'RGBA' else None)
    
    # Save as PNG
    canvas.save(output_path, 'PNG', optimize=True)
    print(f"✅ Created: {output_path} ({size}x{size})")

def main():
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    public_dir = os.path.join(script_dir, 'public')
    source_path = os.path.join(public_dir, 'favicon.png')
    
    # Check if source exists
    if not os.path.exists(source_path):
        print(f"❌ Error: favicon.png not found at {source_path}")
        return
    
    # Load source image
    print(f"📂 Loading source image: {source_path}")
    source_img = Image.open(source_path)
    if source_img.mode != 'RGBA':
        source_img = source_img.convert('RGBA')
    
    print(f"✨ Generating PWA icons...")
    
    # Icon configurations
    icons = [
        ('icon-192.png', 192, False),
        ('icon-512.png', 512, False),
        ('icon-192-maskable.png', 192, True),
        ('icon-512-maskable.png', 512, True),
        ('apple-touch-icon.png', 180, False),
    ]
    
    # Generate icons
    for filename, size, maskable in icons:
        output_path = os.path.join(public_dir, filename)
        create_icon(source_img, output_path, size, maskable)
    
    print("\n🎉 All PWA icons generated successfully!")
    print(f"📁 Icons saved to: {public_dir}")
    print("\n📱 Next steps:")
    print("1. Build your project: npm run build")
    print("2. Deploy to your hosting")
    print("3. Test on iOS Safari")
    print("4. Add to Home Screen to install as PWA")

if __name__ == '__main__':
    main()
