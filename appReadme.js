/**
 * OrbitsGL Project Detailed Documentation
 * 
 * This file provides in-depth documentation for the functions used within OrbitsGL. It includes function
 * descriptions, parameter details, return types, and how each function works internally.
 */

// Global Variables

/**
 * @var {WebGLRenderingContext} gl - WebGL rendering context used for drawing the 3D scenes.
 * @var {WebGLProgram} earthShaders - Shader program used for rendering Earth.
 * @var {WebGLProgram} lineShaders - Shader program used for rendering satellite orbits.
 * @var {WebGLProgram} pointShaders - Shader program used for rendering satellite points.
 */
var gl = null;
var earthShaders = null;
var lineShaders = null;
var pointShaders = null;

/**
 * @var {string} tleLine1 - The first line of TLE data for the selected satellite.
 * @var {string} tleLine2 - The second line of TLE data for the selected satellite.
 */
var tleLine1 = '1 25544U 98067A ...';  // Example TLE line 1 for ISS
var tleLine2 = '2 25544 ...';          // Example TLE line 2 for ISS

/**
 * @var {object} satrec - The satellite record generated from the TLE data using SGP4 propagation.
 * This object stores satellite parameters (position, velocity) and is used for orbit propagation.
 */
var satrec = sgp4.tleFromLines([...]);

// Function Definitions

/**
 * drawScene - Renders the entire 3D scene.
 * 
 * This function is responsible for drawing the 3D Earth, satellites, and orbits. It propagates satellite
 * positions using the SGP4 model, updates the camera view, and handles any visual changes in real-time.
 * 
 * Internally, the function:
 * - Uses the current time to compute satellite positions.
 * - Calls sub-functions such as `drawEarth`, `drawOrbit`, and `drawSun` to render different objects.
 * - Uses WebGL shaders to render objects and apply visual effects.
 * 
 * @param {number} time - The current simulation time in milliseconds. This value is passed from 
 *                        `requestAnimationFrame()` to simulate real-time rendering.
 * 
 * Usage Example:
 * ```js
 * requestAnimationFrame(drawScene);
 * ```
 * 
 * Important Details:
 * - Ensure WebGL context (`gl`) is correctly initialized before calling this function.
 * - Shaders (`earthShaders`, `lineShaders`, `pointShaders`) must be loaded and compiled.
 * - The `time` parameter allows smooth transitions and animations.
 */
function drawScene(time) {
    // Propagate and render the scene based on current satellite data
    // Clear the WebGL canvas before rendering the scene
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Calculate current positions of the satellites and celestial bodies based on the input time
    // Call individual draw functions like drawEarth(), drawOrbit(), drawSun()

    // requestAnimationFrame(drawScene); // Recursively call itself for continuous rendering
}

/**
 * createOsv - Generates an OSV (Orbital State Vector) for a satellite.
 * 
 * This function calculates the position and velocity (state vector) of a satellite for a given date.
 * It uses the SGP4 model to propagate the satellite's position from its TLE data.
 * 
 * How it works:
 * - Uses SGP4 to propagate the satellite's orbit.
 * - Calculates the satellite’s current position and velocity based on the input date.
 * 
 * @param {Date} today - The current date object, which is used to calculate the satellite's position.
 * @returns {object} - An OSV (Orbital State Vector) object containing the satellite's position (X, Y, Z) and velocity.
 * 
 * Usage Example:
 * ```js
 * let osv = createOsv(new Date());
 * console.log(osv.position, osv.velocity);
 * ```
 * 
 * Important Details:
 * - Ensure TLE data is valid before calling this function.
 * - The returned OSV object contains high-precision coordinates, suitable for real-time rendering.
 */
function createOsv(today) {
    // Use SGP4 to compute the satellite position based on the current date
    // Return the satellite's Orbital State Vector (position and velocity)
}

