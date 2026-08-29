# SandFPV

Technische Basis eines browserbasierten FPV-Simulators mit Three.js und Rapier 3D.

## Entwicklung

```sh
npm install
npm run dev
```

Die Physik wird unabhängig von der Bildrate mit einem festen Zeitschritt von 120 Hz
berechnet. `vite.config.ts` verwendet relative Asset-Pfade, damit der Build auch unter
einer GitHub-Pages-Repository-URL ausgeliefert werden kann.

## Qualität

```sh
npm test
npm run lint
npm run format:check
npm run build
```
