### GUI Controls Overview

The `guiControls` object and its subgroups are designed to manage the graphical user interface (GUI) for the application. Each subgroup focuses on a specific feature or functionality to ensure modularity and ease of management.

#### Global Controls

- **`guiControls`**: The central hub for managing GUI functionalities.
- All subgroups (`osvControls`, `displayControls`, etc.) are part of this object.

#### Subgroups

1. **OSV Controls (`osvControls`)**

   - Purpose: Manage visualization and real-time data related to Orbit State Vectors (OSV).
   - Features:
     - Display satellite positions and vectors.
     - Enable/disable orbit path visualizations.

2. **Display Controls (`displayControls`)**

   - Purpose: Manage visual toggles and features in the GUI.
   - Features:
     - Enable/disable grid lines.
     - Toggle satellite visibility and orbit trails.

3. **TLE Controls (`tleControls`)**

   - Purpose: Handle TLE file management and satellite selection.
   - Features:
     - Upload TLE files using satellite names or catalog numbers.
     - Dynamically select and visualize satellites.

4. **Time Controls (`timeControls`)**

   - Purpose: Manage time-related functionalities in the simulation.
   - Features:
     - Pause or resume the simulation.
     - Adjust the timewarp for faster/slower progression.

5. **Camera Controls (`cameraControls`)**

   - Purpose: Manage camera movement and focus in the visualization.
   - Features:
     - Center the view on specific satellites.
     - Rotate and pan dynamically.

6. **Frame Controls (`frameControls`)**

   - Purpose: Handle the visualization frame of reference.
   - Features:
     - Switch between Earth-centered (ECEF) and inertial frames.
     - Adjust coordinate systems for satellite visualization.

7. **Kepler Controls (`keplerControls`)**
   - Purpose: Display Keplerian orbital parameters for satellites.
   - Features:
     - Show semi-major axis, eccentricity, inclination, and other orbital elements.
     - Track real-time changes in orbital parameters during simulation.
