# My Portfolio

My personal website: who I am, the projects I've built, skills, education and how to reach me.

**Live:** https://tejdeep-portfolio.netlify.app

![portfolio home](docs/home.jpg)

## What's in it

- A short intro where my name gets written out like a signature, then moves up into the navbar (plays once per visit, you can skip it, and it's off if your system has reduced motion turned on)
- A 3D background in the hero made with Three.js: a wavy field of points that reacts to the mouse (or phone tilt) and scrolling
- Featured projects (Safe Roads, AirPulse, NiftyLens) and smaller cards for the rest, with live demo and code links
- Skills, education, certifications and contact links, plus my resume as a PDF

## Built with

- [Vite](https://vitejs.dev/) with plain JavaScript and CSS (no framework)
- [Three.js](https://threejs.org/) for the hero scene, loaded only after the page is ready so it doesn't slow the first paint
- Fonts: Instrument Serif and Manrope (self-hosted with Fontsource)

A few things I did to keep it fast: the 3D scene caps the pixel ratio, uses fewer points on phones, and stops rendering when the hero is off screen or the tab is hidden. If WebGL isn't available it falls back to a plain CSS background.

## Run it locally

```bash
npm ci
npm run dev      # http://localhost:5173
npm run build    # output in dist/
npm test         # checks on the built page (run after build)
```

## Editing projects

All project cards come from `src/data/projects.json` (name, description, links, tech). A small Vite plugin turns that file into HTML at build time, so the content is in the page even without JavaScript. To use a screenshot instead of the drawn placeholder, put the image in `public/img/projects/` and set `"image": "/img/projects/<file>.webp"` for that project.

## The signature

The signature isn't a font on the page. `tools/signature/` takes the outline of the word "Tejdeep" from a script font (opentype.js), finds the centre line of the letters (skeletonize in scikit-image) and orders the pen strokes the way you'd write them. The site uses those strokes as a mask and animates `stroke-dashoffset`, so the ink appears stroke by stroke. `npm run signature` rebuilds `src/data/signature.json`.

## Deploy

Hosted on Netlify. `netlify.toml` has the settings: build command `npm run build`, publish directory `dist`.

## Credits

- Signature letters based on the font Mrs Saint Delafield by Alejandro Paul (SIL Open Font License, see `tools/signature/OFL.txt`)
- Instrument Serif and Manrope fonts (SIL Open Font License)
- Three.js (MIT)
