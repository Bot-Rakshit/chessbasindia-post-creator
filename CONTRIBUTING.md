# Contributing

Thanks for your interest in contributing to ChessBase India Post Creator!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/<your-username>/chessbasindia-post-creator.git`
3. Install dependencies: `npm install`
4. Start the dev server: `npm run dev`
5. Create a branch: `git checkout -b my-feature`

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── app/                  # Next.js app router
├── components/
│   ├── Editor.tsx        # Main editor shell
│   ├── panels/           # Sidebar panel components
│   │   ├── SizePanel     # Canvas size presets
│   │   ├── PhotoBgPanel  # Photo upload, background, fade, vignette
│   │   ├── TextPanel     # Text editing controls
│   │   ├── LogoPanel     # Logo toggle and settings
│   │   ├── TemplatesPanel# Save/load/share templates
│   │   └── BulkPanel     # Bulk export
│   └── ui/               # shadcn/ui primitives
├── hooks/
│   └── use-canvas.ts     # Fabric.js canvas state management
└── lib/
    ├── canvas-engine.ts  # Pure Fabric.js helpers
    ├── types.ts          # TypeScript types and defaults
    └── templates.ts      # localStorage template persistence
```

## Guidelines

- Keep the UI compact -- the sidebar should not require excessive scrolling
- All canvas logic goes in `canvas-engine.ts` or `use-canvas.ts`, not in UI components
- Panel components receive props from the hook, they don't manage canvas state directly
- Test with `npm run build` before submitting a PR
- No database required -- templates use localStorage

## Submitting Changes

1. Make sure `npm run build` passes
2. Commit with a descriptive message
3. Push to your fork and open a Pull Request
4. Describe what you changed and why

## Ideas for Contributions

- More canvas presets (LinkedIn, YouTube thumbnail, etc.)
- Custom font upload
- Image filters (brightness, contrast, blur)
- Undo/redo
- Keyboard shortcuts
- Layer reordering UI
- Cloud template storage
