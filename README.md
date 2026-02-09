# ChessBase India - Social Post Creator

A browser-based tool for creating social media posts for chess content. Upload photos, add text with rich styling, apply overlays, and export -- no design software or admin needed.

Built for [ChessBase India](https://www.youtube.com/@ChessBaseIndia), open-sourced for the chess community.

## Features

### Canvas
- **Size presets** -- Instagram Post (1080x1080), Instagram Story (1080x1920), Twitter/X (1200x675), Facebook (1200x630)
- **Photo upload** with adjustable padding
- **Background color** or **gradient background** with direction control

### Text
- **Multiple text layers** -- add, remove, select independently
- **35 Google Fonts** -- Inter, Montserrat, Bebas Neue, Playfair Display, Permanent Marker, and more
- **8 font weights** -- Thin, Light, Regular, Medium, SemiBold, Bold, ExtraBold, Black
- **Italic** toggle
- **Text transform** -- uppercase, lowercase, capitalize
- **Gradient fill** -- two-color gradient on text with direction control
- **Stroke/outline** with adjustable width
- **Background highlight**, drop shadow, opacity, line height, character spacing
- **Drag, resize, and edit inline** on the canvas

### Overlays
- **Dark fade** -- directional gradient overlay (bottom/top/left/right) with strength and size controls
- **Vignette** -- radial darkening from edges with strength, size, and color

### Logo
- ChessBase India logo with scale and opacity controls, freely draggable

### Templates
- **Save/load** layouts to localStorage
- **Export/import** as `.cbtemplate.json` files for team sharing
- **Export all** templates at once

### Export
- **Download as PNG or JPEG** at full resolution
- **Bulk export** -- upload multiple photos, apply the same layout, download as ZIP

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm (comes with Node.js)

### Installation

```bash
git clone https://github.com/Bot-Rakshit/chessbasindia-post-creator.git
cd chessbasindia-post-creator
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

### Deploy

One-click deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Bot-Rakshit/chessbasindia-post-creator)

Or deploy anywhere that supports Next.js (Netlify, Railway, Docker, etc.).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js](https://nextjs.org/) 16 (App Router) |
| Language | TypeScript |
| Canvas | [Fabric.js](http://fabricjs.com/) 7 |
| UI | [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/) 4 |
| Fonts | [Google Fonts](https://fonts.google.com/) (35 curated families) |
| Export | [FileSaver.js](https://github.com/nicolo-ribaudo/FileSaver.js) + [JSZip](https://stuk.github.io/jszip/) |
| Storage | localStorage (no backend required) |

## Project Structure

```
src/
├── app/                  # Next.js app router (page, layout)
├── components/
│   ├── Editor.tsx        # Main editor shell wiring panels to canvas hook
│   ├── panels/           # Sidebar UI components (Size, Photo/BG, Text, Logo, Templates, Bulk)
│   └── ui/               # shadcn/ui primitives
├── hooks/
│   └── use-canvas.ts     # Canvas state management hook (all Fabric.js interactions)
└── lib/
    ├── canvas-engine.ts  # Pure functions for Fabric.js objects
    ├── types.ts          # TypeScript interfaces, defaults, font list, presets
    └── templates.ts      # Template CRUD with localStorage
```

## Customization

### Adding Your Own Logo

Replace `public/chessbase-logo.svg` with your organization's logo.

### Adding Fonts

Edit the `FONTS` array in `src/lib/types.ts` and the `GOOGLE_FONTS` array in `src/app/layout.tsx`.

### Adding Canvas Presets

Edit `CANVAS_PRESETS` in `src/lib/types.ts`:

```ts
export const CANVAS_PRESETS = [
  { label: "IG Post", short: "IG", width: 1080, height: 1080 },
  { label: "YouTube", short: "YT", width: 1280, height: 720 },
  // add more...
];
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) -- free to use, modify, and distribute.

## Credits

Built for [ChessBase India](https://www.youtube.com/@ChessBaseIndia) by [Rakshit](https://github.com/Bot-Rakshit).
