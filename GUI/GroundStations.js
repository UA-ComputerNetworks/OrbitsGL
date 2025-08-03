// ===========================
// GroundStations.js
// ===========================

// Array to store ground stations uploaded by user
let uploadedGroundStations = []

// Predefined color palette for ground stations (rotates)
const stationColors = [
  [255, 0, 0],
  [0, 255, 0],
  [0, 0, 255],
  [255, 255, 0],
  [255, 0, 255],
  [0, 255, 255],
  [255, 165, 0],
  [128, 0, 128],
  [0, 128, 128],
  [128, 128, 0],
]

/**
 * Parses uploaded ground station file.
 * Supports lines with format: Name, Lat, Lon
 * Ignores lines starting with '#' (comments).
 */
function loadGroundStationsFromText(fileContent) {
  const lines = fileContent.split('\n')
  uploadedGroundStations = []

  lines.forEach((line, index) => {
    line = line.trim()
    if (line.startsWith('#') || line === '') return

    const parts = line.split(',')
    if (parts.length < 3) return

    const name = parts[0].trim()
    const lat = parseFloat(parts[1])
    const lon = parseFloat(parts[2])
    const color = stationColors[index % stationColors.length]

    uploadedGroundStations.push({
      name,
      lat,
      lon,
      alt: 0,
      color,
      positionECEF: latLonToECEF(lat, lon, 0),
    })
  })
}

function drawCaption2(ecefPos, caption, viewMatrix) {
  const clip = m4.transformVector(viewMatrix, [...ecefPos, 1])
  const ndcX = clip[0] / clip[3]
  const ndcY = clip[1] / clip[3]

  const pixelX = (ndcX * 0.5 + 0.5) * gl.canvas.width
  const pixelY = (ndcY * -0.5 + 0.5) * gl.canvas.height

  console.log(
    `[Draw Caption] '${caption}' at screen (${pixelX.toFixed(
      0
    )}, ${pixelY.toFixed(0)})`
  )

  contextJs.fillStyle = `rgba(${guiControls.colorSatellite[0]}, ${guiControls.colorSatellite[1]}, ${guiControls.colorSatellite[2]}, 255)`
  contextJs.textAlign = 'center'
  contextJs.textBaseline = 'bottom'
  contextJs.fillText(caption, pixelX, pixelY)
}

function checkIntersectionGroundStations(source, target, radius) {
  // All in ECEF
  const ray = MathUtils.vecsub(target, source)
  const dir = MathUtils.vecmul(ray, 1 / MathUtils.norm(ray)) // normalize

  // Assume Earth centered at (0,0,0)
  const oc = source
  const b = 2 * MathUtils.dot(dir, oc)
  const c = MathUtils.dot(oc, oc) - radius * radius

  const discriminant = b * b - 4 * c // (a = 1 so ignored)

  // Add detailed debug logging
  console.log(`🧪 checkIntersection`)
  console.log(`→ source: ${source.map((x) => x.toFixed(2)).join(', ')}`)
  console.log(`→ target: ${target.map((x) => x.toFixed(2)).join(', ')}`)
  console.log(`→ discriminant = ${discriminant.toFixed(2)}`)

  if (discriminant < 0) {
    console.log('✅ No intersection — visible')
    return false
  }

  // Compute distance to intersection point
  const t = (-b - Math.sqrt(discriminant)) / 2
  const distanceToTarget = MathUtils.norm(ray)

  const hit = t > 0 && t < distanceToTarget
  console.log(
    `→ intersection t = ${t.toFixed(
      2
    )}, distance to target = ${distanceToTarget.toFixed(2)}`
  )
  return hit
}

// function isVisibleFromCamera(cameraPos, targetECEF) {
//   const cameraDir = MathUtils.vecmul(cameraPos, -1) // vector pointing from camera to Earth center
//   const targetDir = MathUtils.vecsub(targetECEF, [0, 0, 0]) // vector from Earth's center to station

//   const cameraUnit = MathUtils.vecmul(cameraDir, 1 / MathUtils.norm(cameraDir))
//   const targetUnit = MathUtils.vecmul(targetDir, 1 / MathUtils.norm(targetDir))

