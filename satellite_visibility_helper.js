// app.js

function drawGroundToSatelliteLinks(matrix, nutPar, today) {
  if (
    !uploadedGroundStations ||
    uploadedGroundStations.length === 0 ||
    !satelliteObjects
  ) {
    return
  }
  const elevationThreshold = 25
  const linkColor = [0, 255, 255]
  const linkWidth = 1.5

  log(`[drawGroundToSatelliteLinks] Frame update running...`)

  uploadedGroundStations.forEach((station) => {
    Object.values(satelliteObjects).forEach((satellite) => {
      if (!satellite.osvProp || !satellite.osvProp.r) return

      const satOsvECEF = Frames.osvJ2000ToECEF(satellite.osvProp, nutPar)
      const stationPositionKm = station.positionECEF
      const satellitePositionKm = MathUtils.vecmul(satOsvECEF.r, 0.001)
      const elevation = calculateElevation(
        stationPositionKm,
        satellitePositionKm,
        station.name,
        satellite.name
      )

      if (!isNaN(elevation) && elevation > elevationThreshold) {
        log(
          `[drawGroundToSatelliteLinks] SUCCESS: Link condition met for "${
            station.name
          }" -> "${satellite.name}" (Elevation: ${elevation.toFixed(2)}°)`
        )
        const linePoints = [stationPositionKm, satellitePositionKm]
        lineShaders.setGeometry(linePoints, linkColor)
        lineShaders.setStyle(linkWidth, 'solid')
        lineShaders.draw(matrix)
      }
    })
  })
}

// MAKE SURE THIS CALL IS AT THE END OF YOUR drawScene function
// drawGroundToSatelliteLinks(matrix, nutPar, today);