/**
 * createViewMatrix - Generates the view matrix for the camera.
 * 
 * This function calculates the view matrix (also known as the "camera matrix") for rendering the scene.
 * It factors in camera position, rotation, and zoom level to give the user control over their view.
 * 
 * How it works:
 * - Uses linear algebra to generate a 4x4 transformation matrix.
 * - The matrix transforms coordinates from world space to camera space.
 * 
 * @returns {Float32Array} - A 4x4 matrix that represents the camera’s view of the scene.
 * 
 * Usage Example:
 * ```js
 * let viewMatrix = createViewMatrix();
 * gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, 'viewMatrix'), false, viewMatrix);
 * ```
 * 
 * Important Details:
 * - This matrix is essential for 3D rendering, as it ensures objects are positioned correctly in the scene.
 * - The camera matrix affects the entire rendering pipeline.
 */
function createViewMatrix() {
    // Create and return the 4x4 view matrix based on camera properties (position, zoom, rotation)
}

/**
 * drawEarth - Renders the Earth on the WebGL canvas.
 * 
 * This function draws the 3D model of Earth using WebGL shaders and transforms.
 * It also considers lighting from the Sun and Earth's rotation.
 * 
 * How it works:
 * - Loads the Earth texture and applies it to a sphere.
 * - Uses WebGL shaders for Earth rendering.
 * 
 * @param {Float32Array} matrix - The view matrix to position Earth relative to the camera.
 * @param {number} rASun - The right ascension of the Sun (used for positioning).
 * @param {number} declSun - The declination of the Sun (used for lighting).
 * @param {number} LST - Local Sidereal Time, which affects Earth's orientation.
 * @param {number} JT - Julian Time, another factor for precise positioning.
 * @param {object} nutPar - Nutation parameters used to account for Earth’s axial tilt variations.
 * 
 * Usage Example:
 * ```js
 * drawEarth(viewMatrix, sunRA, sunDecl, siderealTime, julianTime, nutationParams);
 * ```
 * 
 * Important Details:
 * - Ensure shaders (`earthShaders`) are properly compiled and linked.
 * - Lighting and shading are important to make the Earth look realistic.
 */
function drawEarth(matrix, rASun, declSun, LST, JT, nutPar) {
    // Draw the Earth model using shaders and WebGL commands
}

/**
 * drawOrbit - Renders satellite orbits based on propagated positions.
 * 
 * This function draws the satellite's orbit based on Keplerian elements, using the SGP4 model to propagate
 * positions over time. The orbit is drawn as a line in 3D space.
 * 
 * How it works:
 * - Propagates satellite positions over a time period to form an orbit path.
 * - Draws a line representing the satellite's orbit around Earth.
 * 
 * @param {Date} today - The current date for orbit propagation.
 * @param {Float32Array} matrix - The view matrix to correctly position the orbit in 3D space.
 * @param {object} kepler_updated - The satellite's updated Keplerian elements used for propagation.
 * @param {object} nutPar - Nutation parameters for orbital corrections.
 * 
 * Usage Example:
 * ```js
 * drawOrbit(new Date(), viewMatrix, keplerElements, nutationParams);
 * ```
 * 
 * Important Details:
 * - Ensure the orbit data (Keplerian elements) is accurate and updated regularly.
 * - Orbits are affected by gravitational forces and atmospheric drag, so the propagation must account for this.
 */
function drawOrbit(today, matrix, kepler_updated, nutPar) {
    // Render the satellite's orbit based on propagated position data
}

