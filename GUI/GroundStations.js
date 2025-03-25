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

/**
 * Renders uploaded ground stations using drawSatellite().
 */
function drawUploadedGroundStations(matrix, nutPar, today) {
  uploadedGroundStations.forEach((station) => {
    drawSatellite(
      {
        osvProp: {
          r: station.positionECEF,
          v: [0, 0, 0],
          ts: today,
        },
      },
      matrix,
      nutPar,
      station.color,
      0.1 // scale
    )
    drawCaption(station.positionECEF, station.name, matrix)
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
