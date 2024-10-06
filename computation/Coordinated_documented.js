/**
 * Coordinates - A set of utilities for handling conversions and operations
 * related to coordinates in both Cartesian and spherical systems.
 *
 * This module includes functions for:
 * - Vector sums, differences, and rotations in Cartesian coordinates.
 * - Conversions between Cartesian and spherical coordinates.
 * - Conversions between radians and degrees.
 * - Transformations between equatorial and horizontal coordinate systems.
 * - Transformations between Cartesian and WGS 84 spherical coordinates.
 */

var Coordinates = {}

// -----------------------------------------------------------------------------------
// Cartesian Operations
// -----------------------------------------------------------------------------------

/**
 * sumCart - Computes the sum of two vectors in Cartesian coordinates.
 *
 * @param {object} p - The first vector with x, y, z components.
 * @param {object} dp - The second vector to add to the first.
 * @returns {object} - The resulting vector after addition.
 */
Coordinates.sumCart = (p, dp) => {
  return { x: p.x + dp.x, y: p.y + dp.y, z: p.z + dp.z }
}

/**
 * diffCart - Computes the difference between two vectors in Cartesian coordinates.
 *
 * @param {object} p - The first vector with x, y, z components.
 * @param {object} dp - The second vector to subtract from the first.
 * @returns {object} - The resulting vector after subtraction.
 */
Coordinates.diffCart = (p, dp) => {
  return { x: p.x - dp.x, y: p.y - dp.y, z: p.z - dp.z }
}

/**
 * rotateCartX - Rotates a Cartesian vector around the X-axis by a given angle.
 *
 * @param {object} p - The vector to rotate.
 * @param {number} angle - The angle of rotation in radians.
 * @returns {object} - The rotated vector.
 */
Coordinates.rotateCartX = (p, angle) => {
  return {
    x: p.x,
    y: Math.cos(angle) * p.y - Math.sin(angle) * p.z,
    z: Math.sin(angle) * p.y + Math.cos(angle) * p.z,
  }
}

/**
 * rotateCartY - Rotates a Cartesian vector around the Y-axis by a given angle.
 *
 * @param {object} p - The vector to rotate.
 * @param {number} angle - The angle of rotation in radians.
 * @returns {object} - The rotated vector.
 */
Coordinates.rotateCartY = (p, angle) => {
  return {
    x: Math.cos(angle) * p.x + Math.sin(angle) * p.z,
    y: p.y,
    z: -Math.sin(angle) * p.x + Math.cos(angle) * p.z,
  }
}

/**
 * rotateCartZ - Rotates a Cartesian vector around the Z-axis by a given angle.
 *
 * @param {object} p - The vector to rotate.
 * @param {number} angle - The angle of rotation in radians.
 * @returns {object} - The rotated vector.
 */
Coordinates.rotateCartZ = (p, angle) => {
  return {
    x: Math.cos(angle) * p.x - Math.sin(angle) * p.y,
    y: Math.sin(angle) * p.x + Math.cos(angle) * p.y,
    z: p.z,
  }
}

// -----------------------------------------------------------------------------------
// Coordinate Conversions
// -----------------------------------------------------------------------------------

/**
 * cartToSpherical - Converts Cartesian coordinates to spherical coordinates.
 *
 * @param {object} p - The Cartesian vector with x, y, z components.
 * @returns {object} - The spherical coordinates with theta (azimuth), phi (elevation), and r (radius).
 */
Coordinates.cartToSpherical = (p) => {
  return {
    theta: Math.atan2(p.y, p.x),
    phi: Math.atan(p.z / Math.sqrt(p.y * p.y + p.x * p.x)),
    r: Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z),
  }
}

// -----------------------------------------------------------------------------------
// Degree and Radian Conversion
// -----------------------------------------------------------------------------------

/**
 * rad2Deg - Converts radians to degrees.
 *
 * @param {number} rad - The value in radians.
 * @returns {number} - The value in degrees.
 */
Coordinates.rad2Deg = (rad) => {
  return (360.0 * rad) / (2 * Math.PI)
}

/**
 * deg2Rad - Converts degrees to radians.
 *
 * @param {number} deg - The value in degrees.
 * @returns {number} - The value in radians.
 */
Coordinates.deg2Rad = (deg) => {
  return (2 * Math.PI * deg) / 360.0
}

// -----------------------------------------------------------------------------------
// Coordinate System Transformations
// -----------------------------------------------------------------------------------

/**
 * equitorialToHorizontal - Converts equatorial coordinates to horizontal coordinates.
 *
 * How it works:
 * - Uses trigonometric transformations to convert from hour angle, declination, and latitude
 *   into elevation (altitude) and azimuth.
 *
 * @param {number} h - The hour angle.
 * @param {number} delta - The declination.
 * @param {number} phi - The latitude.
 * @returns {object} - The elevation (a) and azimuth (A) in radians.
 */
Coordinates.equitorialToHorizontal = (h, delta, phi) => {
  return {
    a: Math.asin(
      Math.cos(h) * Math.cos(delta) * Math.cos(phi) +
        Math.sin(delta) * Math.sin(phi)
    ),
    A:
      Math.PI +
      Math.atan2(
        Math.sin(h) * Math.cos(delta),
        Math.cos(h) * Math.cos(delta) * Math.sin(phi) -
          Math.sin(delta) * Math.cos(phi)
      ),
  }
}

/**
 * horizontalToEquitorial - Converts horizontal coordinates to equatorial coordinates.
 *
 * How it works:
 * - Inverse transformation from horizontal coordinates (altitude, azimuth) back to
 *   equatorial coordinates (declination, hour angle).
 *
 * @param {number} a - The altitude.
 * @param {number} A - The azimuth.
 * @param {number} phi - The latitude.
 * @returns {object} - The declination (delta) and hour angle (h).
 */
