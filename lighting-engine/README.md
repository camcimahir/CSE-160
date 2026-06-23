# WebGL Phong Lighting Engine: Spotlights, Normals & OBJ Loading

I developed a sophisticated 3D graphics engine in WebGL that implements the complete Phong Illumination Model. Building upon my previous voxel world engine, this iteration introduces dynamic lighting, per-vertex normal calculations, custom shader-based light attenuation, and external 3D model parsing.

## System & Tools
* **Environment:** Web Browser
* **Language:** JavaScript, HTML5, CSS3, GLSL (Custom Vertex & Fragment Shaders)
* **Dependencies:** WebGL, `cuon-matrix.js`, `cuon-utils.js`

## Application Features
* **Phong Illumination Model:** Implemented ambient, diffuse, and specular lighting calculations entirely from scratch within custom GLSL fragment shaders, achieving realistic material reflections and depth.
* **Dynamic Light Sources:**
  * **Point Lights:** Omni-directional lighting with distance-based quadratic attenuation.
  * **Spotlights:** Directional lighting featuring mathematically calculated inner and outer cones (cutoff and penumbra) for smooth, realistic light falloff.
* **Real-Time Lighting UI:** Engineered a comprehensive UI with sliders to dynamically adjust the X/Y/Z positions, RGB color values, and spotlight cone angles in real time. 
* **Normal Visualization (Debug Mode):** Built a "Normal Viz" shader mode that maps calculated 3D vertex normals directly to RGB color output, serving as a powerful visual debugging tool to ensure mathematical accuracy of surface orientations.
* **External OBJ Parsing:** Developed an asynchronous 3D model loader (`Model.js`) capable of parsing complex `.obj` files, normalizing their vertex data, calculating their surface normals, and injecting them into the WebGL rendering pipeline.
* **Complex Geometry Generation:** Created a procedural `Sphere.js` class that mathematically generates hundreds of vertices and normals using trigonometric spherical coordinates.

## Architecture & Implementation Details

### Custom GLSL Shaders
* Shifted from flat/texture-based shading to a robust normal-based shading pipeline.
* Passed calculated world positions (`v_WorldPos`) and normalized normals (`v_Normal`) from the Vertex Shader to the Fragment Shader via `varying` variables.
* Implemented the `reflect()` function and dot products in the Fragment Shader to calculate specular highlights based on the camera's view vector (`u_CameraPos`).

### Normal Matrices
* To prevent normal vectors from skewing incorrectly when objects are scaled non-uniformly, I implemented an Inverse-Transpose Normal Matrix (`u_NormalMatrix`), ensuring light reflects accurately off of distorted geometry.

### Spotlight Mathematics
* Calculated spotlight falloff using the dot product between the light direction vector and the fragment-to-light vector.
* Used `clamp()` and smooth interpolation between the `u_SpotCosInner` and `u_SpotCosOuter` bounds to create a soft-edged penumbra effect, rather than a harsh, unrealistic spotlight circle.

### Maintained World Engine Features
* Fully integrated all previous features into the lit world, including the first-person camera, texture mapping, physics/jumping, and the procedurally animated 3D blocky animal, all of which now react correctly to the dynamic lighting.