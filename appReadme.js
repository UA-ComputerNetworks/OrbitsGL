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

function drawScene(time) {
    // 1. Check if necessary textures for Earth are loaded. If not, request to draw the scene later.
    if (earthShaders.numTextures < 2) {
        requestAnimationFrame(drawScene);
        return;
    }

    // 2. Initialize ISS (International Space Station) with its current position and velocity data (OSV).
    ISS.osv = ISS.osvIn;

    // 3. Resize the canvas to the current screen size.
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;

    // 4. Use the Earth shaders program for rendering the Earth and satellite objects.
    gl.useProgram(earthShaders.program);

    // 5. Create a snapshot of the enabled satellite list from the GUI controls to prevent changes while rendering.
    const enableList = guiControls.enableList;

    // 6. Compute the current date and time. The time is adjusted based on whether time-warping is enabled.
    let dateNow = new Date();
    let today = null;

    if (guiControls.timeWarp) {
        // Time warping speeds up time in the simulation.
        dateDelta += timeControls.warpSeconds.getValue() * 1000;
    }

    // 7. If real-time clock updates are disabled, manually set the date and time from the user interface (GUI).
    if (!guiControls.enableClock) {
        dateNow = new Date(guiControls.dateYear, parseInt(guiControls.dateMonth) - 1, guiControls.dateDay, 
            guiControls.timeHour, guiControls.timeMinute, guiControls.timeSecond);

        // Calculate a future time based on user input (deltaDays, deltaHours, etc.).
        today = new Date(dateNow.getTime()
            + 24 * 3600 * 1000 * guiControls.deltaDays
            + 3600 * 1000 * guiControls.deltaHours
            + 60 * 1000 * guiControls.deltaMins
            + 1000 * guiControls.deltaSecs);
    } else {
        // Calculate the time with delta adjustments if real-time updates are enabled.
        today = new Date(dateNow.getTime()
            + 24 * 3600 * 1000 * guiControls.deltaDays
            + 3600 * 1000 * guiControls.deltaHours
            + 60 * 1000 * guiControls.deltaMins
            + 1000 * guiControls.deltaSecs
            + dateDelta);

        // Update the time controls on the GUI to reflect the calculated time.
        timeControls.yearControl.setValue(today.getFullYear());
        timeControls.monthControl.setValue(today.getMonth() + 1);
        timeControls.dayControl.setValue(today.getDate());
        timeControls.hourControl.setValue(today.getHours());
        timeControls.minuteControl.setValue(today.getMinutes());
        timeControls.secondControl.setValue(today.getSeconds());
    }

    // 8. Create a new OSV (Orbital State Vector) for the ISS using the calculated time.
    ISS.osv = createOsv(today);

    // 9. Initialize an empty array to store propagated satellite positions.
    let osvSatListTeme = [];
    if (enableList) {
        // If the satellite list is enabled, loop through all satellites.
        for (let indSat = 0; indSat < satellites.length; indSat++) {
            const sat = satellites[indSat];

            // Propagate the satellite's orbital state vector using the SGP4 model for 10 seconds into the future.
            let osvTeme;
            try {
                osvTeme = sgp4.propagateTargetTs(sat, today, 10.0);
            } catch (err) {
                continue; // Skip this satellite if there's an error.
            }

            // Check if the satellite's position (ECI coordinates) is available.
            const posEci = osvTeme.r;
            const velEci = osvTeme.v;

            if (typeof posEci !== 'undefined') {
                // Store the satellite's propagated position and velocity, converting from kilometers to meters.
                let osvSat = {r: [osvTeme.r[0] * 1000.0, osvTeme.r[1] * 1000.0, osvTeme.r[2] * 1000.0], 
                              v: [osvTeme.v[0] * 1000.0, osvTeme.v[1] * 1000.0, osvTeme.v[2] * 1000.0], 
                              ts: today};
                osvSatListTeme.push(osvSat); // Add to the list of satellites.
            }
        }
    }

    // 10. Compute the current Julian Date and Time, which is used for astronomical calculations.
    const julianTimes = TimeConversions.computeJulianTime(today);
    const JD = julianTimes.JD;
    const JT = julianTimes.JT;
    const T = (JT - 2451545.0) / 36525.0; // Compute centuries since the J2000 epoch.

    // 11. Compute nutation parameters (a slight wobble in Earth's rotation) based on the time T.
    const nutPar = Nutation.nutationTerms(T);

    // 12. Compute the equatorial coordinates of the Sun and the Moon, which are used to render them in the scene.
    const sunAltitude = new SunAltitude();
    const eqCoordsSun = sunAltitude.computeEquitorial(JT, JD);
    const rASun = eqCoordsSun.rA;  // Right Ascension of the Sun
    const declSun = eqCoordsSun.decl;  // Declination of the Sun

    const moonAltitude = new MoonAltitude();
    const eqCoordsMoon = moonAltitude.computeEquitorial(JT);
    const rAMoon = eqCoordsMoon.rA;  // Right Ascension of the Moon
    const declMoon = eqCoordsMoon.decl;  // Declination of the Moon

    // 13. Compute the Local Sidereal Time (LST) to determine the rotation of the Earth relative to the stars.
    LST = MathUtils.deg2Rad(TimeConversions.computeSiderealTime(0, JD, JT, nutPar)) % 360.0;

    // 14. If the Keplerian elements need to be fixed from the GUI, update them accordingly.
    if (guiControls.keplerFix) {
        osvControls.source.setValue('OSV');

        ISS.kepler = {
            a: guiControls.keplera * 1000.0,  // Semi-major axis (converted to meters)
            mu: 3.986004418e14,  // Gravitational constant for Earth
            ecc_norm: guiControls.keplere,  // Eccentricity
            incl: guiControls.kepleri,  // Inclination
            Omega: guiControls.keplerOmega,  // Longitude of ascending node
            omega: guiControls.kepleromega,  // Argument of periapsis
            M: guiControls.keplerM,  // Mean anomaly
            ts: today  // Timestamp
        };
        // Compute the semi-minor axis based on the eccentricity and semi-major axis.
        ISS.kepler.b = ISS.kepler.a * Math.sqrt(1.0 - ISS.kepler.ecc_norm * ISS.kepler.ecc_norm);
    } else {
        // Convert the Orbital State Vector (OSV) to Keplerian elements.
        ISS.kepler = Kepler.osvToKepler(ISS.osv.r, ISS.osv.v, ISS.osv.ts);
    }

    // 15. If the source is "TLE" (Two-Line Element), no further propagation is needed.
    if (guiControls.source === "TLE") {
        ISS.osvProp = ISS.osv;
    } else {
        // Propagate the OSV using Keplerian elements.
        ISS.osvProp = Kepler.propagate(ISS.kepler, today);
        if (guiControls.keplerFix) {
            // Update the GUI with the propagated OSV values.
            osvControls.osvYear.setValue(ISS.osvProp.ts.getFullYear());
            osvControls.osvMonth.setValue(ISS.osvProp.ts.getMonth() + 1);
            osvControls.osvDay.setValue(ISS.osvProp.ts.getDate());
            osvControls.osvHour.setValue(ISS.osvProp.ts.getHours());
            osvControls.osvMinute.setValue(ISS.osvProp.ts.getMinutes());
            osvControls.osvSecond.setValue(ISS.osvProp.ts.getSeconds());
            osvControls.osvX.setValue(ISS.osvProp.r[0] * 0.001);  // Convert back to kilometers
            osvControls.osvY.setValue(ISS.osvProp.r[1] * 0.001);
            osvControls.osvZ.setValue(ISS.osvProp.r[2] * 0.001);
            osvControls.osvVx.setValue(ISS.osvProp.v[0]);
            osvControls.osvVy.setValue(ISS.osvProp.v[1]);
            osvControls.osvVz.setValue(ISS.osvProp.v[2]);
        }
    }

    // 16. Update the Keplerian elements based on the propagated OSV if no fix is applied.
    if (!guiControls.keplerFix) {
        function toNonNegative(angle) {
            return angle < 0 ? angle + 360 : angle;
        }

        const keplerUpdated = Kepler.osvToKepler(ISS.osvProp.r, ISS.osvProp.v, ISS.osvProp.ts);
        keplerControls.keplere.setValue(keplerUpdated.ecc_norm);
        keplerControls.keplera.setValue(keplerUpdated.a * 0.001);  // Convert to kilometers
        keplerControls.kepleri.setValue(keplerUpdated.incl);
        keplerControls.keplerOmega.setValue(toNonNegative(keplerUpdated.Omega));
        keplerControls.kepleromega.setValue(toNonNegative(keplerUpdated.omega));
        keplerControls.keplerM.setValue(toNonNegative(keplerUpdated.M));
    }

    // 17. Convert the propagated OSV from the J2000 frame to the Earth-Centered Earth-Fixed (ECEF) frame.
    let osv_ECEF = Frames.osvJ2000ToECEF(ISS.osvProp, nutPar);
    ISS.r_ECEF = osv_ECEF.r;  // Position in the ECEF frame
    ISS.v_ECEF = osv_ECEF.v;  // Velocity in the ECEF frame
    ISS.r_J2000 = ISS.osvProp.r;  // Position in the J2000 frame
    ISS.v_J2000 = ISS.osvProp.v;  // Velocity in the J2000 frame

    // 18. Convert the satellite's position from Cartesian coordinates to latitude, longitude, and altitude (WGS84).
    let wgs84 = Coordinates.cartToWgs84(ISS.r_ECEF);
    ISS.alt = wgs84.h;  // Altitude above Earth's surface
    ISS.lon = wgs84.lon;  // Longitude
    ISS.lat = wgs84.lat;  // Latitude

    // 19. Compute and update various astronomical data for the Sun and the Moon.
    let lonlat = sunAltitude.computeSunLonLat(rASun, declSun, JD, JT, nutPar);
    let lonlatMoon = moonAltitude.computeMoonLonLat(rAMoon, declMoon, JD, JT, nutPar);

    // 20. Clear the WebGL canvas and set up the rendering environment.
    gl.clearColor(0, 0, 0, 255);  // Clear the screen to black
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear color and depth buffers
    contextJs.clearRect(0, 0, canvasJs.width, canvasJs.height);  // Clear the 2D context

    // 21. Handle changes in the screen size and update the canvas accordingly.
    resizeCanvasToDisplaySize(gl.canvas);
    resizeCanvasToDisplaySize(canvasJs);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);  // Set the viewport to match the canvas size
    gl.enable(gl.DEPTH_TEST);  // Enable depth testing for 3D rendering
    gl.enable(gl.CULL_FACE);  // Enable face culling (hides back faces of objects)

    // 22. Create the view matrix for rendering (camera view).
    const matrix = createViewMatrix();

    // 23. Draw the Earth using the view matrix, Sun position, and various parameters.
    drawEarth(matrix, rASun, declSun, LST, JT, nutPar);

    // 24. If orbits are enabled in the GUI, draw the orbit path for the ISS or selected satellite.
    if (guiControls.enableOrbit) {
        drawOrbit(today, matrix, kepler_updated, nutPar);
    }

    // 25. If satellites are enabled, draw them using their TEME (True Equator, Mean Equinox) frame positions.
    if (enableList) {
        // Create a rotation matrix for the current time.
        let rotMatrixTeme = createRotMatrix(today, JD, JT, nutPar);

        // Draw the satellites either in the J2000 frame or the ECEF frame, depending on the GUI controls.
        if (guiControls.frame === 'J2000') {
            pointShaders.draw(matrix);  // Draw in J2000 frame
        } else {
            pointShaders.draw(m4.multiply(matrix, m4.transpose(rotMatrixTeme)));  // Draw in ECEF frame
        }
    }

    // 26. Draw the Sun if enabled in the GUI.
    if (guiControls.enableSun) {
        drawSun(lonlat, JT, JD, rASun, declSun, matrix, nutPar);
    }

    // 27. Draw the satellite names near their positions in the scene if enabled in the GUI.
    if (enableList && guiControls.showListNames) {
        const a = 6378137;  // Semi-major axis of Earth (WGS84)
        const cameraPos = [
            1000 * guiControls.distance * MathUtils.cosd(guiControls.lat) * MathUtils.cosd(guiControls.lon),
            1000 * guiControls.distance * MathUtils.cosd(guiControls.lat) * MathUtils.sind(guiControls.lon),
            1000 * guiControls.distance * MathUtils.sind(guiControls.lat)
        ];

        for (let indSat = 0; indSat < osvSatListTeme.length; indSat++) {
            const osvTeme = {r: osvSatListTeme[indSat].r, v: [0, 0, 0], JT: JT, JD: JD, ts: today};
            if (guiControls.frame === 'J2000') {
                if (!checkIntersection(cameraPos, osvTeme.r, 6371000)) {
                    drawCaption(MathUtils.vecsub(osvTeme.r, cameraPos), satIndexToName[indSat], matrix);
                }
            } else {
                let targetEcef = sgp4.coordTemePef(osvTeme).r;

                if (!checkIntersection(cameraPos, targetEcef, 6371000)) {
                    drawCaption(MathUtils.vecsub(targetEcef, cameraPos), satIndexToName[indSat], matrix);
                }
            }
        }

        pointShaders.setGeometry(pointsOut);  // Set satellite geometries for rendering.
    }

    // 28. Request to draw the next frame to keep the scene animating.
    requestAnimationFrame(drawScene);
}