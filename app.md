# Satellite Visualization and Propagation

This document provides an overview of the key components, functions, and their descriptions used in the satellite visualization and propagation project. The main focus is on handling satellite orbits, inter-satellite links (ISLs), and real-time visualizations.

---

## Overview

The code enables real-time visualization of satellite orbits using **WebGL**. It supports the following features:

- **Real-Time Orbit Propagation**: Based on TLE (Two-Line Element) data using the SGP4 model.
- **Inter-Satellite Links (ISL)**: Visualized as lines connecting satellites, styled dynamically.
- **GUI Controls**: Enable users to toggle visual elements and interact with the visualization.
- **Epoch Management**: Supports time-based switching between files and satellite telemetry data.

---

## Key Functions and Their Descriptions

### WebGL Initialization and Shaders

- **`PlanetShaders(gl, ...)`**  
  **Purpose**: Manages shaders for rendering Earth, including day and night textures.
- **`LineShaders(gl)`**  
  **Purpose**: Handles rendering of lines, including ISLs.
- **`PointShaders(gl)`**  
  **Purpose**: Manages rendering of points, such as satellite positions.

---

### Satellite Initialization and Data Handling

- **`sgp4.tleFromLines(tleArray)`**  
  **Purpose**: Converts TLE data into a satellite record for propagation.  
  **Parameters**:

  - `tleArray`: Array of TLE lines (name, line1, line2).  
    **Returns**: Satellite record (`satrec`) for propagation.

- **`createOsv(today)`**  
  **Purpose**: Generates Orbit State Vectors (OSVs) based on the selected source (TLE, telemetry, or OEM).  
  **Parameters**:
  - `today`: Current simulation time.  
    **Returns**: OSV object (`{ r, v, ts }`).

---

### Time and Epoch Management

- **`checkAndSwitchFiles()`**  
  **Purpose**: Checks the current simulation time and switches between TLE files when timestamps are crossed.  
  **Behavior**: Ensures continuous simulation by processing the next or previous TLE file as required.

---

### Orbit Propagation and Visualization

- **`drawOrbit(today, satellite, matrix, nutPar)`**  
  **Purpose**: Draws the orbit of a satellite using Keplerian propagation.  
  **Parameters**:
  - `today`: Current simulation time.
  - `satellite`: Satellite object containing TLE and OSV data.
  - `matrix`: Transformation matrix for visualization.
  - `nutPar`: Nutation parameters for coordinate conversion.  
    **Notes**: Reduces orbit points dynamically for performance optimization.

---

### Inter-Satellite Links (ISLs)

- **`drawISLLines(matrix, nutPar, today)`**  
  **Purpose**: Draws inter-satellite links (ISLs) between satellites.  
  **Parameters**:

  - `matrix`: View matrix for rendering.
  - `nutPar`: Nutation parameters for coordinate transformation.
  - `today`: Current simulation time.  
    **Behavior**: Draws lines between linked satellites based on their positions and highlights them.

- **`parseISLFile(content, type)`**  
  **Purpose**: Parses ISL link data from a file.  
  **Parameters**:
  - `content`: File content as a string.
  - `type`: Specifies whether links are defined by satellite names or catalog numbers.  
    **Output**: Updates `islData.links` with valid link pairs.

---

### GUI Integration

- **`createControls()`**  
  **Purpose**: Initializes GUI controls for user interaction.  
  **Features**:

  - Satellite selection by name or catalog.
  - Enable/disable visualization layers (e.g., ISLs, orbits).
  - Adjust timewarp and simulation speed.
  - Lock camera to specific satellites.

- **`updateCaptions(...)`**  
  **Purpose**: Updates textual captions for satellites, Sun, and Moon positions in the visualization.

---

### Satellite and ISL Utility Functions

- **`createOsvForSatellite(satellite, today)`**  
  **Purpose**: Propagates the satellite's orbit and computes its OSV for the current time.  
  **Parameters**:

  - `satellite`: Satellite object containing TLE data.
  - `today`: Current simulation time.  
    **Behavior**: Converts TEME coordinates to J2000 and computes Keplerian parameters.

- **`createOsvForISLSatellite(satellite, today)`**  
  **Purpose**: Generates OSV data for satellites involved in ISLs.  
  **Behavior**: Handles SGP4 propagation and validates position data.

---

## Important Variables

### WebGL Elements

- **`gl`**: WebGL context for rendering.
- **`earthShaders`**: Shader program for rendering Earth textures.
- **`lineShaders`**: Shader program for rendering ISL lines.
- **`pointShaders`**: Shader program for rendering satellite points.

### Satellite Data

- **`satellites`**: Array of satellite objects initialized from TLE files.
- **`satelliteObjects`**: Detailed objects containing telemetry and propagation data.
- **`satNameToIndex` / `satIndexToName`**: Maps for efficient satellite lookup by name or index.

### GUI Controls

- **`guiControls`**: Central object managing GUI interactions.
- **`cameraControls`**: Controls for camera movement and zoom.
- **`timeControls`**: Controls for managing simulation time.

---

## Future Improvements

- Optimize orbit propagation for large-scale satellite constellations.
- Implement more advanced ISL styling (e.g., dynamic width and color).
- Add multi-threading support for real-time computations.

---

This document covers the core elements and their purposes in the codebase. Each function and component has been explained for clarity and understanding.
