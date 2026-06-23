# WebGL Blocky Animal: Hierarchical 3D Modeling & Animation

I built a fully interactive 3D rendering application that generates a complex articulated "blocky animal" character. This project showcases my understanding of hierarchical 3D transformations, model-view projection mathematics, and interactive web graphics using WebGL. 

## System & Tools
* **Environment:** Web Browser
* **Language:** JavaScript, HTML5, CSS3
* **Dependencies:** WebGL, `cuon-matrix.js` (for Matrix math), `cuon-utils.js`

## Application Features
* **Hierarchical 3D Character:** Constructed a complex 3D character composed of multiple primitives (Cubes and Cylinders). The model features intricate parent-child joint relationships (e.g., Shoulders -> Elbows -> Wrists -> Claws, and Hips -> Knees -> Ankles -> Feet), ensuring physically logical movements.
* **Interactive Joint Control:** Integrated an extensive UI with a dozen sliders, allowing the user to manipulate the angle of almost every joint on the character independently in real-time.
* **Procedural Animations:** 
  * **Running/Climbing:** Implemented a continuous trigonometric animation loop that naturally oscillates the limbs, simulating a running cycle.
  * **Interactive "Poke Dance":** Added a hidden interaction where shift-clicking the canvas triggers a temporary procedural "dance" animation, overriding slider controls smoothly before returning them to their previous state.
* **Mouse-Driven Camera Control:** Built a custom camera rotation system that allows users to click and drag the canvas to view the 3D model from any angle (pitch and yaw).
* **Performance Tracking:** Implemented a real-time diagnostics display that calculates and outputs smoothed Frames Per Second (FPS) and per-frame CPU draw time (ms).

## Architecture & Implementation Details

To achieve complex movements while maintaining performance, the application relies heavily on matrix mathematics and an optimized rendering loop.

### Matrix Stack & Hierarchical Modeling
* Used a simulated matrix stack approach to apply local transformations to body parts without permanently affecting the global state. 
* By chaining transformations (translating to a joint pivot, applying rotation, then translating/scaling the geometry), I ensured that rotating a parent joint (like a shoulder) automatically and accurately updates the position and orientation of all child joints (elbows, wrists, claws) in 3D space.

### Procedural Animation Logic
* Designed a custom time-based `tick()` system using `performance.now()`. This decouples the animation logic from the frame rate, ensuring animations play at the correct speed regardless of the client's monitor refresh rate.
* Utilized `Math.sin()` and `Math.cos()` with calculated frequencies to generate fluid, cyclical movements for the limbs.

### Optimized Scene Rendering
* Ensured efficient clearing of the Depth and Color buffers per frame.
* Integrated the `cuon-matrix.js` library for fast Matrix4 operations, drastically reducing the overhead of calculating world, model, and global rotation matrices before passing them to the vertex shader.
