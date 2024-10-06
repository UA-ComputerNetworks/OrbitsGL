/**
 * TimeConversions - Utilities for handling time-based calculations.
 */
var TimeConversions = {}

/**
 * Compute Julian Time from a given date.
 *
 * This function converts a standard date into Julian Time (JT) and Julian Date (JD),
 * which are used for various astronomical calculations. Julian Date is a continuous
 * count of days since January 1, 4713 BC, while Julian Time is the fractional part of
 * the day.
 *
 * How it works:
 * - Takes a JavaScript Date object as input.
 * - Converts the date into Julian Date (JD) and Julian Time (JT).
 *
 * @param {Date} date - The current or target date for which to calculate Julian Time.
 * @returns {Object} - An object containing `JT` (Julian Time) and `JD` (Julian Date).
 *
 * Usage Example:
 * ```js
 * const julianTime = TimeConversions.computeJulianTime(new Date());
 * console.log(julianTime.JT);  // Julian Time
 * console.log(julianTime.JD);  // Julian Date
 * ```
 *
 * Important Details:
 * - Ensure that the input date is in the proper format. The returned values are necessary
 *   for sidereal time and other astronomical computations.
 */
TimeConversions.computeJulianTime = function (date) {
  // Convert JavaScript Date to Julian Date and Julian Time
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  const hour =
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600

  if (month <= 2) {
    year--
    month += 12
  }

  const A = Math.floor(year / 100)
  const B = 2 - A + Math.floor(A / 4)
  const JD =
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    B -
    1524.5
  const JT = JD + hour / 24

  return { JD: JD, JT: JT }
}

/**
 * Compute Sidereal Time for a given location.
 *
 * This function computes the Local Sidereal Time (LST), which represents the angle
 * between the local meridian and the vernal equinox. LST is crucial for determining
 * the positions of celestial objects relative to the Earth's rotation.
 *
 * How it works:
 * - Uses Julian Date (JD), Julian Time (JT), and nutation parameters to compute sidereal time.
 *
 * @param {number} lon - Longitude of the observer (in degrees).
 * @param {number} JD - Julian Date.
 * @param {number} JT - Julian Time.
 * @param {object} nutPar - Nutation parameters for corrections.
 * @returns {number} - Local Sidereal Time (LST) in degrees.
 *
 * Usage Example:
 * ```js
 * const siderealTime = TimeConversions.computeSiderealTime(0, julianTime.JD, julianTime.JT, nutPar);
 * console.log(siderealTime);  // Sidereal Time in degrees
 * ```
 *
 * Important Details:
 * - The input longitude and time must be accurate for precise calculations. Nutation
 *   parameters ensure the corrections for Earth's axial tilt are considered.
 */
TimeConversions.computeSiderealTime = function (lon, JD, JT, nutPar) {
  const T = (JD - 2451545.0) / 36525.0

  let gast =
    280.46061837 +
    360.98564736629 * (JD - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000.0

  if (nutPar) {
    gast += nutPar.dpsi * Math.cos(nutPar.eps)
  }

  let lst = (gast + lon) % 360
  if (lst < 0) {
    lst += 360
  }

  return lst
}

/**
 * Compute the number of days since a reference date (J2000).
 *
 * This function calculates the number of days that have passed since January 1, 2000 (J2000 epoch).
 * This is important for celestial calculations as many astronomical algorithms are based on
 * the number of days since this reference date.
 *
 * How it works:
 * - Subtracts the Julian Date of J2000 from the current Julian Date.
 *
 * @param {number} JD - Julian Date.
 * @returns {number} - Days since J2000.
 *
 * Usage Example:
 * ```js
 * const daysSinceJ2000 = TimeConversions.daysSinceJ2000(julianTime.JD);
 * console.log(daysSinceJ2000);
 * ```
 */
TimeConversions.daysSinceJ2000 = function (JD) {
  const JD_J2000 = 2451545.0
  return JD - JD_J2000
}

/**
 * Convert a Julian Date to a Gregorian Date.
 *
 * This function converts a Julian Date back to a standard Gregorian Date.
 *
 * How it works:
 * - Uses the inverse of the Julian Date calculation formula to convert back to a regular calendar date.
 *
 * @param {number} JD - Julian Date to convert.
 * @returns {Date} - The equivalent Gregorian date.
 *
 * Usage Example:
 * ```js
 * const gregorianDate = TimeConversions.julianToGregorian(2451545.0);
 * console.log(gregorianDate);
 * ```
 */
TimeConversions.julianToGregorian = function (JD) {
  let Z = Math.floor(JD + 0.5)
  let F = JD + 0.5 - Z

  let A = Z
  if (Z >= 2299161) {
    let alpha = Math.floor((Z - 1867216.25) / 36524.25)
    A += 1 + alpha - Math.floor(alpha / 4)
  }

  let B = A + 1524
  let C = Math.floor((B - 122.1) / 365.25)
  let D = Math.floor(365.25 * C)
  let E = Math.floor((B - D) / 30.6001)

  let day = B - D - Math.floor(30.6001 * E) + F
  let month = E < 14 ? E - 1 : E - 13
  let year = month > 2 ? C - 4716 : C - 4715

  return new Date(Date.UTC(year, month - 1, Math.floor(day), 0, 0, 0))
}
