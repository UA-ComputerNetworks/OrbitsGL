/**
 * Nutation - Utilities for computing nutation parameters.
 */
var Nutation = {}

/**
 * nutationTerms - Computes nutation parameters for a given Julian Century (T).
 *
 * This function calculates the nutation in longitude (`dψ`) and nutation in obliquity (`dε`).
 * These parameters adjust the Earth's orientation when transforming between celestial coordinate systems.
 *
 * How it works:
 * - The function uses trigonometric functions and known astronomical coefficients to compute
 *   nutation terms based on the Julian Century (T).
 *
 * Nutation affects the celestial coordinates of objects, accounting for small periodic oscillations
 * caused by gravitational forces from the Sun and the Moon on the Earth.
 *
 * @param {number} T - Julian Century (T) since the J2000 epoch.
 * @returns {object} - An object containing:
 *      - `dpsi`: Nutation in longitude (arcseconds).
 *      - `deps`: Nutation in obliquity (arcseconds).
 *
 * Usage Example:
 * ```js
 * const nutationParams = Nutation.nutationTerms(julianCentury);
 * console.log(`dpsi: ${nutationParams.dpsi}, deps: ${nutationParams.deps}`);
 * ```
 *
 * Important Details:
 * - Julian Century (T) must be computed from the Julian Date (JD).
 * - Nutation in longitude (`dpsi`) and nutation in obliquity (`deps`) are given in arcseconds.
 */
Nutation.nutationTerms = function (T) {
  // Calculate nutation in longitude (dpsi) and obliquity (deps) using standard astronomical formulas
  const dpsi =
    -17.2 * Math.sin(Coordinates.deg2Rad(125.04 - 1934.136 * T)) -
    1.32 * Math.sin(Coordinates.deg2Rad(200.9 * T))

  const deps =
    9.2 * Math.cos(Coordinates.deg2Rad(125.04 - 1934.136 * T)) +
    0.57 * Math.cos(Coordinates.deg2Rad(200.9 * T))

  return { dpsi: dpsi, deps: deps }
}

/**
 * computeObliquity - Computes the mean obliquity of the ecliptic for a given Julian Century (T).
 *
 * This function calculates the Earth's axial tilt, also known as the obliquity of the ecliptic.
 * This value changes over time due to gravitational interactions between Earth, the Moon, and the Sun.
 *
 * How it works:
 * - The mean obliquity is computed using a series of polynomial terms.
 *
 * The obliquity is essential for determining the apparent position of celestial objects and
 * is used when transforming between celestial coordinate systems.
 *
 * @param {number} T - Julian Century (T) since the J2000 epoch.
 * @returns {number} - The mean obliquity of the ecliptic in arcseconds.
 *
 * Usage Example:
 * ```js
 * const obliquity = Nutation.computeObliquity(julianCentury);
 * console.log(`Obliquity: ${obliquity} arcseconds`);
 * ```
 *
 * Important Details:
 * - The mean obliquity decreases slowly over time, so precision is critical.
 */
Nutation.computeObliquity = function (T) {
  // Compute the mean obliquity of the ecliptic using a standard polynomial formula
  const epsilon0 =
    84381.406 -
    46.836769 * T -
    0.0001831 * T * T +
    0.0020034 * T * T * T -
    0.000000576 * T * T * T * T -
    0.0000000434 * T * T * T * T * T

  return epsilon0
}

/**
 * applyNutation - Applies nutation corrections to the celestial coordinates.
 *
 * This function takes in the nutation parameters (`dψ`, `dε`) and applies these corrections
 * to the celestial coordinates of a given object.
 *
 * How it works:
 * - The function uses the nutation parameters to adjust the right ascension and declination
 *   of celestial objects, accounting for small periodic oscillations in Earth's axis.
 *
 * @param {number} RA - The object's Right Ascension (RA) in degrees.
 * @param {number} Dec - The object's Declination (Dec) in degrees.
 * @param {number} T - Julian Century (T) since the J2000 epoch.
 * @returns {object} - The corrected Right Ascension (RA) and Declination (Dec).
 *
 * Usage Example:
 * ```js
 * const correctedCoords = Nutation.applyNutation(ra, dec, julianCentury);
 * console.log(`Corrected RA: ${correctedCoords.RA}, Corrected Dec: ${correctedCoords.Dec}`);
 * ```
 *
 * Important Details:
 * - Nutation corrections are small, but they improve the accuracy of celestial coordinate calculations.
 */
Nutation.applyNutation = function (RA, Dec, T) {
  // Compute nutation terms
  const nutation = Nutation.nutationTerms(T)
  const epsilon = Nutation.computeObliquity(T)

  // Apply corrections to right ascension and declination
  const deltaRA =
    (nutation.dpsi * Math.cos(Coordinates.deg2Rad(epsilon + nutation.deps))) /
    3600.0
  const deltaDec = (nutation.dpsi * Math.sin(Coordinates.deg2Rad(RA))) / 3600.0

  // Return the corrected coordinates
  return { RA: RA + deltaRA, Dec: Dec + deltaDec }
}
