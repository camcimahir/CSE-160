# WebGL Interactive Shape Canvas

I built a completely functional, interactive WebGL painting application that allows users to render, customize, and compose primitive shapes on an HTML5 Canvas. The project serves as a foundational exploration of WebGL's rendering pipeline and object-oriented graphics programming in JavaScript.

## System & Tools
* **Environment:** Web Browser
* **Language:** JavaScript, HTML5, CSS3
* **Dependencies:** WebGL, `cuon-utils.js`, `webgl-utils.js`

## Application Features
* **Interactive Drawing:** Implemented real-time rendering of Points, Triangles, Circles, and custom N-sided Polygons. Users can draw individual shapes with a click or continuously paint by clicking and dragging.
* **Dynamic UI Controls:** Integrated HTML UI elements (sliders and buttons) that update WebGL uniform variables in real-time, allowing users to modify RGB colors, object size, circle segment counts, and polygon vertex counts on the fly.
* **Complex Scene Rendering:** Included a custom `drawMyShape` feature that procedurally generates a complex, multi-colored character composed of nearly 30 individually placed triangles. This feature required calculating precise normalized device coordinates (NDC) to match a provided reference sketch.

## Architecture & Implementation Details

To ensure maintainability and a clean rendering loop, I structured the application using object-oriented principles.

### Object-Oriented Shape Classes
* Instead of keeping track of massive parallel arrays for positions, colors, and sizes, I implemented individual classes for each shape type (`Point.js`, `Triangle.js`, `Circle.js`, `Polygon.js`). 
* Each class encapsulates its unique properties and contains its own `render()` method, allowing the main application loop to simply iterate through a global list of instantiated shapes and invoke their drawing logic.

### Dynamic Polygon Generation
* To support interactive polygon creation, I implemented a state-tracking system. When the Polygon tool is active, the application stores temporary user clicks as vertices. 
* To provide immediate visual feedback, these temporary vertices are rendered to the screen dynamically. Once the target vertex count is reached, the polygon is finalized, stored, and the temporary buffer is cleared.

### Optimized WebGL State Management
* The application translates browser mouse events into WebGL's Normalized Device Coordinates [-1.0, 1.0] seamlessly.
* Efficiently manages WebGL buffers and attribute bindings per shape render call to ensure all drawn elements persist and are rendered accurately at native speeds.
