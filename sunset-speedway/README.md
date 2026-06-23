# Three.js Sunset Speedway: 3D Racing Environment

I developed a fully animated, 3D racing environment using the **Three.js** library. This project marks the transition from low-level raw WebGL to a high-level 3D graphics engine, focusing on complex scene graphs, procedural geometry generation, curve-based animations, and particle systems.

## System & Tools
* **Environment:** Web Browser
* **Language:** JavaScript, HTML5, CSS3
* **Dependencies:** `three.js`, `OrbitControls.js`, `GLTFLoader.js`

## Application Features
* **Spline-Based Animation:** Designed a complex race track using `CatmullRomCurve3`. Wrote math to calculate tangents and normals along the curve to seamlessly animate two distinct racing cars driving along the track in separate lanes, complete with spinning wheels.
* **Complex Lighting & Shadows:** 
  * Implemented a robust lighting setup using Ambient, Hemisphere, Directional (Sun), Point (Pit Lamps), and Spotlights.
  * Configured `PCFSoftShadowMap` to allow dynamic shadow casting and receiving across all moving vehicles, grandstands, and track assets.
* **Procedural Textures & Skybox:** Generated dynamic textures entirely through the HTML5 Canvas API (Asphalt, Grass, Checkered Flag) and applied them to Three.js materials. Created a custom 6-sided procedural skybox rendering a sunset and stars.
* **Weather & Particle Systems:**
  * **Rain System:** Engineered a high-performance rain simulation using `LineSegments` and `BufferGeometry` that recycles particle positions for continuous weather effects.
  * **Exhaust Puffs:** Developed an object-pooling particle system for car exhaust, simulating physics (velocity, expansion, fade-out opacity) on the fly.
* **Interactive Camera Controls:** Integrated `OrbitControls` for panning/zooming and built a custom "Follow Cam" toggle that algorithmically snaps the camera behind the racing cars.
* **GLTF Model Loading:** Handled asynchronous parsing and rendering of an external `.gltf` asset (Speedway Sign) into the scene graph.

## Architecture & Implementation Details

### Track Geometry Generation
Instead of loading a massive pre-built 3D model for the track, I procedurally generated the asphalt mesh using `BufferGeometry`. By sampling the `CatmullRomCurve3` at hundreds of intervals and calculating left/right offsets via the curve's normal vector, I built the vertex positions, normals, and UVs entirely in code.

### Object Pooling for Performance
To maintain 60 FPS while emitting car exhaust, I utilized **Object Pooling**. Instead of constantly instantiating and destroying sphere meshes, I created a fixed array of invisible exhaust puffs on initialization. The `emitExhaust()` function simply resets the physics and visibility of an existing puff, drastically reducing Garbage Collection overhead.

### Procedural Asset Generation
Constructed numerous scene decorations (Trees, Grandstands, Spectators, Flag Marshals, Light Poles, Tires) using hierarchical Three.js `Group` objects. This allowed me to easily instantiate complex, multi-mesh prefabs (like a spectator with a head, body, and legs) and place them anywhere in the scene with a single line of code.
