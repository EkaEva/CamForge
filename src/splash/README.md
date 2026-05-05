# Splash Screen Generator

This directory uses **React** and [Remotion](https://www.remotion.dev/) to generate the CamForge splash animation.

## Why React?

Remotion is a React-based video framework — there is no SolidJS equivalent. The splash screen is a build-time artifact (rendered to video), not a runtime UI component, so using React here does not affect the main application.

## Commands

- `pnpm splash:preview` — Open Remotion Studio to preview the splash animation
- `pnpm splash:render` — Render the splash to video file

## Files

- `CamForgeSplash.tsx` — Splash animation composition
- `Root.tsx` — Remotion root composition registration
- `render.ts` — CLI script to render the splash to file
