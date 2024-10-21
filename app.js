'use strict'

var gl = null
var earthShaders = null
var lineShaders = null
var pointShaders = null

// SGP4 test:
var tleLine1 =
    '1 25544U 98067A   21356.70730882  .00006423  00000+0  12443-3 0  9993',
  tleLine2 =
    '2 25544  51.6431 130.5342 0004540 343.5826 107.2903 15.49048054317816'
// Initialize a satellite record
var satrec = sgp4.tleFromLines(['ISS (ZARYA)             ', tleLine1, tleLine2])

// Semi-major and semi-minor axes of the WGS84 ellipsoid.
var a = 6378.137
var b = 6356.75231414

// Sidereal angle.
var LST = 0

// Camera distance from Earth.
var distance = 5.0 * a
const zFar = 1000000

createControls()

// Delta time (ms) from configuration of date and time.
var dateDelta = 0

// Field of view.
var fieldOfViewRadians = MathUtils.deg2Rad(30)

let rotZToLon = (rotZ) => {
  return -90 - rotZ
}
let rotXToLat = (rotX) => {
  return 90 + rotX
}

// Rotation.
var rotX = MathUtils.deg2Rad(-90)
var rotY = MathUtils.deg2Rad(0)
var rotZ = MathUtils.deg2Rad(0)

// JS canvas
var canvasJs = document.querySelector('#canvasJs')
var contextJs = canvasJs.getContext('2d')

gl = canvas.getContext('webgl2')
if (!gl) {
  console.log('Failed to initialize GL.')
}
earthShaders = new PlanetShaders(gl, 50, 50, a, b, 15, 15)
earthShaders.init(
  'textures/8k_earth_daymap.jpg',
  'textures/8k_earth_nightmap.jpg'
)

lineShaders = new LineShaders(gl)
lineShaders.init()

pointShaders = new PointShaders(gl)
pointShaders.init()

var satellites = []
var satLines = []
var satNameToIndex = []
var satIndexToName = []

requestAnimationFrame(drawScene)

