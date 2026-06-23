# WebGL Voxel World: Textures, Camera & Physics

I built an interactive, first-person 3D voxel environment inspired by Minecraft, featuring a fully navigable world, texture mapping, collision detection, and a built-in parkour course. This project demonstrates advanced WebGL concepts including custom camera systems, UV mapping, real-time physics, and multi-texturing.

## System & Tools
* **Environment:** Web Browser (Requires local server for texture loading)
* **Language:** JavaScript, HTML5, CSS3
* **Dependencies:** WebGL, `cuon-matrix.js`, `cuon-utils.js`

## Application Features
* **First-Person Camera System:** Designed a custom camera (`camera.js`) with WASD movement, Q/E for panning, and full Pointer Lock API integration. Users can click the canvas to seamlessly look around using their mouse (FPS-style controls).
* **Multi-Textured Voxel World:** Rendered a 64x64 voxel grid populated with procedurally generated structures, pillars, and a skybox. Blocks are mapped with external image textures (Grass, Stone, Brick) using WebGL Samplers and scaled UV coordinates.
* **Physics & Collision Detection:**
  * **Gravity & Jumping:** Implemented a physics-based jump system (using Spacebar) with smooth gravity application.
  * **Terrain Collision:** Built a `getGroundHeightAt(x, z)` function that dynamically calculates the height of the blocks under the player, preventing clipping and enabling vertical platforming.
  * **Boundary Collision:** Added hard boundary clamps to prevent the player from escaping the map.
* **Interactive Environment:**
  * **Block Placement/Removal:** Users can dynamically place new blocks or remove existing ones directly in front of them (using F and G keys).
  * **Parkour Course:** Designed a large, challenging parkour segment with floating stepping stones and varying gap distances to test the physics and camera mechanics.
* **Autonomous Animated Entities:** Integrated the 3D articulated "blocky animal" character from the previous assignment into the world. It autonomously navigates the environment in a circle before transitioning into a time-based procedural dance animation.

## Architecture & Implementation Details

### Custom Camera & Projection Mathematics
* Built a dedicated `Camera` class that manages its own `eye`, `at`, and `up` vectors.
* Utilized vector mathematics to calculate cross products for strafing (`moveLeft()`, `moveRight()`) and forward/backward movement relative to the camera's current yaw, ensuring movement always matches the player's perspective.

### WebGL Texture & UV Mapping Pipeline
* Developed a robust texture loading system (`sendImageToTextureUnit`) that fetches external images, dynamically resizes them to powers of two (if necessary for WebGL 1.0 `REPEAT` wrapping), and binds them to `gl.TEXTURE0`, `gl.TEXTURE1`, etc.
* Handled UV scaling in the vertex shader (`a_UV * u_UVScale`) to ensure ground textures tile cleanly across massive 64x64 block surfaces instead of stretching unpleasantly.

### Optimized Voxel Rendering
* Avoided generating redundant geometry by iterating through a 2D map array and dynamically drawing a single shared `Cube` instance with translated matrices.
* Implemented a custom fragment shader that dynamically switches between solid colors, UV debug views, and active Sampler2D textures using a `u_whichTexture` uniform flag.
