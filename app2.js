'use strict'

// Declare WebGL context and shader programs
var gl = null // WebGL context for rendering
var earthShaders = null // Shaders to render Earth
var lineShaders = null // Shaders to render lines (satellite orbits)
var pointShaders = null // Shaders to render points (satellites)

// SGP4 Test: Initialize TLE (Two-Line Element) data for ISS
var tleLine1 =
  '1 25544U 98067A   21356.70730882  .00006423  00000+0  12443-3 0  9993'
var tleLine2 =
  '2 25544  51.6431 130.5342 0004540 343.5826 107.2903 15.49048054317816'

// Initialize satellite record using SGP4 library from TLE data
var satrec = sgp4.tleFromLines(['ISS (ZARYA)', tleLine1, tleLine2])

// Earth constants for the WGS84 ellipsoid
var a = 6378.137 // Semi-major axis (in km)
var b = 6356.75231414 // Semi-minor axis (in km)

// Sidereal time (used to calculate the current orientation of the Earth)
var LST = 0

// Camera distance from the Earth
var distance = 5.0 * a
const zFar = 1000000 // Maximum camera depth

// Create user controls (time warp, camera, satellite visibility, etc.)
createControls()

// Time delta for managing time warp and date/time adjustments
var dateDelta = 0

// Camera's field of view in radians (converted from degrees)
var fieldOfViewRadians = MathUtils.deg2Rad(30)

// Utility functions to convert rotation angles to geographic coordinates
let rotZToLon = (rotZ) => -90 - rotZ // Convert Z-axis rotation to longitude
let rotXToLat = (rotX) => 90 + rotX // Convert X-axis rotation to latitude

// Initial rotation values (X, Y, Z axes) for camera
var rotX = MathUtils.deg2Rad(-90)
var rotY = MathUtils.deg2Rad(0)
var rotZ = MathUtils.deg2Rad(0)

// JavaScript canvas for drawing 2D overlays (e.g., satellite labels)
var canvasJs = document.querySelector('#canvasJs')
var contextJs = canvasJs.getContext('2d')

// Initialize WebGL context for rendering
gl = canvas.getContext('webgl2')
if (!gl) {
  console.log('Failed to initialize GL.')
}

// Initialize shaders for rendering Earth
earthShaders = new PlanetShaders(gl, 50, 50, a, b, 15, 15)
earthShaders.init(
  'textures/8k_earth_daymap.jpg',
  'textures/8k_earth_nightmap.jpg'
)

// Initialize line and point shaders for drawing satellite orbits and positions
lineShaders = new LineShaders(gl)
lineShaders.init()

pointShaders = new PointShaders(gl)
pointShaders.init()

// Arrays for storing satellite data and satellite orbits
var satellites = []
var satLines = []
var satNameToIndex = []
var satIndexToName = []

// Start the main animation loop
requestAnimationFrame(drawScene)