// Draw the scene.
function drawScene(time) {
  if (earthShaders.numTextures < 2) {
    requestAnimationFrame(drawScene)
    return
  }

  ISS.osv = ISS.osvIn

  canvas.width = document.documentElement.clientWidth
  canvas.height = document.documentElement.clientHeight

  gl.useProgram(earthShaders.program)

  // Avoid change to the list during the execution of the method.
  const enableList = guiControls.enableList

  // Compute Julian time.
  let dateNow = new Date()
  let today = null

  if (guiControls.timeWarp) {
    dateDelta += timeControls.warpSeconds.getValue() * 1000
    //console.log(dateDelta);
  }

  // If date and time updates are disabled, set date manually from the GUI controls:
  if (!guiControls.enableClock) {
    dateNow = new Date(
      guiControls.dateYear,
      parseInt(guiControls.dateMonth) - 1,
      guiControls.dateDay,
      guiControls.timeHour,
      guiControls.timeMinute,
      guiControls.timeSecond
    )

    // Value of dateNow is set from controls above.
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

    timeControls.yearControl.setValue(today.getFullYear())
    timeControls.monthControl.setValue(today.getMonth() + 1)
    timeControls.dayControl.setValue(today.getDate())
    timeControls.hourControl.setValue(today.getHours())
    timeControls.minuteControl.setValue(today.getMinutes())
    timeControls.secondControl.setValue(today.getSeconds())
  }

  // Use latest telemetry only if enabled. Then, the telemetry set from the UI controls is not
  // overwritten below.
  ISS.osv = createOsv(today)

  let osvSatListTeme = []
  if (enableList) {
    for (let indSat = 0; indSat < satellites.length; indSat++) {
      const sat = satellites[indSat]
      //const positionAndVelocity = satellite.propagate(sat, today);

      // Propagate list items only once every 10 seconds to avoid CPU load.
      let osvTeme
      try {
        osvTeme = sgp4.propagateTargetTs(sat, today, 10.0)
      } catch (err) {
        continue
      }

      // The position_velocity result is a key-value pair of ECI coordinates.
      // These are the base results from which all other coordinates are derived.
      const posEci = osvTeme.r
      const velEci = osvTeme.v

      if (typeof posEci !== 'undefined') {
        //console.log(posEci);
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

  // Compute Julian date and time:
  const julianTimes = TimeConversions.computeJulianTime(today)
  const JD = julianTimes.JD
  const JT = julianTimes.JT
  const T = (JT - 2451545.0) / 36525.0

  // Compute nutation parameters.
  const nutPar = Nutation.nutationTerms(T)

  // Compute equitorial coordinates of the Sun.
  const sunAltitude = new SunAltitude()
  const eqCoordsSun = sunAltitude.computeEquitorial(JT, JD)
  const rASun = eqCoordsSun.rA
  const declSun = eqCoordsSun.decl

  // Compute equitorial coordinates of the Moon.
  const moonAltitude = new MoonAltitude()
  const eqCoordsMoon = moonAltitude.computeEquitorial(JT)
  const rAMoon = eqCoordsMoon.rA
  const declMoon = eqCoordsMoon.decl

  // Compute sidereal time perform modulo to avoid floating point accuracy issues with 32-bit
  // floats in the shader:
  LST =
    MathUtils.deg2Rad(TimeConversions.computeSiderealTime(0, JD, JT, nutPar)) %
    360.0

  // Convert OSV to Osculating Keplerian elements.
  if (guiControls.keplerFix) {
    osvControls.source.setValue('OSV')

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

  // Propagate OSV only if SGP4 is not used.
  if (guiControls.source === 'TLE') {
    ISS.osvProp = ISS.osv
  } else {
    // Propagate OSV using Osculating Keplerian elements.
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

  // Compute updated keplerian elements from the propagated OSV.
  let kepler_updated = ISS.kepler // Kepler.osvToKepler(ISS.osvProp.r, ISS.osvProp.v, ISS.osvProp.ts);

  let pointsOut = []
  // Convert propagated OSV from J2000 to ECEF frame.
  let osv_ECEF = Frames.osvJ2000ToECEF(ISS.osvProp, nutPar)
  ISS.r_ECEF = osv_ECEF.r
  ISS.v_ECEF = osv_ECEF.v
  ISS.r_J2000 = ISS.osvProp.r
  ISS.v_J2000 = ISS.osvProp.v

  if (enableList) {
    for (let indSat = 0; indSat < osvSatListTeme.length; indSat++) {
      const rTeme = osvSatListTeme[indSat].r
      pointsOut.push(MathUtils.vecmul(rTeme, 0.001))
    }
    pointShaders.setGeometry(pointsOut)
  }

  // Extract the coordinates on the WGS84 ellipsoid.
  let wgs84 = Coordinates.cartToWgs84(ISS.r_ECEF)
  ISS.alt = wgs84.h
  ISS.lon = wgs84.lon
  ISS.lat = wgs84.lat

  // Distance from the origin in ECEF frame.
  const alt = MathUtils.norm(ISS.r_ECEF)

  // Compute longitude and latitude of the Sun and the Moon.
  let lonlat = sunAltitude.computeSunLonLat(rASun, declSun, JD, JT, nutPar)
  let lonlatMoon = moonAltitude.computeMoonLonLat(
    rAMoon,
    declMoon,
    JD,
    JT,
    nutPar
  )

  // Update captions.
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

  // Clear the canvas
  gl.clearColor(0, 0, 0, 255)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  contextJs.clearRect(0, 0, canvasJs.width, canvasJs.height)

  // Handle screen size updates.
  resizeCanvasToDisplaySize(gl.canvas)
  resizeCanvasToDisplaySize(canvasJs)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)

  let rECEFArray =
    [] / // Array to store r_ECEF for each selected satellite
    // for satellite coverage.

    selectedSatellites.forEach((satName) => {
      const satIndex = satNameToIndex[satName] // Get the index of the selected satellite
      const satellite = satellites[satIndex] // Retrieve the satellite data by index

      console.log(`Processing satellite: ${satName}, Index: ${satIndex}`)
      console.log(`Satellite object:`, satellite)

      if (!satellite) {
        console.error(`No satellite data found for "${satName}"`)
        return
      }

      // Propagate the satellite's position and velocity
      try {
        const osvTeme = sgp4.propagateTargetTs(satellite, today, 10.0) // Propagate to get OSV
        console.log(`OSV for ${satName}:`, osvTeme) // Log the OSV data

        const osv_ECEF = Frames.osvJ2000ToECEF(osvTeme, nutPar) // Convert OSV to ECEF
        console.log(`ECEF for ${satName}:`, osv_ECEF.r) // Log the ECEF position

        // Store r_ECEF for the satellite
        rECEFArray.push(osv_ECEF.r)

        // Optionally store velocity or other data if needed for additional functionality
      } catch (err) {
        console.error(`Error propagating satellite "${satName}":`, err)
      }
    })

  const matrix = createViewMatrix()
  drawEarth(matrix, rECEFArray, rASun, declSun, LST, JT, nutPar)
  if (guiControls.enableOrbit) {
    drawOrbit(today, matrix, kepler_updated, nutPar)
  }

  let rotMatrixTeme
  if (enableList) {
    // Performance : It is significantly faster to perform the J2000->ECEF coordinate
    // transformation in the vertex shader:
    rotMatrixTeme = createRotMatrix(today, JD, JT, nutPar)

    if (guiControls.frame === 'J2000') {
      pointShaders.draw(matrix)
    } else {
      pointShaders.draw(m4.multiply(matrix, m4.transpose(rotMatrixTeme)))
    }
  }

  if (guiControls.enableSun) {
    drawSun(lonlat, JT, JD, rASun, declSun, matrix, nutPar)
  }

  if (enableList && guiControls.showListNames) {
    // Semi-major axis:
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
        if (!checkIntersection(cameraPos, osvTeme.r, 6371000))
          drawCaption(
            MathUtils.vecsub(osvTeme.r, cameraPos),
            satIndexToName[indSat],
            matrix
          )
      } else {
        let targetEcef = sgp4.coordTemePef(osvTeme).r

        if (!checkIntersection(cameraPos, targetEcef, 6371000))
          drawCaption(
            MathUtils.vecsub(targetEcef, cameraPos),
            satIndexToName[indSat],
            matrix
          )
      }
    }
    pointShaders.setGeometry(pointsOut)
  }

  // Call drawScene again next frame
  requestAnimationFrame(drawScene)

  drawing = false
}

/**
 * Create rotation matrix for TEME -> ECEF transformation for the point
 * shader.
 *
 * @param {*} ts
 *      Time stamp.
 * @param {*} JD
 *      Julian day.
 * @param {*} JT
 *      Julian time.
 * @param {*} nutPar
 *      Nutation parameters.
 * @returns Rotation matrix.
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
 * Collect OSV from selected source and update controls.
 *
 * @param today
 *      Date of the OSV for OEM and TLE sources.
 * @returns OSV.
 */
function createOsv(today) {
  if (!today || isNaN(today.getUTCFullYear())) {
    console.error('Invalid date for OSV:', today)
    return null
  }

  let osvOut = null

  // Use latest telemetry only if enabled. Then, the telemetry set from the UI controls is not
  // overwritten below.
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
    // Set telemetry from UI controls.
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
 * Create view matrix taking into account the rotation.
 *
 * @returns The view matrix.
 */
function createViewMatrix() {
  // Compute the projection matrix.
  const fieldOfViewRadians = MathUtils.deg2Rad(guiControls.fov)
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
  const zNear = (distance - b) / 2
  const projectionMatrix = m4.perspective(
    fieldOfViewRadians,
    aspect,
    zNear,
    zFar
  )

  distance = cameraControls.distance.getValue()
  // Camera position in the clip space.
  const cameraPosition = [0, 0, distance]
  const up = [0, 1, 0]
  up[0] = MathUtils.cosd(guiControls.upLat) * MathUtils.cosd(guiControls.upLon)
  up[2] = MathUtils.cosd(guiControls.upLat) * MathUtils.sind(guiControls.upLon)
  up[1] = MathUtils.sind(guiControls.upLat)

  const target = [0, 0, 0]

  // Compute the camera's matrix using look at.
  const cameraMatrix = m4.lookAt(cameraPosition, target, up)

  // Make a view matrix from the camera matrix.
  const viewMatrix = m4.inverse(cameraMatrix)
  const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix)

  // Handle longitude locking.
  // TODO: Longitude has inconsistent value in J2000.
  if (guiControls.lockLonRot) {
    rotZ = MathUtils.deg2Rad(-90 - ISS.lon)

    if (guiControls.frame === 'J2000') {
      rotZ = MathUtils.deg2Rad(-90 - ISS.lon - MathUtils.rad2Deg(LST))
    }

    cameraControls.lon.setValue(ISS.lon)
  } else if (canvasJs.onmousemove == null) {
    rotZ = MathUtils.deg2Rad(-90 - guiControls.lon)
  }

  // Handle latitude locking.
  // TODO: Latitude has inconsistent value in J2000.
  if (guiControls.lockLatRot) {
    rotX = MathUtils.deg2Rad(-90 + ISS.lat)
    cameraControls.lat.setValue(ISS.lat)
  } else if (canvasJs.onmousemove == null) {
    rotX = MathUtils.deg2Rad(-90 + guiControls.lat)
  }

  // Rotate view projection matrix to take into account rotation to target coordinates.
  var matrix = m4.xRotate(viewProjectionMatrix, rotX)
  matrix = m4.yRotate(matrix, rotY)
  matrix = m4.zRotate(matrix, rotZ)

  return matrix
}

/**
 * Draw Earth.
 *
 * @param {*} matrix
 *      View matrix.
 * @param {*} rASun
 *      Right-ascension of the Sun.
 * @param {*} declSun
 *      Declination of the Sun.
 * @param {*} LST
 *      Sidereal time.
 * @param {*} JT
 *      Julian time.
 * @param {*} nutPar
 *      Nutation parameters.
 */
function drawEarth(matrix, rECEFArray, rASun, declSun, LST, JT, nutPar) {
  let rECEF = null
  if (guiControls.enableVisibility) {
    rECEF = rECEFArray
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
 * Draw orbit.
 *
 * @param {*} today
 *      Date.
 * @param {*} matrix
 *      View matrix.
 * @param {*} kepler_updated
 *      Kepler parameters
 * @param {*} JD
 *      Julian date.
 */
function drawOrbit(today, matrix, kepler_updated, nutPar) {
  let p = []
  const period = Kepler.computePeriod(kepler_updated.a, kepler_updated.mu)

  // Division by 100.0 leads to numerical issues.
  const jdStep = period / (guiControls.orbitPoints + 0.01)

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
      const osvProp = Kepler.propagate(kepler_updated, deltaDate)

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

  lineShaders.setGeometry(p)
  lineShaders.draw(matrix)

  // The satellite is replaced with a smaller sphere without textures, map nor grid.
  let issMatrix = m4.translate(matrix, ISS.x, ISS.y, ISS.z)
  const factor = 0.01 * guiControls.satelliteScale
  issMatrix = m4.scale(issMatrix, factor, factor, factor)
  earthShaders.draw(issMatrix, 0, 0, LST, false, false, false, null)
}

/**
 * Draw Sun.
 *
 * @param {*} lonlat
 *      Longitude and latitude.
 * @param {*} JT
 *      Julian time.
 * @param {*} JD
 *      Julian date.
 * @param {*} rASun
 *      Right Ascension of the Sun.
 * @param {*} declSun
 *      Declination of the Sun.
 * @param {*} matrix
 *      View matrix.
 * @param {*} nutPar
 *      Nutation parameters.
 */
function drawSun(lonlat, JT, JD, rASun, declSun, matrix, nutPar) {
  // Angular size of the Sun.
  const delta = 0.5
  // Distance to the Sun.
  const D = 0.5 * zFar
  // Diameter of the Sun in order have correct angular size.
  const d = 2.0 * D * MathUtils.tand(delta / 2)

  const scale = d / 2.0 / a

  let sunPos = Coordinates.wgs84ToCart(lonlat.lat, lonlat.lon, D * 1000)

  if (guiControls.frame === 'J2000') {
    sunPos = Frames.posECEFToCEP(JT, JD, sunPos, nutPar)
    sunPos = Frames.posCEPToJ2000(JT, sunPos, nutPar)
  }
  let sunMatrix = m4.translate(
    matrix,
    sunPos[0] * 0.001,
    sunPos[1] * 0.001,
    sunPos[2] * 0.001
  )
  sunMatrix = m4.scale(sunMatrix, scale, scale, scale)
  earthShaders.draw(sunMatrix, rASun, declSun, LST, false, false, false, null)

  let pSun = []
  if (guiControls.enableSubSolar) {
    for (let lonDelta = 0; lonDelta <= 360.0; lonDelta++) {
      let rSubSolarDelta = Coordinates.wgs84ToCart(
        lonlat.lat,
        lonlat.lon + lonDelta,
        0
      )

      if (guiControls.frame === 'J2000') {
        rSubSolarDelta = Frames.posECEFToCEP(JT, JD, rSubSolarDelta, nutPar)
        rSubSolarDelta = Frames.posCEPToJ2000(JT, rSubSolarDelta, nutPar)
      }

      if (lonDelta != 0.0) {
        pSun.push(MathUtils.vecmul(rSubSolarDelta, 0.001))
      }
      pSun.push(MathUtils.vecmul(rSubSolarDelta, 0.001))
    }
    let rSubSolar = Coordinates.wgs84ToCart(lonlat.lat, lonlat.lon, 0)
    if (guiControls.frame === 'J2000') {
      rSubSolar = Frames.posECEFToCEP(JT, JD, rSubSolar)
      rSubSolar = Frames.posCEPToJ2000(JT, rSubSolar, nutPar)
    }
    pSun.push(pSun[pSun.length - 1])
    pSun.push(MathUtils.vecmul(rSubSolar, 0.001))
  }
  for (let lonDelta = 0; lonDelta < 361.0; lonDelta++) {
    let rSubSolarDelta = Coordinates.wgs84ToCart(
      lonlat.lat,
      lonlat.lon + lonDelta,
      D * 1000
    )

    if (guiControls.frame === 'J2000') {
      rSubSolarDelta = Frames.posECEFToCEP(JT, JD, rSubSolarDelta, nutPar)
      rSubSolarDelta = Frames.posCEPToJ2000(JT, rSubSolarDelta, nutPar)
    }

    pSun.push(MathUtils.vecmul(rSubSolarDelta, 0.001))
    if (lonDelta != 0.0 || guiControls.enableSubSolar) {
      pSun.push(MathUtils.vecmul(rSubSolarDelta, 0.001))
    }
  }
  pSun.push(pSun[pSun.length - 1])

  lineShaders.setGeometry(pSun)
  lineShaders.draw(matrix)
}

/**
 * Draw caption.
 *
 * @param {*} rTarget
 *      Relative position of the target.
 * @param {*} caption
 *      Caption.
 * @param {*} matrix
 *      View Matrix.
 */
function drawCaption(rTarget, caption, matrix) {
  contextJs.fillStyle =
    'rgba(' +
    guiControls.colorSatellite[0] +
    ',' +
    guiControls.colorSatellite[1] +
    ',' +
    guiControls.colorSatellite[2] +
    ')'

  contextJs.textAlign = 'center'
  contextJs.textBaseline = 'bottom'
  contextJs.textAlign = 'right'
  contextJs.strokeStyle = contextJs.fillStyle

  const clipSpace = m4.transformVector(matrix, [
    rTarget[0],
    rTarget[1],
    rTarget[2],
    1,
  ])
  clipSpace[0] /= clipSpace[3]
  clipSpace[1] /= clipSpace[3]
  const pixelX = (clipSpace[0] * 0.5 + 0.5) * gl.canvas.width
  const pixelY = (clipSpace[1] * -0.5 + 0.5) * gl.canvas.height
  contextJs.fillText(caption + '    ', pixelX, pixelY)
}

/**
 * Check whether there is an Earth intersection in front of the satellite
 * to be drawn.
 *
 * @param {*} source
 *      Camera position.
 * @param {*} target
 *      Satellite position.
 * @param {*} radius
 *      Radius of the sphere.
 * @returns {*} Whether there is an intersection.
 */
function checkIntersection(source, target, radius) {
  const c = [0, 0, 0]
  const direction = MathUtils.vecsub(target, source)
  const distance = MathUtils.norm(direction)
  const u = MathUtils.vecmul(direction, 1 / MathUtils.norm(direction))
  const lambda =
    MathUtils.dot(u, source) ** 2 -
    (MathUtils.norm(source) ** 2 - radius * radius)

  if (lambda >= 0) {
    const d = -MathUtils.dot(u, source) + Math.sqrt(lambda)
    return d < distance
  }
  return false
}