Coordinates.horizontalToEquitorial = (a, A, phi) => {
  delta = Math.asin(
    -Math.cos(A) * Math.cos(a) * Math.cos(phi) + Math.sin(a) * Math.sin(phi)
  )
  return {
    delta: delta,
    h: Math.atan2(
      (Math.sin(A) * Math.cos(a)) / Math.cos(delta),
      (Math.cos(A) * Math.cos(a) * Math.sin(phi) +
        Math.sin(a) * Math.cos(phi)) /
        Math.cos(delta)
    ),
  }
}

// -----------------------------------------------------------------------------------
// Time Conversion
// -----------------------------------------------------------------------------------

/**
 * deg2Time - Converts degrees to time (hours, minutes, seconds).
 *
 * @param {number} deg - The value in degrees.
 * @returns {object} - The time in hours (h), minutes (m), and seconds (s).
 */
Coordinates.deg2Time = (deg) => {
  if (deg < 0) deg += 360
  h = Math.floor((24.0 * deg) / 360.0)
  deg -= (h * 360.0) / 24.0
  m = Math.floor((24.0 * 60.0 * deg) / 360.0)
  deg -= (m * 360.0) / (24.0 * 60.0)
  s = Math.floor((24.0 * 60.0 * 60.0 * deg) / 360.0)
  return { h: h, m: m, s: s }
}

// -----------------------------------------------------------------------------------
// WGS 84 Coordinate Transformations
// -----------------------------------------------------------------------------------

/**
 * wgs84ToCart - Converts WGS 84 spherical coordinates to Cartesian (ECEF) coordinates.
 *
 * @param {number} lat - Latitude in degrees.
 * @param {number} lon - Longitude in degrees.
 * @param {number} h - Altitude in meters.
 * @returns {Array} - Cartesian coordinates [x, y, z].
 */
Coordinates.wgs84ToCart = (lat, lon, h) => {
  const a = 6378137.0 // Semi-major axis
  const b = 6356752.314245 // Semi-minor axis
  const e = Math.sqrt((a * a - b * b) / (a * a)) // Eccentricity

  const sinLat = Math.sin(Coordinates.deg2Rad(lat))
  const N = a / Math.sqrt(1 - e * e * sinLat * sinLat)

  const x =
    (N + h) *
    Math.cos(Coordinates.deg2Rad(lat)) *
    Math.cos(Coordinates.deg2Rad(lon))
  const y =
    (N + h) *
    Math.cos(Coordinates.deg2Rad(lat)) *
    Math.sin(Coordinates.deg2Rad(lon))
  const z = ((1 - e * e) * N + h) * Math.sin(Coordinates.deg2Rad(lat))

  return [x, y, z]
}

/**
 * cartToWgs84 - Converts Cartesian (ECEF) coordinates to WGS 84 spherical coordinates.
 *
 * This function converts a point in Earth-Centered, Earth-Fixed (ECEF) Cartesian coordinates to WGS 84
 * spherical coordinates (latitude, longitude, and altitude). It uses iterative methods to refine the latitude
 * and height estimates over several iterations for higher accuracy.
 *
 * How it works:
 * - The longitude is computed directly using the arctangent of the y and x Cartesian components.
 * - The latitude is computed using an initial approximation of the latitude from the z Cartesian component
 *   and iteratively refined through a Newton-Raphson method to converge on the correct latitude.
 * - The altitude is derived based on the computed latitude and the Earth’s curvature.
 *
 * @param {Array} r - The Cartesian coordinate vector [x, y, z] in the ECEF frame.
 * @returns {object} - An object containing the WGS 84 latitude (`lat` in degrees), longitude (`lon` in degrees), and altitude (`h` in meters).
 *
 * Usage Example:
 * ```js
 * let cartCoords = [4510732.0, 4510732.0, 4510732.0];
 * let wgs84Coords = Coordinates.cartToWgs84(cartCoords);
 * console.log(wgs84Coords);  // Output: {lat: ..., lon: ..., h: ...}
 * ```
 *
 * Important Details:
 * - Ensure the input coordinates are in ECEF format before calling this function.
 * - The function iterates to compute a more accurate value for latitude, which can impact the altitude calculation.
 * - This function works best with relatively precise Cartesian coordinates and may not be suitable for very large distances from Earth’s surface.
 */
Coordinates.cartToWgs84 = (r) => {
  // Compute longitude from Cartesian coordinates
  const lon = Coordinates.rad2Deg(Math.atan2(r[1], r[0]))

  // Compute initial estimates for latitude and altitude
  const p = Math.sqrt(r[0] * r[0] + r[1] * r[1])
  const a = 6378137.0 // Semi-major axis of the Earth
  const b = 6356752.314245 // Semi-minor axis of the Earth
  const e = Math.sqrt((a * a - b * b) / (a * a)) // Eccentricity

  let lat = Coordinates.rad2Deg(Math.atan(r[2] / ((1 - e * e) * p)))
  let h = 0 // Initialize altitude

  // Iterate to refine latitude and altitude estimates
  for (let iter = 0; iter < 5; iter++) {
    let sinPrev = Math.sin(Coordinates.deg2Rad(lat))
    let cosPrev = Math.cos(Coordinates.deg2Rad(lat))

    const N = a / Math.sqrt(1 - e * e * sinPrev * sinPrev)
    h = p / cosPrev - N

    const d = (1 - (e * e * N) / (N + h)) * p
    lat = Coordinates.rad2Deg(Math.atan(r[2] / d))
  }

  // Return the final computed latitude, longitude, and altitude
  return { lat: lat, lon: lon, h: h }
}
