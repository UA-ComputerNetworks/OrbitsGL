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
      0.015 // scale
    )
    drawCaption(station.positionECEF, station.name, matrix)
  })
}
