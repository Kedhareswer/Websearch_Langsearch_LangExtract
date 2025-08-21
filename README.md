# LangSearch Web App with Loading Screen

A Next.js application with a beautiful animated loading screen powered by Raycast's animated background component.

## Features

- ✨ 5-second animated loading screen on app startup
- 🎨 Modern UI with Tailwind CSS and shadcn/ui design system
- 🔍 Search functionality with API integration
- 📱 Fully responsive design
- 🎯 TypeScript support

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
# Add your API keys to .env.local
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) to see the app with the loading screen.

## Loading Screen Integration

The loading screen is integrated at the app level in `pages/_app.tsx` and will show for 5 seconds on every page load. It features:

- **Animated Background**: Powered by UnicornStudio React component
- **Progress Bar**: Visual progress indicator
- **Responsive Design**: Adapts to all screen sizes
- **Customizable Duration**: Easy to modify timing

### Components

- `components/ui/loading-screen.tsx` - Main loading screen wrapper
- `components/ui/raycast-animated-background.tsx` - Animated background component
- `components/ui/demo.tsx` - Standalone demo component

### Usage

The loading screen automatically wraps your entire application. To use it independently:

```tsx
import { LoadingScreen } from '@/components/ui/loading-screen'

<LoadingScreen 
  duration={5000} 
  onComplete={() => console.log('Loading complete!')}
>
  <YourContent />
</LoadingScreen>
```

## Dependencies

- **unicornstudio-react**: Animated background component
- **tailwindcss**: Utility-first CSS framework
- **clsx & tailwind-merge**: Class name utilities
- **TypeScript**: Type safety and better DX

## Project Structure

```
├── components/
│   └── ui/
│       ├── loading-screen.tsx
│       ├── raycast-animated-background.tsx
│       └── demo.tsx
├── lib/
│   └── utils.ts
├── pages/
│   ├── _app.tsx
│   ├── index.tsx
│   └── api/
├── styles/
│   └── globals.css
└── package.json
```
