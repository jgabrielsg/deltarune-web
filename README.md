# deltarune-web

A web-based interactive experience and game engine prototype inspired by the world of Deltarune. This project focuses on replicating the core mechanics of the original game, including movement, collision detection, and interactive dialogue systems.

---

## Live Demo

You can play the current build of the game here:
[https://jgabrielsg.github.io/deltarune-web/](https://jgabrielsg.github.io/deltarune-web/)

---

## Core Features

* **Interactive Dialogue System:** Features a custom typewriter effect with variable speeds for punctuation and support for character portraits (faces).
* **Collision Engine:** A scalable class-based obstacle system that allows for complex room layouts and boundary management.
* **Party Mechanics:** Implementation of "follow-the-leader" logic where party members (Susie and Ralsei) follow the player's movement history.
* **Tile-Based Rendering:** Rooms are rendered using a 24x14 grid system, optimizing the placement of pixel art assets.
* **Delta Time Integration:** Movement and animations are normalized using Delta Time, ensuring consistent gameplay speed across different monitor refresh rates (60Hz, 144Hz, etc.).

---

## Piano Minigame

The project includes a fully interactive piano minigame located within the music room. 

* **Mechanics:** Players can interact with the piano to play specific notes across multiple octaves.
* **Sound Library:** Features high-fidelity audio samples for all natural notes and accidentals (C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B).
* **Repertoire:** The system is designed to allow players to manually perform iconic tracks from the Deltarune and Undertale soundtracks, such as "Don't Forget".

---

## Controls

| Key | Action |
| :--- | :--- |
| **Arrow Keys** | Move Character |
| **Z** | Interact / Advance Dialogue |
| **Shift** | Run |

---

## Technical Stack

* **Framework:** SvelteKit
* **Build Tool:** Vite
* **Language:** JavaScript / HTML / CSS
* **Deployment:** GitHub Pages

---

## Asset Credits

* **Sprites and Designs:** Original assets inspired by or sourced from Toby Fox's Deltarune, some with light changes (now using a 16x16 grid instead of the weird 20x20 grid in Deltarune ruins);
* **Piano Sprites**: https://ragnapixel.itch.io/pixel-piano (very cooL);
* **Music:** Sound effects from somewhere on the net...

---

## Development

To run this project locally:

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```