/**
 * drawSun - Renders the Sun's position relative to Earth.
 * 
 * This function calculates the Sun's position in the sky and renders it in the scene. 
 * It also affects Earth’s lighting and shading to simulate day and night.
 * 
 * How it works:
 * - Computes the Sun's position using orbital mechanics.
 * - Adds the Sun to the 3D scene and applies lighting effects.
 * 
 * @param {Array} lonlat - The Sun's longitude and latitude, used to calculate its position.
 * @param {number} JT - Julian Time for precise time-based calculations.
 * @param {number} JD - Julian Date for date-based calculations.
 * @param {number} rASun - Right Ascension of the Sun.
 * @param {number} declSun - Declination of the Sun.
 * @param {Float32Array} matrix - View matrix for rendering.
 * @param {object} nutPar - Nutation parameters for orbital corrections.
 * 
/**
 * drawSun - Renders the Sun's position relative to Earth.
 * 
 * This function calculates the Sun's position in the sky and renders it in the scene.
 * It also affects Earth’s lighting and shading to simulate day and night.
 * 
 * How it works:
 * - Computes the Sun's position using orbital mechanics and satellite propagation models.
 * - Transforms Sun's position between different frames (J2000, ECEF).
 * - Adds the Sun to the 3D scene and applies visual lighting effects.
 * - Optionally renders sub-solar points for enhanced visual effects.
 * 
 * @param {Array} lonlat - The Sun's longitude and latitude, used to calculate its position.
 * @param {number} JT - Julian Time for precise time-based calculations.
 * @param {number} JD - Julian Date for date-based calculations.
 * @param {number} rASun - Right Ascension of the Sun, used for positional adjustments.
 * @param {number} declSun - Declination of the Sun, used for lighting calculations.
 * @param {Float32Array} matrix - The view matrix used to position the Sun in 3D space.
 * @param {object} nutPar - Nutation parameters for orbital corrections to account for Earth's axial tilt.
 * 
 * Usage Example:
 * ```js
 * drawSun([lon, lat], julianTime, julianDate, rightAscension, declination, viewMatrix, nutationParams);
 * ```
 * 
 * Important Details:
 * - Ensure accurate computation of Sun's right ascension and declination for realistic positioning.
 * - Nutation parameters should be updated for precise Sun-Earth relative positioning.
 */
function drawSun(lonlat, JT, JD, rASun, declSun, matrix, nutPar) {
    // Angular size of the Sun
    const delta = 0.5;
    const D = 0.5 * zFar;  // Distance to the Sun
    const d = 2.0 * D * MathUtils.tand(delta / 2);  // Calculate diameter for correct angular size
    const scale = (d / 2.0) / a;

    // Calculate Sun's position in Cartesian coordinates
    let sunPos = Coordinates.wgs84ToCart(lonlat.lat, lonlat.lon, D * 1000);

    // Transform Sun's position if required by the user (e.g., to J2000 frame)
    if (guiControls.frame === 'J2000') {
        sunPos = Frames.posECEFToCEP(JT, JD, sunPos, nutPar);
        sunPos = Frames.posCEPToJ2000(JT, sunPos, nutPar);
    }

    // Create a matrix for positioning and scaling the Sun in the scene
    let sunMatrix = m4.translate(matrix, sunPos[0] * 0.001, sunPos[1] * 0.001, sunPos[2] * 0.001);
    sunMatrix = m4.scale(sunMatrix, scale, scale, scale);

    // Render the Sun using shaders
    earthShaders.draw(sunMatrix, rASun, declSun, LST, false, false, false, null);

    // Optionally, render sub-solar points if the user has enabled them
    if (guiControls.enableSubSolar) {
        let pSun = [];
        for (let lonDelta = 0; lonDelta <= 360.0; lonDelta++) {
            let rSubSolarDelta = Coordinates.wgs84ToCart(lonlat.lat, lonlat.lon + lonDelta, 0);

            if (guiControls.frame === 'J2000') {
                rSubSolarDelta = Frames.posECEFToCEP(JT, JD, rSubSolarDelta, nutPar);
                rSubSolarDelta = Frames.posCEPToJ2000(JT, rSubSolarDelta, nutPar);
            }
            pSun.push(MathUtils.vecmul(rSubSolarDelta, 0.001));
        }
        lineShaders.setGeometry(pSun);
        lineShaders.draw(matrix);
    }
}

