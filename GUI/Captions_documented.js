/**
 * This file is responsible for updating the captions and telemetry data that are displayed
 * in the user interface. It collects data about the Sun, Moon, and satellites and formats
 * the information to be displayed as captions in HTML elements.
 *
 * Key functionalities include:
 * - Displaying Sun and Moon right ascension, declination, and location details.
 * - Providing real-time satellite telemetry information.
 * - Warning users about stale TLE (Two-Line Element) or OSV (Orbital State Vector) data.
 * - Supporting various display formats like UTC, Julian time, and local time.
 */

/**
 * Updates the captions in the user interface with satellite, Sun, and Moon data.
 * The function processes the given data and updates the text content of HTML elements
 * on the page.
 *
 * How it works:
 * - The function retrieves current data for the Sun, Moon, and the selected satellite.
 * - It calculates delay and warnings for stale TLE/OSV data.
 * - It conditionally adds various captions such as the Sun’s right ascension, declination,
 *   satellite telemetry, and other key data based on user preferences.
 * - Displays the data on the user interface in a human-readable format.
 *
 * @param {number} rA - Right ascension of the Sun (in radians).
 * @param {number} decl - Declination of the Sun (in radians).
 * @param {object} lonlat - Longitude and latitude of the Sun (in degrees).
 * @param {number} rAMoon - Right ascension of the Moon (in radians).
 * @param {number} declMoon - Declination of the Moon (in radians).
 * @param {object} lonlatMoon - Longitude and latitude of the Moon (in degrees).
 * @param {Date} today - The current date and time.
 * @param {number} JT - Julian Time.
 *
 * Usage Example:
 * ```js
 * updateCaptions(sunRA, sunDecl, sunLonLat, moonRA, moonDecl, moonLonLat, new Date(), julianTime);
 * ```
 *
 * Important Details:
 * - Ensure that the `ISS` object contains current telemetry and orbital data.
 * - User control settings (from `guiControls`) determine what information is displayed.
 */