// Draw the scene (called on every animation frame)
function drawScene(time) {
  // Check if textures are loaded before rendering
  if (earthShaders.numTextures < 2) {
    requestAnimationFrame(drawScene)
    return
  }

  // Set the initial orbital state vector for the ISS
  ISS.osv = ISS.osvIn

  // Set the size of the canvas to fit the window
  canvas.width = document.documentElement.clientWidth
  canvas.height = document.documentElement.clientHeight

  // Use the Earth shaders for rendering the planet
  gl.useProgram(earthShaders.program)

  // Avoid changing the list of satellites during rendering
  const enableList = guiControls.enableList

  // Compute the current date and time
  let dateNow = new Date()
  let today = null

  // If time warp is enabled, adjust the delta for time warping
  if (guiControls.timeWarp) {
    dateDelta += timeControls.warpSeconds.getValue() * 1000
  }

  // If the clock is disabled, manually set the date from GUI controls
  if (!guiControls.enableClock) {
    dateNow = new Date(
      guiControls.dateYear,
      parseInt(guiControls.dateMonth) - 1,
      guiControls.dateDay,
      guiControls.timeHour,
      guiControls.timeMinute,
      guiControls.timeSecond
    )

    today = new Date(
      dateNow.getTime() +
        24 * 3600 * 1000 * guiControls.deltaDays +
        3600 * 1000 * guiControls.deltaHours +
        60 * 1000 * guiControls.deltaMins +
        1000 * guiControls.deltaSecs
    )
  } else {
    today = new Date(
      dateNow.getTime() +
        24 * 3600 * 1000 * guiControls.deltaDays +
        3600 * 1000 * guiControls.deltaHours +
        60 * 1000 * guiControls.deltaMins +
        1000 * guiControls.deltaSecs +
        dateDelta
    )

    // Update the GUI with the current time
    timeControls.yearControl.setValue(today.getFullYear())
    timeControls.monthControl.setValue(today.getMonth() + 1)
    timeControls.dayControl.setValue(today.getDate())
    timeControls.hourControl.setValue(today.getHours())
    timeControls.minuteControl.setValue(today.getMinutes())
    timeControls.secondControl.setValue(today.getSeconds())
  }

  // Propagate the ISS state vector to the current time
  ISS.osv = createOsv(today)

  let osvSatListTeme = []
  if (enableList) {
    // Update positions for all satellites in the list
    for (let indSat = 0; indSat < satellites.length; indSat++) {
      const sat = satellites[indSat]
      let osvTeme
      try {
        osvTeme = sgp4.propagateTargetTs(sat, today, 10.0)
      } catch (err) {
        continue
      }

      // Extract the satellite's position in ECI coordinates
      const posEci = osvTeme.r
      const velEci = osvTeme.v

      // Store the satellite's position if available
      if (typeof posEci !== 'undefined') {
        let osvSat = {
          r: [
            osvTeme.r[0] * 1000.0,
            osvTeme.r[1] * 1000.0,
            osvTeme.r[2] * 1000.0,
          ],
          v: [
            osvTeme.v[0] * 1000.0,
            osvTeme.v[1] * 1000.0,
            osvTeme.v[2] * 1000.0,
          ],
          ts: today,
        }
        osvSatListTeme.push(osvSat)
      }
    }
  }

  // Compute the Julian date for astronomical calculations
  const julianTimes = TimeConversions.computeJulianTime(today)
  const JD = julianTimes.JD
  const JT = julianTimes.JT
  const T = (JT - 2451545.0) / 36525.0

  // Compute the nutation parameters based on the Julian time
  const nutPar = Nutation.nutationTerms(T)

  // Compute the right ascension and declination of the Sun and Moon
  const sunAltitude = new SunAltitude()
  const eqCoordsSun = sunAltitude.computeEquitorial(JT, JD)
  const rASun = eqCoordsSun.rA
  const declSun = eqCoordsSun.decl

  const moonAltitude = new MoonAltitude()
  const eqCoordsMoon = moonAltitude.computeEquitorial(JT)
  const rAMoon = eqCoordsMoon.rA
  const declMoon = eqCoordsMoon.decl

  // Compute sidereal time to account for Earth's rotation
  LST =
    MathUtils.deg2Rad(TimeConversions.computeSiderealTime(0, JD, JT, nutPar)) %
    360.0

  // Update Keplerian elements if the user has fixed them
  if (guiControls.keplerFix) {
    ISS.kepler = {
      a: guiControls.keplera * 1000.0,
      mu: 3.986004418e14,
      ecc_norm: guiControls.keplere,
      incl: guiControls.kepleri,
      Omega: guiControls.keplerOmega,
      omega: guiControls.kepleromega,
      M: guiControls.keplerM,
      ts: today,
    }
    ISS.kepler.b =
      ISS.kepler.a * Math.sqrt(1.0 - ISS.kepler.ecc_norm * ISS.kepler.ecc_norm)
  } else {
    ISS.kepler = Kepler.osvToKepler(ISS.osv.r, ISS.osv.v, ISS.osv.ts)
  }

  // Propagate the satellite using SGP4 or Keplerian elements
  if (guiControls.source === 'TLE') {
    ISS.osvProp = ISS.osv
  } else {
    ISS.osvProp = Kepler.propagate(ISS.kepler, today)
    if (guiControls.keplerFix) {
      osvControls.osvYear.setValue(ISS.osvProp.ts.getFullYear())
      osvControls.osvMonth.setValue(ISS.osvProp.ts.getMonth() + 1)
      osvControls.osvDay.setValue(ISS.osvProp.ts.getDate())
      osvControls.osvHour.setValue(ISS.osvProp.ts.getHours())
      osvControls.osvMinute.setValue(ISS.osvProp.ts.getMinutes())
      osvControls.osvSecond.setValue(ISS.osvProp.ts.getSeconds())
      osvControls.osvX.setValue(ISS.osvProp.r[0] * 0.001)
      osvControls.osvY.setValue(ISS.osvProp.r[1] * 0.001)
      osvControls.osvZ.setValue(ISS.osvProp.r[2] * 0.001)
      osvControls.osvVx.setValue(ISS.osvProp.v[0])
      osvControls.osvVy.setValue(ISS.osvProp.v[1])
      osvControls.osvVz.setValue(ISS.osvProp.v[2])
    }
  }

  // If Keplerian elements are not fixed, update the GUI controls
  if (!guiControls.keplerFix) {
    function toNonNegative(angle) {
      if (angle < 0) {
        return angle + 360
      } else {
        return angle
      }
    }
    const keplerUpdated = Kepler.osvToKepler(
      ISS.osvProp.r,
      ISS.osvProp.v,
      ISS.osvProp.ts
    )
    keplerControls.keplere.setValue(keplerUpdated.ecc_norm)
    keplerControls.keplera.setValue(keplerUpdated.a * 0.001)
    keplerControls.kepleri.setValue(keplerUpdated.incl)
    keplerControls.keplerOmega.setValue(toNonNegative(keplerUpdated.Omega))
    keplerControls.kepleromega.setValue(toNonNegative(keplerUpdated.omega))
    keplerControls.keplerM.setValue(toNonNegative(keplerUpdated.M))
  }

  // Convert the propagated OSV from J2000 to ECEF coordinates for visualization
  let osv_ECEF = Frames.osvJ2000ToECEF(ISS.osvProp, nutPar)
  ISS.r_ECEF = osv_ECEF.r
  ISS.v_ECEF = osv_ECEF.v
  ISS.r_J2000 = ISS.osvProp.r
  ISS.v_J2000 = ISS.osvProp.v

  // If a list of satellites is enabled, render their orbits
  if (enableList) {
    for (let indSat = 0; indSat < osvSatListTeme.length; indSat++) {
      const rTeme = osvSatListTeme[indSat].r
      pointsOut.push(MathUtils.vecmul(rTeme, 0.001))
    }
    pointShaders.setGeometry(pointsOut)
  }

  // Compute the satellite's longitude, latitude, and altitude
  let wgs84 = Coordinates.cartToWgs84(ISS.r_ECEF)
  ISS.alt = wgs84.h
  ISS.lon = wgs84.lon
  ISS.lat = wgs84.lat

  // Compute Sun and Moon longitude and latitude for visualization
  let lonlat = sunAltitude.computeSunLonLat(rASun, declSun, JD, JT, nutPar)
  let lonlatMoon = moonAltitude.computeMoonLonLat(
    rAMoon,
    declMoon,
    JD,
    JT,
    nutPar
  )

  // Update the GUI captions for celestial body coordinates
  updateCaptions(
    rASun,
    declSun,
    lonlat,
    rAMoon,
    declMoon,
    lonlatMoon,
    today,
    JT
  )

  // Clear the canvas and prepare for rendering
  gl.clearColor(0, 0, 0, 255)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  contextJs.clearRect(0, 0, canvasJs.width, canvasJs.height)

  // Handle screen resizing for responsive rendering
  resizeCanvasToDisplaySize(gl.canvas)
  resizeCanvasToDisplaySize(canvasJs)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)

  // Create the view matrix for camera positioning and orientation
  const matrix = createViewMatrix()

  // Draw the Earth model using the shaders
  drawEarth(matrix, rASun, declSun, LST, JT, nutPar)

  // If orbits are enabled, draw the satellite's orbit
  if (guiControls.enableOrbit) {
    drawOrbit(today, matrix, keplerUpdated, nutPar)
  }

  // If a list of satellites is enabled, render their positions
  let rotMatrixTeme
  if (enableList) {
    rotMatrixTeme = createRotMatrix(today, JD, JT, nutPar)

    if (guiControls.frame === 'J2000') {
      pointShaders.draw(matrix)
    } else {
      pointShaders.draw(m4.multiply(matrix, m4.transpose(rotMatrixTeme)))
    }
  }

  // If the Sun is enabled, draw the Sun in the scene
  if (guiControls.enableSun) {
    drawSun(lonlat, JT, JD, rASun, declSun, matrix, nutPar)
  }

  // If satellite names are enabled, render labels for each satellite
  if (enableList && guiControls.showListNames) {
    const a = 6378137
    const cameraPos = [
      1000 *
        guiControls.distance *
        MathUtils.cosd(guiControls.lat) *
        MathUtils.cosd(guiControls.lon),
      1000 *
        guiControls.distance *
        MathUtils.cosd(guiControls.lat) *
        MathUtils.sind(guiControls.lon),
      1000 * guiControls.distance * MathUtils.sind(guiControls.lat),
    ]

    for (let indSat = 0; indSat < osvSatListTeme.length; indSat++) {
      const osvTeme = {
        r: osvSatListTeme[indSat].r,
        v: [0, 0, 0],
        JT: JT,
        JD: JD,
        ts: today,
      }
      if (guiControls.frame === 'J2000') {
        if (!checkIntersection(cameraPos, osvTeme.r, 6371000)) {
          drawCaption(
            MathUtils.vecsub(osvTeme.r, cameraPos),
            satIndexToName[indSat],
            matrix
          )
        }
      } else {
        let targetEcef = sgp4.coordTemePef(osvTeme).r
        if (!checkIntersection(cameraPos, targetEcef, 6371000)) {
          drawCaption(
            MathUtils.vecsub(targetEcef, cameraPos),
            satIndexToName[indSat],
            matrix
          )
        }
      }
    }
    pointShaders.setGeometry(pointsOut)
  }

  // Call drawScene again for the next frame (animation loop)
  requestAnimationFrame(drawScene)

  drawing = false
}