//   const dot = MathUtils.dot(cameraUnit, targetUnit)

//   console.log(
//     `🧠 [Visibility] dot = ${dot.toFixed(4)} (${
//       dot > 0 ? '✅ Visible' : '⛔ Occluded'
//     })`
//   )
//   return dot > 0
// }

function isVisibleFromCamera(cameraPos, stationECEF) {
  // Normalize both vectors from Earth center
  const cameraUnit = MathUtils.vecmul(cameraPos, 1 / MathUtils.norm(cameraPos))
  const stationUnit = MathUtils.vecmul(
    stationECEF,
    1 / MathUtils.norm(stationECEF)
  )

  // dot > 0 means station and camera are on same hemisphere
  const dot = MathUtils.dot(cameraUnit, stationUnit)

  console.log(
    `🧠 [Visibility] dot(camera, station) = ${dot.toFixed(4)} → ${
      dot > 0 ? '✅ VISIBLE' : '⛔ OCCLUDED'
    }`
  )

  return dot > 0
}

function drawUploadedGroundStations(matrix, nutPar, today) {
  // Compute camera position in ECEF
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

  uploadedGroundStations.forEach((station) => {
    const ecef = station.positionECEF
    const name = station.name

    console.log(`\n📡 Checking Station: ${name}`)
    console.log(`[ECEF] ${ecef.map((x) => x.toFixed(2)).join(', ')}`)

    if (!isVisibleFromCamera(cameraPos, station.positionECEF)) {
      console.log(`⛔ ${name} is behind Earth — skipping.`)
      return
    }

    console.log(`✅ ${name} is visible — drawing.`)

    // Draw marker
    drawSatellite(
      {
        osvProp: {
          r: ecef,
          v: [0, 0, 0],
          ts: today,
        },
      },
      matrix,
      nutPar,
      station.color || [0, 255, 0],
      0.05
    )

    // Draw label
    drawCaption(ecef, name, matrix)
  })
}

/**
 * Draws the uploaded ground stations using proper point shader logic.
 * This version uses `earthShaders.draw` directly like built-in ground stations.
 *
 * @param {Object} matrix - View matrix
 * @param {Object} nutPar - Nutation parameters
 * @param {Date} today - Current timestamp
 */
function drawUploadedGroundStationsCustom(matrix, nutPar, today) {
  uploadedGroundStations.forEach((station) => {
    const [x, y, z] = station.positionECEF // Already ECEF computed

    // Create matrix for point position and scale
    let stationMatrix = m4.translate(matrix, x, y, z)
    stationMatrix = m4.scale(stationMatrix, 0.01, 0.01, 0.01) // Adjust size

    const color = station.color || [255, 255, 255] // Default white if none

    // Draw using the same method as ground station markers
    earthShaders.setSatelliteColor(color[0], color[1], color[2])
    earthShaders.draw(stationMatrix, 0, 0, LST, false, false, false, color)
  })
}

// GroundStations.js for Calculating elevation btw satellite and groundstation.

function calculateElevation(stationECEF, satelliteECEF, stationName, satName) {
  log(`[calculateElevation] For Station: "${stationName}" -> Sat: "${satName}"`)
  const losVector = MathUtils.vecsub(satelliteECEF, stationECEF)
  const upVector = stationECEF
  const lineOfSightUnit = MathUtils.vecmul(
    losVector,
    1 / MathUtils.norm(losVector)
  )
  const upUnit = MathUtils.vecmul(upVector, 1 / MathUtils.norm(upVector))
  if (isNaN(lineOfSightUnit[0])) {
    return NaN
  }
  const sinElevation = MathUtils.dot(upUnit, lineOfSightUnit)
  const elevationDeg = MathUtils.rad2Deg(Math.asin(sinElevation))
  log(
    `[calculateElevation]   - Station ECEF(km): [${stationECEF
      .map((c) => c.toFixed(2))
      .join(', ')}]`
  )
  log(
    `[calculateElevation]   - Sat ECEF(km): [${satelliteECEF
      .map((c) => c.toFixed(2))
      .join(', ')}]`
  )
  log(`[calculateElevation]   - Result: ${elevationDeg.toFixed(4)}°`)
  return elevationDeg
}
