---
name: Expo SDK 52 web setup
description: Key dependency constraints when running Expo SDK 52 on web in Replit
---

## Problem
Expo SDK 56 ships with `expo-modules-core` whose `package.json` `main` and `exports` both point to `src/index.ts`, but this file doesn't exist in the installed package (only stubs). Metro cannot resolve it and bundling fails.

## Fix
Use **Expo SDK 52** (`expo@~52.0.0`). In SDK 52, `expo-modules-core` includes a real `src/` directory with `src/index.ts`.

## Critical versions for web (SDK 52)
- `expo@~52.0.0`
- `expo-router@~4.0.22`
- `metro@^0.81.0` (NOT 0.84 — that breaks `@expo/cli` internal paths)
- `react@18.3.1`, `react-dom@18.3.1`
- `react-native@0.76.9`
- `react-native-web@~0.19.13`
- `@expo/metro-runtime@~4.0.1`
- `expo-linking@~7.0.5` (required by expo-router, not auto-installed)

## Startup
Use `CI=1 npx expo start --web --port 5000` — CI=1 suppresses the `xdg-open` browser-open attempt that fails in the Replit container and crashes the process.

**Why:** `xdg-open` is not available in the Replit NixOS container. Without CI=1, Expo tries to open the browser and exits with code 1, killing the workflow.