/**
 * Create rotation matrix for TEME -> ECEF transformation.
 * This is used to transform satellite positions between coordinate systems.
 */
function createRotMatrix(today, JD, JT, nutPar) {
  const rotMatrixJ2000 = new Float32Array(16)
  const osvVec1 = { r: [1, 0, 0], v: [0, 0, 0], JT: JT, JD: JD, ts: today }
  const osvVec2 = { r: [0, 1, 0], v: [0, 0, 0], JT: JT, JD: JD, ts: today }
  const osvVec3 = { r: [0, 0, 1], v: [0, 0, 0], JT: JT, JD: JD, ts: today }
  let osvVec1_ECEF = sgp4.coordTemePef(osvVec1)
  let osvVec2_ECEF = sgp4.coordTemePef(osvVec2)
  let osvVec3_ECEF = sgp4.coordTemePef(osvVec3)
  rotMatrixJ2000[0] = osvVec1_ECEF.r[0]
  rotMatrixJ2000[1] = osvVec2_ECEF.r[0]
  rotMatrixJ2000[2] = osvVec3_ECEF.r[0]
  rotMatrixJ2000[4] = osvVec1_ECEF.r[1]
  rotMatrixJ2000[5] = osvVec2_ECEF.r[1]
  rotMatrixJ2000[6] = osvVec3_ECEF.r[1]
  rotMatrixJ2000[8] = osvVec1_ECEF.r[2]
  rotMatrixJ2000[9] = osvVec2_ECEF.r[2]
  rotMatrixJ2000[10] = osvVec3_ECEF.r[2]
  rotMatrixJ2000[15] = 1

  return rotMatrixJ2000
}

