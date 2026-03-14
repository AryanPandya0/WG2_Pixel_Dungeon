# 💀 ABYSSAL DEPTHS

![Abyssal Depths Banner](https://img.shields.io/badge/Status-Complete-success?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow?style=for-the-badge&logo=javascript)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**Abyssal Depths** is a professional-grade 2D procedural dungeon crawler built with a custom HTML5 Canvas engine and Vanilla JavaScript. Experience high-octane action, unique boss mechanics, and a deep retro-pixel aesthetic.

---

## 📜 The Chronicles of the Abyss
Deep beneath the surface of the mortal realm lies the **Abyssal Depths**, a shifting, sentient labyrinth that grows every time a soul is lost within its walls. For centuries, ancient Guardians have protected the treasures of the past, now twisted into monstrous forms by the darkness.

You play as a nameless **Wanderer**, armed with a relic of pure light. Your goal is to descend through the three forbidden layers of the catacombs, defeat the legendary Lords of the Abyss, and cleanse the Necropolis to find your way back to the surface.

---

## 🎮 Key Features
- **Procedural Generation**: Every run features a unique layout generated via a custom random-walker algorithm.
- **Custom Engine**: A hand-coded game engine for a tight, intimate gameplay feel.
- **Neo-Retro Visuals**: Crisp pixel art with dynamic runtime transparency removal and seamless world tiling.
- **3 Epic Boss encounters**:
  - **The Slime King**: A gelatinous mass that grows as it moves.
  - **The Shadow Knight**: A lightning-fast master of the blade.
  - **The Necromancer**: The master of the depths, capable of teleportation and summoning.
- **Responsive UI**: Pixel-perfect health bars and level introductions using the 'Press Start 2P' retro font.

---

## ⌨️ Controls
| Action | Key / Input |
| :--- | :--- |
| **Movement** | `W`, `A`, `S`, `D` or `Arrow Keys` |
| **Aiming** | `Mouse Cursor` |
| **Attack** | `Left Click` |
| **Restart** | `Click Button on Game Over` |

---

## 🛠️ Technical Details
- **Core Stack**: HTML5 Canvas, CSS3, Vanilla JS (No external libraries required).
- **Rendering**: Custom `requestAnimationFrame` loop with `imageSmoothingEnabled = false` for perfect pixel rendering.
- **Camera**: Smooth-follow camera logic with built-in screen shake for impactful combat.
- **Asset Processing**: Runtime pixel-data manipulation to ensure transparent backgrounds for all 32x32 and 64x64 sprites.

---

## 🚀 How to Run Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/AryanPandya0/WG2_Pixel_Dungeon.git
   ```
2. Navigate to the project folder:
   ```bash
   cd WG2_Pixel_Dungeon
   ```
3. Use a local server to avoid CORS issues with assets:
   - **With Python**: `python -m http.server 8080`
   - **With Node.js**: `npx serve .`
4. Open your browser and navigate to `http://localhost:8080`.

---

## 📂 Project Structure
```text
/
├── assets/         # Pixel art PNGs (Characters, Tiles, Bosses)
├── js/             # Game Engine, Level Generation, AI, and Entities
├── index.html      # Main Entry Point
├── style.css       # UI Styling & Layout
└── project_details.txt # Detailed technical documentation
```

---

## 🎨 Credits
**Abyssal Depths** was created by **Aryan Pandya**. 

---

*Cleanse the depths, Wanderer. The surface awaits.*
