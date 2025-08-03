// app.js

// /**
//  * [drawGroundToSatelliteLinks] Draws lines from ground stations to visible satellites
//  * if they meet the elevation criteria. (Corrected Version)
//  *
//  * @param {object} matrix - The view-projection matrix for rendering.
//  * @param {object} nutPar - Nutation parameters for coordinate transformations.
//  * @param {Date} today - The current simulation timestamp.
//  */
// function drawGroundToSatelliteLinks(matrix, nutPar, today) {
//   if (
//     !uploadedGroundStations ||
//     uploadedGroundStations.length === 0 ||
//     !satelliteObjects
//   ) {
//     return
//   }
//   const elevationThreshold = 25
//   const linkColor = [0, 255, 255]
//   const linkWidth = 1.5

//   log(
//     `[drawGroundToSatelliteLinks] Frame update. Checking ${
//       uploadedGroundStations.length
//     } stations against ${Object.keys(satelliteObjects).length} satellites.`
//   )

//   uploadedGroundStations.forEach((station) => {
//     if (!station.positionECEF) return

//     Object.values(satelliteObjects).forEach((satellite) => {
//       // ===================================================================
//       // ==> THIS IS THE CRITICAL FIX <==
//       // We must propagate the satellite's position to the current simulation time.
//       createOsvForISLSatellite(satellite, today)
//       // ===================================================================

//       // Now, check if the propagation was successful before proceeding.
//       if (!satellite.osvProp || !satellite.osvProp.r) {
//         // This log will now appear if a satellite fails to update.
//         log(
//           `[drawGroundToSatelliteLinks] SKIPPING ${satellite.name}: No OSV data after propagation attempt.`
//         )
//         return
//       }

//       const satOsvECEF = Frames.osvJ2000ToECEF(satellite.osvProp, nutPar)
//       const stationPositionKm = station.positionECEF
//       const satellitePositionKm = MathUtils.vecmul(satOsvECEF.r, 0.001)

//       const elevation = calculateElevation(
//         stationPositionKm,
//         satellitePositionKm,
//         station.name,
//         satellite.name
//       )

//       if (!isNaN(elevation) && elevation > elevationThreshold) {
//         log(
//           `[drawGroundToSatelliteLinks] SUCCESS: Link condition met for "${
//             station.name
//           }" -> "${satellite.name}" (Elevation: ${elevation.toFixed(2)}°)`
//         )
//         const linePoints = [stationPositionKm, satellitePositionKm]
//         lineShaders.setGeometry(linePoints, linkColor)
//         lineShaders.setStyle(linkWidth, 'solid')
//         lineShaders.draw(matrix)
//       }
//     })
//   })
// }