/**
 * Create orbital state vectors (OSV) from the selected source (e.g., TLE, Telemetry, OEM).
 * This function gathers the necessary data for propagating the satellite's position.
 */
function createOsv(today) {
  let osvOut = null

  // Use telemetry if enabled, otherwise use TLE or other sources
  if (guiControls.source === 'Telemetry') {
    osvOut = ISS.osvIn

    osvControls.osvYear.setValue(ISS.osv.ts.getFullYear())
    osvControls.osvMonth.setValue(ISS.osv.ts.getMonth() + 1)
    osvControls.osvDay.setValue(ISS.osv.ts.getDate())
    osvControls.osvHour.setValue(ISS.osv.ts.getHours())
    osvControls.osvMinute.setValue(ISS.osv.ts.getMinutes())
    osvControls.osvSecond.setValue(ISS.osv.ts.getSeconds())
    osvControls.osvX.setValue(ISS.osv.r[0] * 0.001)
    osvControls.osvY.setValue(ISS.osv.r[1] * 0.001)
    osvControls.osvZ.setValue(ISS.osv.r[2] * 0.001)
    osvControls.osvVx.setValue(ISS.osv.v[0])
    osvControls.osvVy.setValue(ISS.osv.v[1])
    osvControls.osvVz.setValue(ISS.osv.v[2])
  } else if (guiControls.source === 'OEM') {
    const osvOem = getClosestOEMOsv(today)
    osvOut = osvOem

    osvControls.osvYear.setValue(osvOut.ts.getFullYear())
    osvControls.osvMonth.setValue(osvOut.ts.getMonth() + 1)
    osvControls.osvDay.setValue(osvOut.ts.getDate())
    osvControls.osvHour.setValue(osvOut.ts.getHours())
    osvControls.osvMinute.setValue(osvOut.ts.getMinutes())
    osvControls.osvSecond.setValue(osvOut.ts.getSeconds())
    osvControls.osvX.setValue(osvOut.r[0] * 0.001)
    osvControls.osvY.setValue(osvOut.r[1] * 0.001)
    osvControls.osvZ.setValue(osvOut.r[2] * 0.001)
    osvControls.osvVx.setValue(osvOut.v[0])
    osvControls.osvVy.setValue(osvOut.v[1])
    osvControls.osvVz.setValue(osvOut.v[2])
  } else if (guiControls.source === 'TLE') {
    let osvTeme
    try {
      osvTeme = sgp4.propagateTargetTs(satrec, today, 0.0)
    } catch (err) {
      alert(err)
    }
    const osvJ2000 = sgp4.coordTemeJ2000(osvTeme)

    osvControls.osvX.setValue(osvJ2000.r[0])
    osvControls.osvY.setValue(osvJ2000.r[1])
    osvControls.osvZ.setValue(osvJ2000.r[2])
    osvControls.osvVx.setValue(osvJ2000.v[0] * 1000.0)
    osvControls.osvVy.setValue(osvJ2000.v[1] * 1000.0)
    osvControls.osvVz.setValue(osvJ2000.v[2] * 1000.0)

    osvOut = {
      r: [
        osvJ2000.r[0] * 1000.0,
        osvJ2000.r[1] * 1000.0,
        osvJ2000.r[2] * 1000.0,
      ],
      v: [
        osvJ2000.v[0] * 1000.0,
        osvJ2000.v[1] * 1000.0,
        osvJ2000.v[2] * 1000.0,
      ],
      ts: today,
    }
    osvControls.osvYear.setValue(today.getFullYear())
    osvControls.osvMonth.setValue(today.getMonth() + 1)
    osvControls.osvDay.setValue(today.getDate())
    osvControls.osvHour.setValue(today.getHours())
    osvControls.osvMinute.setValue(today.getMinutes())
    osvControls.osvSecond.setValue(today.getSeconds())
  } else if (guiControls.source === 'OSV') {
    osvOut = {
      r: [
        osvControls.osvX.getValue() * 1000.0,
        osvControls.osvY.getValue() * 1000.0,
        osvControls.osvZ.getValue() * 1000.0,
      ],
      v: [
        osvControls.osvVx.getValue(),
        osvControls.osvVy.getValue(),
        osvControls.osvVz.getValue(),
      ],
      ts: new Date(
        osvControls.osvYear.getValue(),
        parseInt(osvControls.osvMonth.getValue()) - 1,
        osvControls.osvDay.getValue(),
        osvControls.osvHour.getValue(),
        osvControls.osvMinute.getValue(),
        osvControls.osvSecond.getValue()
      ),
    }
  }

  return osvOut
}

