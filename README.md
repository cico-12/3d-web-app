# 3D Furniture Layout Demo App

## ⚠️ ⚠️ ⚠️
> **Note:** The `.env.local` file is committed in this repository **only for evaluation/demo purposes** so the app can run out of the box.  
> In a real project, environment files **must never** be pushed to a public repository!

---

## Description

This project is a **Next.js** application that showcases a simple **3D room layout editor** built with:

- **React Three Fiber** + **Three.js** for 3D rendering  
- **Firebase/Firestore** for persisting model poses  
- Custom **drag & rotate controls** with:
  - Collision prevention between objects (no overlapping furniture)
  - A UI **Rotation HUD** for adjusting rotation with buttons/slider/keyboard
  - Support for both **move** and **rotate** modes

The user can:

- Load two GLB models (e.g. a table and a TV cabinet)  
- Drag them on a floor plane with collision detection  
- Rotate them using a friendly on-screen HUD (and Q/E hotkeys)  
- Persist their position/orientation via Firestore

---

## Getting Started

### Dependencies

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (LTS recommended, e.g. 18+)
- [npm](https://www.npmjs.com/) (comes with Node)  
- [Git](https://git-scm.com/)

### Installing

1. **Clone this repository:**

   ```bash
   git clone https://github.com/cico-12/3d-web-app.git
   cd 3d-web-app/

2. **Install dependencies:**
    ```bach
    npm install

3. **Launch the app**
    ```bash
    npm run dev

### Opening the app
- After running the app open: 
    ```bash 
    http://localhost:3000