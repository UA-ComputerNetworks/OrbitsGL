'use strict'

var gl = null
var earthShaders = null
var lineShaders = null
var pointShaders = null

const groundStations = [
  { name: 'Los Angeles, CA', lat: 34.0522, lon: -118.2437, alt: 0 },
  { name: 'Redmond, WA (Starlink HQ)', lat: 47.6731, lon: -122.1185, alt: 0 },
  { name: 'Hawthorne, CA (SpaceX HQ)', lat: 33.9206, lon: -118.3272, alt: 0 },
  { name: 'Boca Chica, TX', lat: 26.014, lon: -97.1562, alt: 0 },
  { name: 'Orlando, FL', lat: 28.5383, lon: -81.3792, alt: 0 },
]

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

var selectedSatellites = [] // Assuming this is populated from SelectDialog.
let satelliteObjects = []

var firstSatelliteEpoch = null // for the epoch time.
let currentFileIndex = 0

requestAnimationFrame(drawScene)

let today = null
let isEpochSet = false // Initialize the flag

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
  gui.width = 350

  // Compute Julian time.
  let dateNow = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate(),
      new Date().getUTCHours(),
      new Date().getUTCMinutes(),
      new Date().getUTCSeconds()
    )
  )

  // Calculate base time (dateNow)
  if (guiControls.enableClock) {
    // Use current system time in UTC if "Enable Clock" is ON
    dateNow = dateNow
  } else if (satellites.length > 0 && firstSatelliteEpoch) {
    // Use epoch time of the first satellite (Make sure it's stored in UTC)
    dateNow = new Date(firstSatelliteEpoch.getTime())
  } else {
    // Fallback to manual time from GUI (Ensure it remains UTC)
    dateNow = new Date(
      Date.UTC(
        guiControls.dateYear,
        parseInt(guiControls.dateMonth) - 1,
        guiControls.dateDay,
        guiControls.timeHour,
        guiControls.timeMinute,
        guiControls.timeSecond
      )
    )
  }

  // Increment time with time warp if enabled
  if (guiControls.timeWarp) {
    dateDelta += timeControls.warpSeconds.getValue() * 1000
  } else {
    if (tleFiles.length == 0 || satellites.length == 0) {
      dateDelta = 0
    }
  }

  // Calculate "today" using base time and adjustments
  today = new Date(
    Date.UTC(
      dateNow.getUTCFullYear(),
      dateNow.getUTCMonth(),
      dateNow.getUTCDate(),
      dateNow.getUTCHours(),
      dateNow.getUTCMinutes(),
      dateNow.getUTCSeconds()
    ) +
      24 * 3600 * 1000 * guiControls.deltaDays +
      3600 * 1000 * guiControls.deltaHours +
      60 * 1000 * guiControls.deltaMins +
      1000 * guiControls.deltaSecs +
      dateDelta
  )

  // Update GUI time display to reflect "today" (without triggering configureTime)
  timeControls.yearControl.setValue(today.getUTCFullYear(), false)
  timeControls.monthControl.setValue(today.getUTCMonth() + 1, false)
  timeControls.dayControl.setValue(today.getUTCDate(), false)
  timeControls.hourControl.setValue(today.getUTCHours(), false)
  timeControls.minuteControl.setValue(today.getUTCMinutes(), false)
  timeControls.secondControl.setValue(today.getUTCSeconds(), false)

  checkAndSwitchFiles()

  // Use latest telemetry only if enabled. Then, the telemetry set from the UI controls is not
  // overwritten below.
  ISS.osv = createOsv(today)

  let osvSatListTeme = []
  if (enableList) {
    for (let indSat = 0; indSat < satellites.length; indSat++) {
      const sat = satellites[indSat]

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

  const matrix = createViewMatrix()
  drawEarth(matrix, rASun, declSun, LST, JT, nutPar)

  // Draw selected satellites selected from Select TLE.
  selectedSatellites.forEach((satellite) => {
    createOsvForSatellite(satellite, today)
    if (guiControls.enableOrbit) {
      drawOrbit(today, satellite, matrix, nutPar)
    }

    drawSatellite(satellite, matrix, nutPar)
  })

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

  drawISLLines(matrix, nutPar, today)
  visualizeShortestPaths(matrix, nutPar, today)

  // For groundStations visualisation.

  // Convert to ECEF before rendering
  groundStations.forEach((station) => {
    station.positionECEF = latLonToECEF(station.lat, station.lon, station.alt)
  })

  drawGroundStationsCustom(matrix, nutPar, today)

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

function createOsvForSatellite(satellite, today) {
  if (!satellite.satrec || !satellite.satrec.tle) {
    console.error(`Satellite ${satellite.name} is missing TLE data.`)
    return
  }

  console.log(`satrec is:`, satellite.satrec)
  try {
    const osvTeme = sgp4.propagateTargetTs(satellite.satrec, today, 0.0)
    const osvJ2000 = sgp4.coordTemeJ2000(osvTeme)

    satellite.osvProp = {
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

    console.log(`OSV computed for ${satellite.name}:`, satellite.osvProp)

    // Create Keplerian parameters from OSV
    const keplerParams = Kepler.osvToKepler(
      satellite.osvProp.r,
      satellite.osvProp.v,
      satellite.osvProp.ts
    )

    satellite.kepler = keplerParams

    console.log(`Kepler parameters for ${satellite.name}:`, satellite.kepler)
  } catch (error) {
    console.error(
      `Error in createOsvForSatellite for ${satellite.name}:`,
      error
    )
  }
}

function drawOrbit(today, satellite, matrix, nutPar) {
  if (!satellite.kepler || !satellite.kepler.ts) {
    console.warn(`No Kepler data available for satellite ${satellite.name}`)
    return
  }

  console.log(
    `Drawing orbit for ${satellite.name} with Kepler parameters`,
    satellite.kepler
  )

  let p = []
  const period = Kepler.computePeriod(satellite.kepler.a, satellite.kepler.mu)

  // Reduce the number of points by increasing the step size
  const reducedOrbitPoints = Math.max(
    500,
    Math.floor(guiControls.orbitPoints / 2)
  ) // Reduce points
  const jdStep = period / (reducedOrbitPoints + 0.01)

  for (
    let jdDelta = -period * guiControls.orbitsBefore;
    jdDelta <= period * guiControls.orbitsAfter;
    jdDelta += jdStep
  ) {
    const deltaDate = new Date(today.getTime() + 1000 * jdDelta)

    try {
      const osvProp = Kepler.propagate(satellite.kepler, deltaDate)
      let x = 0,
        y = 0,
        z = 0

      if (guiControls.frame === 'ECEF') {
        const osv_ECEF = Frames.osvJ2000ToECEF(osvProp, nutPar)
        ;[x, y, z] = MathUtils.vecmul(osv_ECEF.r, 0.001)
      } else if (guiControls.frame === 'J2000') {
        ;[x, y, z] = MathUtils.vecmul(osvProp.r, 0.001)
      }

      p.push([x, y, z])
    } catch (error) {
      console.error(
        `Propagation error for ${satellite.name} at ${deltaDate}:`,
        error
      )
      continue
    }
  }

  console.log(`Orbit points for ${satellite.name}:`, p)
  const color = [255, 255, 255] // Blue for ISL lines
  lineShaders.setGeometry(p, color)
  lineShaders.draw(matrix)
}

function drawSatellite(
  satellite,
  matrix,
  nutPar,
  customColor = null,
  customScale = null
) {
  const osv_ECEF = Frames.osvJ2000ToECEF(satellite.osvProp, nutPar)
  const [x, y, z] = MathUtils.vecmul(osv_ECEF.r, 0.001)
  let satMatrix = m4.translate(matrix, x, y, z)

  // Apply custom scale if provided
  const factor = (customScale || 0.0075) * guiControls.satelliteScale
  satMatrix = m4.scale(satMatrix, factor, factor, factor)

  // Apply custom color if provided
  const color = customColor || satellite.color || [200, 200, 200] // Default color if not set

  earthShaders.setSatelliteColor(color[0], color[1], color[2])
  earthShaders.draw(satMatrix, 0, 0, LST, false, false, false, color)
}

function drawISLLines(matrix, nutPar, today) {
  const highlightColor1 = [255, 255, 0] // Green for one end

  const satelliteScale = 0.01 // Scale to avoid oversized satellites
  const lineThickness = 3.0 // Adjust line thickness

  islData.links.forEach(({ satellite1, satellite2 }) => {
    const sat1 = satelliteObjects[satellite1]
    const sat2 = satelliteObjects[satellite2]

    if (sat1 && !sat1.osvPropISL) {
      createOsvForISLSatellite(sat1, today)
    }
    if (sat2 && !sat2.osvPropISL) {
      createOsvForISLSatellite(sat2, today)
    }

    if (sat1 && sat2 && sat1.osvProp && sat2.osvProp) {
      drawSatellite(sat1, matrix, nutPar, highlightColor1, satelliteScale)
      drawSatellite(sat2, matrix, nutPar, highlightColor1, satelliteScale)

      const osv1 = Frames.osvJ2000ToECEF(sat1.osvProp, nutPar)
      const osv2 = Frames.osvJ2000ToECEF(sat2.osvProp, nutPar)

      const [x1, y1, z1] = MathUtils.vecmul(osv1.r, 0.001)
      const [x2, y2, z2] = MathUtils.vecmul(osv2.r, 0.001)

      const linePoints = [
        [x1, y1, z1],
        [x2, y2, z2],
      ]

      const color = [255, 0, 0] // Red for ISL lines

      lineShaders.setStyle(5, 'solid') // Sets the line thickness to 5.0
      lineShaders.setGeometry(linePoints, color)
      lineShaders.draw(matrix)
    } else {
      console.warn(
        `ISL not drawn: Missing data for ${satellite1} or ${satellite2}`
      )
    }
  })
}

function createOsvForISLSatellite(satellite, today) {
  if (!satellite.satrec || !satellite.satrec.tle) {
    console.error(`Satellite ${satellite.name} is missing TLE data for ISL.`)
    return
  }

  try {
    // Step 1: Propagate satellite using SGP4
    const osvTeme = sgp4.propagateTargetTs(satellite.satrec, today, 0.0)
    if (!osvTeme || !osvTeme.r || !osvTeme.v) {
      console.error(`SGP4 propagation failed for satellite ${satellite.name}.`)
      return
    }

    if (
      Math.abs(osvTeme.r[0]) > 100000 ||
      Math.abs(osvTeme.r[1]) > 100000 ||
      Math.abs(osvTeme.r[2]) > 100000
    ) {
      console.warn(
        `Propagation resulted in unrealistic position for satellite ${satellite.name}.`,
        osvTeme
      )
      return
    }

    // Step 2: Convert TEME to J2000
    const osvJ2000 = sgp4.coordTemeJ2000(osvTeme)
    if (!osvJ2000 || !osvJ2000.r || !osvJ2000.v) {
      console.error(
        `TEME to J2000 conversion failed for satellite ${satellite.name}.`
      )
      return
    }

    // Step 3: Assign OSV data to satellite
    satellite.osvProp = {
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
      ts: new Date(today), // Ensure the timestamp is set with a valid Date object
    }

    console.log(`ISL OSV computed for ${satellite.name}:`, satellite.osvProp)
  } catch (error) {
    console.error(
      `Error in createOsvForISLSatellite for ${satellite.name}:`,
      error
    )
  }
}

function drawShortestPath(matrix, nutPar, satelliteIds, today) {
  console.log(`Visualizing shortest path for satellites:`, satelliteIds)
  console.log(`Today:`, today)

  const highlightColor1 = [255, 255, 0] // Green for one end
  const satelliteScale = 0.01 // Scale to avoid oversized satellites
  const lineThickness = 3.0 // Adjust line thickness

  for (let i = 0; i < satelliteIds.length - 1; i++) {
    const sat1Name = satelliteIds[i] // Treat IDs as names
    const sat2Name = satelliteIds[i + 1]

    console.log(`Processing path segment between ${sat1Name} and ${sat2Name}`)

    const sat1 = satelliteObjects[sat1Name] // Get satellite by name
    const sat2 = satelliteObjects[sat2Name]

    if (!sat1) {
      console.warn(`Satellite ${sat1Name} not found in satelliteObjects`)
    } else {
      console.log(`Satellite ${sat1Name} found. OSV:`, sat1.osvProp)
    }

    if (!sat2) {
      console.warn(`Satellite ${sat2Name} not found in satelliteObjects`)
    } else {
      console.log(`Satellite ${sat2Name} found. OSV:`, sat2.osvProp)
    }

    createOsvForISLSatellite(sat1, today)
    createOsvForISLSatellite(sat2, today)

    if (sat1 && sat2 && sat1.osvProp && sat2.osvProp) {
      console.log(`Both satellites have OSVs. Drawing segment.`)
      drawSatellite(sat1, matrix, nutPar, highlightColor1, satelliteScale)
      drawSatellite(sat2, matrix, nutPar, highlightColor1, satelliteScale)

      const osv1 = Frames.osvJ2000ToECEF(sat1.osvProp, nutPar)
      const osv2 = Frames.osvJ2000ToECEF(sat2.osvProp, nutPar)

      console.log(`Converted OSVs to ECEF for ${sat1Name} and ${sat2Name}:`, {
        osv1,
        osv2,
      })

      const [x1, y1, z1] = MathUtils.vecmul(osv1.r, 0.001)
      const [x2, y2, z2] = MathUtils.vecmul(osv2.r, 0.001)

      const linePoints = [
        [x1, y1, z1],
        [x2, y2, z2],
      ]

      const color = [0, 255, 0] // Green for shortest paths
      lineShaders.setStyle(5, 'solid') // Set line style and thickness
      lineShaders.setGeometry(linePoints, color)
      lineShaders.draw(matrix)

      console.log(
        `Successfully drew path segment between ${sat1Name} and ${sat2Name}`
      )
    } else {
      console.warn(
        `Path not drawn: Missing propagated data for ${sat1Name} or ${sat2Name}`
      )
    }
  }
}

// For groundstations.

function latLonToECEF(lat, lon, alt = 0) {
  const R = 6371 // Earth's radius in km
  const latRad = (Math.PI / 180) * lat
  const lonRad = (Math.PI / 180) * lon

  const X = (R + alt) * Math.cos(latRad) * Math.cos(lonRad)
  const Y = (R + alt) * Math.cos(latRad) * Math.sin(lonRad)
  const Z = (R + alt) * Math.sin(latRad)

  return [X, Y, Z] // Returns ECEF coordinates
}

function drawGroundStationsCustom(matrix, nutPar, today) {
  groundStations.forEach((station) => {
    const [x, y, z] = station.positionECEF // Already computed ECEF

    //console.log(`Drawing ground station ${station.name} at (${x}, ${y}, ${z})`)

    // Scale the ground station markers appropriately
    let groundStationMatrix = m4.translate(matrix, x, y, z)
    groundStationMatrix = m4.scale(groundStationMatrix, 0.01, 0.01, 0.01) // Adjust size

    // Use `earthShaders` to draw the ground station
    const color = [0, 255, 0] // Green for visibility
    earthShaders.setSatelliteColor(color[0], color[1], color[2])
    earthShaders.draw(
      groundStationMatrix,
      0,
      0,
      LST,
      false,
      false,
      false,
      color
    )
  })
}