/**
 * Create view matrix for camera and rendering.
 * This handles the camera positioning and rotations for the 3D scene.
 */
function createViewMatrix() {
  // Compute the projection matrix (camera view)
  const fieldOfViewRadians = MathUtils.deg2Rad(guiControls.fov)
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
  const zNear = (distance - b) / 2
  const projectionMatrix = m4.perspective(
    fieldOfViewRadians,
    aspect,
    zNear,
    zFar
  )

  // Update camera distance from controls
  distance = cameraControls.distance.getValue()
  const cameraPosition = [0, 0, distance]
  const up = [0, 1, 0]

  // Compute camera's "up" direction based on GUI controls
  up[0] = MathUtils.cosd(guiControls.upLat) * MathUtils.cosd(guiControls.upLon)
  up[2] = MathUtils.cosd(guiControls.upLat) * MathUtils.sind(guiControls.upLon)
  up[1] = MathUtils.sind(guiControls.upLat)

  const target = [0, 0, 0]

  // Create the camera matrix using "lookAt" function
  const cameraMatrix = m4.lookAt(cameraPosition, target, up)

  // Convert the camera matrix to a view matrix
  const viewMatrix = m4.inverse(cameraMatrix)
  const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix)

  // Handle locking the camera's rotation to the satellite's longitude and latitude
  if (guiControls.lockLonRot) {
    rotZ = MathUtils.deg2Rad(-90 - ISS.lon)
    if (guiControls.frame === 'J2000') {
      rotZ = MathUtils.deg2Rad(-90 - ISS.lon - MathUtils.rad2Deg(LST))
    }
    cameraControls.lon.setValue(ISS.lon)
  } else if (canvasJs.onmousemove == null) {
    rotZ = MathUtils.deg2Rad(-90 - guiControls.lon)
  }

  if (guiControls.lockLatRot) {
    rotX = MathUtils.deg2Rad(-90 + ISS.lat)
    cameraControls.lat.setValue(ISS.lat)
  } else if (canvasJs.onmousemove == null) {
    rotX = MathUtils.deg2Rad(-90 + guiControls.lat)
  }

  // Rotate the view matrix based on current rotation settings
  var matrix = m4.xRotate(viewProjectionMatrix, rotX)
  matrix = m4.yRotate(matrix, rotY)
  matrix = m4.zRotate(matrix, rotZ)

  return matrix
}