function updateCaptions(
  rA,
  decl,
  lonlat,
  rAMoon,
  declMoon,
  lonlatMoon,
  today,
  JT
) {
  const targetText = document.getElementById('targetText')
  targetText.innerHTML = guiControls.targetName

  // Show or hide the target name based on user settings.
  if (guiControls.showTargetName) {
    targetText.style.visibility = 'visible'
  } else {
    targetText.style.visibility = 'hidden'
  }

  const dateText = document.getElementById('dateText')
  const warningText = document.getElementById('warningText')
  const warningContainer = document.getElementById('warningContainer')

  let caption = ''

  // Calculate the delay between the current time and the OSV timestamp.
  let delay = (today - ISS.osv.ts) / 1000

  // Warning for TLE (Two-Line Element) source data.
  if (guiControls.source === 'TLE') {
    const tleYear = parseInt('20' + guiControls.tleYear)
    let tleDate = new Date(tleYear, 0, 0)
    tleDate = new Date(
      tleDate.getTime() + guiControls.tleDay * 86400.0 * 1000.0
    )
    const utcDiffMinutes = tleDate.getTimezoneOffset()
    tleDate = new Date(tleDate.getTime() - utcDiffMinutes * 60.0 * 1000.0)
    let tleDelay = (today - tleDate) / 1000

    if (Math.abs(tleDelay) > 86400 * 2) {
      warningContainer.style.visibility = 'visible'
      warningText.style.visibility = 'visible'
      warningText.innerHTML =
        'WARNING: <br> TLE age: ' +
        (Math.abs(tleDelay) / 86400.0).toFixed(1) +
        ' days > 2 days'
    } else {
      warningContainer.style.visibility = 'hidden'
      warningText.style.visibility = 'hidden'
    }
    // Warning for OSV data age if it's more than 1000 seconds old.
  } else if (Math.abs(delay) > 1000) {
    warningContainer.style.visibility = 'visible'
    warningText.style.visibility = 'visible'
    warningText.innerHTML =
      'WARNING: <br> OSV age: ' + Math.floor(Math.abs(delay)) + 's > 1000s'
  } else {
    warningContainer.style.visibility = 'hidden'
    warningText.style.visibility = 'hidden'
  }

  // Add a caption if the TLE list is enabled but empty.
  if (guiControls.enableList) {
    if (satellites.length == 0) {
      caption = caption + 'Click <b>Insert TLE List</b> to add.<br>'
    } else {
      caption = caption + 'Tracking: ' + satellites.length + ' satellites<br>'
    }
  }

  // Display the local, UTC, and Julian time based on user settings.
  if (guiControls.showLocal) {
    caption = caption + 'Local: ' + today.toString() + '<br>'
  }
  if (guiControls.showUtc) {
    caption = caption + 'UTC: ' + today.toUTCString() + '<br>'
  }
  if (guiControls.showJulian) {
    caption = caption + 'Julian: ' + JT.toString() + '<br>'
  }

  // Display Sun data (right ascension, declination, longitude, and latitude).
  if (guiControls.showSunRa) {
    let raTime = Coordinates.deg2Time(Coordinates.rad2Deg(rA))
    caption =
      caption +
      'Sun RA: ' +
      raTime.h +
      'h ' +
      raTime.m +
      'm ' +
      raTime.s +
      's (' +
      Coordinates.rad2Deg(rA).toFixed(5) +
      '&deg;) <br>'
  }
  if (guiControls.showSunDecl) {
    caption =
      caption +
      'Sun Declination: ' +
      Coordinates.rad2Deg(decl).toFixed(5) +
      '&deg; <br>'
  }
  if (guiControls.showSunLongitude) {
    caption = caption + 'Sun Longitude: ' + lonlat.lon.toFixed(5) + '&deg; <br>'
  }
  if (guiControls.showSunLatitude) {
    caption = caption + 'Sun Latitude: ' + lonlat.lat.toFixed(5) + '&deg; <br>'
  }

  // Display Moon data (right ascension, declination, longitude, and latitude).
  if (guiControls.showMoonRa) {
    let raTime = Coordinates.deg2Time(Coordinates.rad2Deg(rAMoon))
    caption =
      caption +
      'Moon RA: ' +
      raTime.h +
      'h ' +
      raTime.m +
      'm ' +
      raTime.s +
      's (' +
      Coordinates.rad2Deg(rAMoon).toFixed(5) +
      '&deg;) <br>'
  }
  if (guiControls.showMoonDecl) {
    caption =
      caption +
      'Moon Declination: ' +
      Coordinates.rad2Deg(declMoon).toFixed(5) +
      '&deg; <br>'
  }
  if (guiControls.showMoonLongitude) {
    caption =
      caption + 'Moon Longitude: ' + lonlatMoon.lon.toFixed(5) + '&deg; <br>'
  }
  if (guiControls.showMoonLatitude) {
    caption =
      caption + 'Moon Latitude: ' + lonlatMoon.lat.toFixed(5) + '&deg; <br>'
  }

  // Display satellite telemetry if enabled.
  if (guiControls.enableOrbit) {
    if (guiControls.showTelemetry) {
      caption += `OSV Timestamp: ${ISS.osv.ts}<br>`
      caption += `OSV Position (m, J2000) [${ISS.osv.r[0].toFixed(
        5
      )} ${ISS.osv.r[1].toFixed(5)} ${ISS.osv.r[2].toFixed(5)}]<br>`
      caption += `OSV Velocity (m/s, J2000) [${ISS.osv.v[0].toFixed(
        5
      )} ${ISS.osv.v[1].toFixed(5)} ${ISS.osv.v[2].toFixed(5)}]<br>`
    }

    // Display propagated OSV telemetry in GM2000 frame if enabled.
    if (guiControls.showOsvGM2000) {
      caption += `Propagated: ${ISS.osvProp.ts}<br>`
      caption += `Position (m, J2000) [${ISS.osvProp.r[0].toFixed(
        5
      )} ${ISS.osvProp.r[1].toFixed(5)} ${ISS.osvProp.r[2].toFixed(5)}]<br>`
      caption += `Velocity (m/s, J2000) [${ISS.osvProp.v[0].toFixed(
        5
      )} ${ISS.osvProp.v[1].toFixed(5)} ${ISS.osvProp.v[2].toFixed(5)}]<br>`
    }

    // Display OSV in ECEF frame if enabled.
    if (guiControls.showOsvECEF) {
      caption += `Position (m, ECEF) [${ISS.r_ECEF[0].toFixed(
        5
      )} ${ISS.r_ECEF[1].toFixed(5)} ${ISS.r_ECEF[2].toFixed(5)}]<br>`
      caption += `Velocity (m/s, ECEF) [${ISS.v_ECEF[0].toFixed(
        5
      )} ${ISS.v_ECEF[1].toFixed(5)} ${ISS.v_ECEF[2].toFixed(5)}]<br>`
    }

    // Display satellite location (latitude, longitude, and altitude).
    if (guiControls.showIssLocation) {
      caption += `Lat, Lon (deg): ${ISS.lat.toFixed(2)} ${ISS.lon.toFixed(
        2
      )}<br>`
      caption += `Altitude (m): ${ISS.alt.toFixed(0)}<br>`
    }

    // Display orbital elements if enabled.
    if (ISS.kepler.a !== 0 && guiControls.showIssElements) {
      caption += `Semi-major axis (deg): ${ISS.kepler.a}<br>`
      caption += `Eccentricity: ${ISS.kepler.ecc_norm}<br>`
      caption += `Inclination (deg): ${ISS.kepler.incl}<br>`
      caption += `Longitude of Asc. Node (deg): ${ISS.kepler.Omega}<br>`
      caption += `Argument of Periapsis (deg): ${ISS.kepler.omega}<br>`
      caption += `Mean Anomaly (deg): ${ISS.kepler.M}<br>`
    }
  }

  // Update the HTML content with the new caption text.
  dateText.innerHTML = '<p>' + caption + '</p>'
}