/**
 * drawCaption - Draws a caption or label for an object on the canvas.
 * 
 * This function renders a text label at the specified target position in the scene.
 * The caption is displayed in the 2D canvas overlay, aligned with the 3D position
 * of the object.
 * 
 * How it works:
 * - Converts the 3D coordinates of the object into 2D screen space.
 * - Renders text on the 2D canvas at the calculated screen position.
 * 
 * @param {Array} rTarget - The target's 3D position relative to the viewer.
 * @param {string} caption - The text to display as a caption.
 * @param {Float32Array} matrix - The view matrix to convert 3D coordinates to screen space.
 * 
 * Usage Example:
 * ```js
 * drawCaption([x, y, z], "Satellite 1", viewMatrix);
 * ```
 * 
 * Important Details:
 * - Ensure that the target's position is accurately transformed into screen coordinates.
 * - The canvas context (`contextJs`) must be properly set up before drawing captions.
 */
function drawCaption(rTarget, caption, matrix) {
    // Set the style and color for the text
    contextJs.fillStyle = "rgba(" 
        + guiControls.colorSatellite[0] + "," 
        + guiControls.colorSatellite[1] + ","
        + guiControls.colorSatellite[2] + ")";
    
    contextJs.textAlign = "center";
    contextJs.textBaseline = "bottom";
    contextJs.textAlign = "right";
    contextJs.strokeStyle = contextJs.fillStyle;

    // Transform the 3D position to 2D clip space
    const clipSpace = m4.transformVector(matrix, [rTarget[0], rTarget[1], rTarget[2], 1]);
    clipSpace[0] /= clipSpace[3];
    clipSpace[1] /= clipSpace[3];

    // Convert clip space coordinates to pixel positions on the canvas
    const pixelX = (clipSpace[0] *  0.5 + 0.5) * gl.canvas.width;
    const pixelY = (clipSpace[1] * -0.5 + 0.5) * gl.canvas.height;

    // Draw the caption on the canvas at the computed position
    contextJs.fillText(caption + "    ", pixelX, pixelY); 
}

/**
 * checkIntersection - Determines if there is an intersection between a camera and an object (e.g., satellite).
 * 
 * This function checks whether a line segment from a source position (such as the camera)
 * to a target position (such as a satellite) intersects a sphere (e.g., the Earth).
 * 
 * How it works:
 * - Calculates the vector from the source to the target.
 * - Determines if the line intersects a sphere (e.g., Earth's radius) using basic vector math.
 * 
 * @param {Array} source - The source position (e.g., the camera's position).
 * @param {Array} target - The target position (e.g., the satellite's position).
 * @param {number} radius - The radius of the sphere (e.g., Earth's radius).
 * @returns {boolean} - Returns true if there is an intersection, false otherwise.
 * 
 * Usage Example:
 * ```js
 * let intersection = checkIntersection(cameraPosition, satellitePosition, earthRadius);
 * ```
 * 
 * Important Details:
 * - Ensure the source and target positions are in the same coordinate space.
 * - The radius parameter defines the size of the sphere (Earth or other objects) for intersection testing.
 */
function checkIntersection(source, target, radius) {
    // Calculate the direction vector from the source to the target
    const direction = MathUtils.vecsub(target, source);
    const distance = MathUtils.norm(direction);

    // Normalize the direction vector
    const u = MathUtils.vecmul(direction, 1 / MathUtils.norm(direction));

    // Perform the intersection test using quadratic formula
    const lambda = (MathUtils.dot(u, source) ** 2) 
                 - (MathUtils.norm(source) ** 2 - radius * radius);

    // Check if there is an intersection along the path
    if (lambda >= 0) {
        const d = -MathUtils.dot(u, source) + Math.sqrt(lambda);
        return (d < distance);  // Return true if the intersection is within the target distance
    }
    return false;  // No intersection found
}