/**
 * Draw the Earth using shaders and current state (textures, rotation, etc.)
 */
function drawEarth(matrix, rASun, declSun, LST, JT, nutPar) {
  let rECEF = null
  if (guiControls.enableVisibility) {
    rECEF = ISS.r_ECEF
  }

  let earthMatrix = matrix
  if (guiControls.frame === 'J2000') {
    const modPar = Frames.getMODParams(JT)
    earthMatrix = m4.zRotate(earthMatrix, LST)
    earthMatrix = m4.xRotate(
      earthMatrix,
      -MathUtils.deg2Rad(nutPar.eps + nutPar.deps)
    )
    earthMatrix = m4.zRotate(earthMatrix, -MathUtils.deg2Rad(nutPar.dpsi))
    earthMatrix = m4.xRotate(earthMatrix, MathUtils.deg2Rad(nutPar.eps))
    earthMatrix = m4.zRotate(earthMatrix, -MathUtils.deg2Rad(modPar.z))
    earthMatrix = m4.yRotate(earthMatrix, MathUtils.deg2Rad(modPar.nu))
    earthMatrix = m4.zRotate(earthMatrix, -MathUtils.deg2Rad(modPar.zeta))
  }

  earthShaders.draw(
    earthMatrix,
    rASun,
    declSun,
    LST,
    guiControls.enableTextures,
    guiControls.enableGrid,
    guiControls.enableMap,
    rECEF
  )
}

/**
 * Draw the satellite's orbit using the current Keplerian elements and date.
 */
