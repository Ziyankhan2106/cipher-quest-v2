# CipherQuest Design System

## 1. Core Philosophy & Mood
CipherQuest employs a **Cyberpunk / Advanced Terminal** aesthetic. It moves away from standard flat web design, aiming to feel like a high-end interface used by elite operatives to crack military-grade encryptions. The core mood is dark, technical, neon-lit, and highly responsive. Architectural honesty is abandoned in favor of simulated infrastructure (like scanlines, grids, and glowing data nodes).

## 2. Global Theming Engine
Instead of relying on a single static color, the application uses a dynamic thematic system driven by the user's selected "Avatar/Callsign". 

### Available Themes (The "Avatars")
- **Cyber Cyan:** `#00e5ff` (Default)
- **Matrix Green:** `#00ff88`
- **Neon Purple:** `#b200ff`
- **Plasma Orange:** `#ff8800`
- **Laser Magenta:** `#ff00aa`

### Implementation
- The selected theme dictates the CSS variable `--current-theme-color`.
- Tailwinds `color-mix()` is leveraged extensively to generate alpha transparencies of the active theme color on the fly (e.g., `color-mix(in srgb, var(--current-theme-color) 20%, transparent)`), ensuring borders, shadows, backgrounds, and glows perfectly match the user's chosen aesthetic without needing duplicate Tailwind classes.

## 3. Typography Hierarchy
Typography is strictly categorized to differentiate between atmospheric headers, standard content, and technical data.

- **Display (`font-display`):** Used for massive background numbers, primary headers, and sector titles. Heavy, bold, and unapologetic.
- **Sans (`font-sans`):** Used for mission names and readable descriptions. Clean and legible.
- **Mono (`font-mono`):** Pervasive throughout the UI. Used for all technical details, tracking numbers, timestamps, IDs, and button labels. It reinforces the "terminal" feel. Always paired with `uppercase` and `tracking-[0.2em]` or `tracking-widest` for wide, stable layouts.

## 4. Backgrounds & Environment
The background is built in layered depth, completely avoiding flat colors.

1. **Base Layer:** Deep void black (`#050505`).
2. **Texture Layer:** `background.jpg` applied heavily zoomed/covered, with `opacity: 0.15` and `mix-blend-mode: luminosity` to desaturate the image and blend it into the dark base, creating a subtle, gritty cyberpunk cityscape feel without overpowering UI readability.
3. **Ambient Light (Nebulas):** Large, absolute-positioned `div`s with `filter: blur(100px)` or `blur(200px)` scattered in the corners. These use the `--current-theme-color` combined with `mix-blend-screen` to simulate neon light bleeding from off-screen signs into the terminal viewport.
4. **Technical Grid:** An SVG-like or CSS-gradient `grid-bg` overlaying a 1px technical grid to map out the interface's mathematical precision.
5. **Vignette:** A radial gradient from transparent to black at the edges to focus user attention towards the center of the screen.

## 5. Components & Layouts

### The Node Map (Dashboard)
- A horizontal, side-scrolling timeline representing "Sectors" and "Missions".
- A central horizontal gradient line connects all elements.
- **Chapter Markers:** Massive, semi-transparent (`opacity-30`) display font numbers floating behind the content (`01`, `02`).
- **Cards (Missions):** 
  - Rest State: Semi-transparent black (`bg-surface-panel/80`), subtle white borders.
  - Hover State: Card lifts up (`-translate-y-4`), shadow intensifies, and border glows with the theme color. A progress line (`mission-accent-line`) animates from 0 to 100% width along the bottom edge.
  - Iconography: Desaturated icons at rest, which scale up (`scale-110`) and glow with `drop-shadow` on hover.

### Glass Panels
The foundational container for modals, labs, and info sections.
- Combination of `backdrop-filter: blur(20px)` and semi-transparent gradients `linear-gradient(...)`.
- Top inner box-shadow (`inset 0 1px 0 ...`) to simulate physical light hitting the top edge of a glass pane.
- Outer heavy drop shadows.

### Buttons & Inputs
- **Primary Actions:** Solid backgrounds utilizing `--current-theme-color` combined with dark text. Highly visible focus rings (`focus-visible:ring-4`) and hover transformations (`translate-y-1`, `shadow`). Includes sliding ambient reflections (`translate-x-full` animation).
- **Secondary Actions:** Minimalist outline buttons, typically white or theme-colored with low opacity backgrounds (`hover:bg-white/10`).
- Always uppercase, always monospaced.

## 6. Micro-Interactions & Animation (Motion)
Motion is used to simulate power cycles, decryption sequences, and feedback.

- **Completion Effects:**
  - **Screen Flash:** Upon completing a mission or sector, a temporary `div` covers the screen, flashes the theme color with `overlay` blend mode, and fades out, simulating a power surge.
  - **Confetti:** Complex `canvas-confetti` algorithms are fired with extreme velocity and wide spreads, using exactly the hex code of the current theme alongside white. Multi-layered bursts for chapter completion.
  - **Card Evolution:** Using the `motion` library, the card springs up, flashes its borders with the theme color, and permanently locks into a "Completed" state (solid them-colored bottom border, checked icon with neon drop-shadows).
- **Haptic/Hover Feedback:** Almost every interactive element scales, brightly illuminates via drop shadows, or spins (e.g., the badge icon spin on hover).

## 7. Dynamic Badge System (Canvas Rendering)
To reward users, the application generates a downloadable "Clearance Certificate" using HTML5 `<canvas>`.
- The design of the badge mimics a classified dossier.
- **Details:** 
  - Dual linear gradients on the background.
  - A procedural technical grid drawn via `ctx.lineTo/moveTo`.
  - Cyberpunk corner bracket accents.
  - Authentic layout mimicking terminal outputs: Operative Callsign, exact timestamps, and "ENCRYPTED" tags.
  - Faux barcodes generated utilizing `Math.random()` to draw sequential vertical lines.
  - Text wrapping functions built perfectly for the canvas description injection.