function drawOrbit(today, matrix, keplerUpdated, nutPar) {
  let p = []
  const period = Kepler.computePeriod(keplerUpdated.a, keplerUpdated.mu)

  // Step through the orbit in time (small increments)
  const jdStep = period / (guiControls.orbitPoints + 0.01)

  // Compute orbit positions for a period of time before and after the current position
  for (
    let jdDelta = -period * guiControls.orbitsBefore;
    jdDelta <= period * guiControls.orbitsAfter;
    jdDelta += jdStep
  ) {
    const deltaDate = new Date(today.getTime() + 1000 * jdDelta)

    let x = 0
    let y = 0
    let z = 0
    if (guiControls.source === 'TLE') {
      const osvTeme = sgp4.propagateTargetTs(satrec, deltaDate, 0.0)
      const osvJ2000 = sgp4.coordTemeJ2000(osvTeme, nutPar)
      const posEci = osvJ2000.r
      const velEci = osvJ2000.v
      const osvPropJ2000 = {
        r: [posEci[0] * 1000.0, posEci[1] * 1000.0, posEci[2] * 1000.0],
        v: [velEci[0], velEci[1], velEci[2]],
        ts: deltaDate,
      }

      if (guiControls.frame === 'ECEF') {
        const osvEcef = Frames.osvJ2000ToECEF(osvPropJ2000, nutPar)
        ;[x, y, z] = MathUtils.vecmul(osvEcef.r, 0.001)
      } else if (guiControls.frame === 'J2000') {
        ;[x, y, z] = [posEci[0], posEci[1], posEci[2]]
      }
    } else {
      const osvProp = Kepler.propagate(keplerUpdated, deltaDate)

      if (guiControls.frame === 'ECEF') {
        const osv_ECEF = Frames.osvJ2000ToECEF(osvProp, nutPar)
        ;[x, y, z] = MathUtils.vecmul(osv_ECEF.r, 0.001)
      } else if (guiControls.frame === 'J2000') {
        ;[x, y, z] = MathUtils.vecmul(osvProp.r, 0.001)
      }
    }

    p.push([x, y, z])
    if (p.length != 1) {
      p.push([x, y, z])
    }
  }
  p.push(p[p.length - 1])
  if (guiControls.frame === 'ECEF') {
    ;[ISS.x, ISS.y, ISS.z] = MathUtils.vecmul(ISS.r_ECEF, 0.001)
  } else if (guiControls.frame === 'J2000') {
    ;[ISS.x, ISS.y, ISS.z] = MathUtils.vecmul(ISS.r_J2000, 0.001)
  }
  p.push([ISS.x, ISS.y, ISS.z])
  p.push([0, 0, 0])

  // Render the orbit as a line using shaders
  lineShaders.setGeometry(p)
  lineShaders.draw(matrix)

  // Replace the satellite with a small sphere at its current position
  let issMatrix = m4.translate(matrix, ISS.x, ISS.y, ISS.z)
  const factor = 0.01 * guiControls.satelliteScale
  issMatrix = m4.scale(issMatrix, factor, factor, factor)
  earthShaders.draw(issMatrix, 0, 0, LST, false, false, false, null)
}

/**
 * Draw the Sun in the scene based on its current position.
 */
function drawSun(lonlat, JT, JD, rASun, declSun, matrix, nutPar) {
  // The Sun's angular size and distance from Earth
  const delta = 0.5
  const D = 0.5 * zFar
  const d = 2.0 * D * MathUtils.tand(delta / 2)

  const scale = d / 2.0 / a

  // Compute the Sun's position in Cartesian coordinates
  let sunPos = Coordinates.wgs84ToCart(lonlat.lat, lonlat.lon, D * 1000)

  if (guiControls.frame === 'J2000') {
    sunPos = Frames.posECEFToCEP(JT, JD, sunPos, nutPar)
    sunPos = Frames.posCEPToJ2000(JT, sunPos, nutPar)
  }

  // Create a transformation matrix for positioning the Sun
  let sunMatrix = m4.translate(
    matrix,
    sunPos[0] * 0.001,
    sunPos[1] * 0.001,
    sunPos[2] * 0.001
  )
  sunMatrix = m4.scale(sunMatrix, scale, scale, scale)

  // Draw the Sun as a simple sphere
  earthShaders.draw(sunMatrix, rASun, declSun, LST, false, false, false, null)
}
