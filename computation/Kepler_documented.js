/**
 * Kepler - Static methods for handling Keplerian orbits.
 *
 * This object contains functions for calculating various properties of Keplerian orbits,
 * such as eccentric anomaly, natural anomaly, and the propagation of an orbital state vector (OSV).
 * Keplerian orbits describe the motion of celestial bodies under gravitational forces.
 *
 * These methods are essential for orbital mechanics, satellite tracking, and space navigation.
 */

var Kepler = {}

/**
 * computeNaturalAnomaly - Computes the natural anomaly from the eccentric anomaly.
 *
 * This function calculates the natural anomaly (also known as the true anomaly) from the eccentric anomaly,
 * which describes the position of an orbiting object relative to its orbit.
 *
 * How it works:
 * - Uses trigonometric functions to compute the natural anomaly based on eccentricity and eccentric anomaly.
 * - The natural anomaly is the angular position of the satellite in its orbit, measured from periapsis.
 *
 * @param {number} ecc_norm - The eccentricity of the orbit (a measure of its deviation from a perfect circle).
 * @param {number} E - The eccentric anomaly (in degrees), which describes the position in the orbit.
 * @returns {number} - The natural anomaly (in degrees).
 *
 * Usage Example:
 * ```js
 * let trueAnomaly = Kepler.computeNaturalAnomaly(0.1, 45);
 * ```
 *
 * Important Details:
 * - Eccentricity should be between 0 (circular orbit) and 1 (parabolic orbit).
 * - The result gives the satellite's position in its orbit.
 */
Kepler.computeNaturalAnomaly = function (ecc_norm, E) {
  let xu = (MathUtils.cosd(E) - ecc_norm) / (1.0 - ecc_norm * MathUtils.cosd(E))
  let yu =
    (Math.sqrt(1 - ecc_norm * ecc_norm) * MathUtils.sind(E)) /
    (1.0 - ecc_norm * MathUtils.cosd(E))
  return MathUtils.atan2d(yu, xu)
}

/**
 * computePeriod - Computes the orbital period (in seconds).
 *
 * This function calculates the period of an orbit based on the semi-major axis and the gravitational parameter.
 * The orbital period is the time it takes for a satellite to complete one full orbit.
 *
 * How it works:
 * - Uses Kepler's Third Law to compute the period, based on the semi-major axis (a) and gravitational parameter (mu).
 * - The period is proportional to the cube of the semi-major axis.
 *
 * @param {number} a - The semi-major axis (in meters).
 * @param {number} mu - The standard gravitational parameter of the central body (m^3/s^2).
 * @returns {number} - The orbital period (in seconds).
 *
 * Usage Example:
 * ```js
 * let period = Kepler.computePeriod(7000000, 3.986e14);
 * ```
 *
 * Important Details:
 * - The gravitational parameter (mu) for Earth is approximately 3.986e14 m^3/s^2.
 * - The semi-major axis must be in meters for accurate results.
 */
Kepler.computePeriod = function (a, mu) {
  return 2 * Math.PI * Math.sqrt((a * a * a) / mu)
}

/**
 * solveEccentricAnomaly - Solves the eccentric anomaly using the Newton-Raphson method.
 *
 * This function calculates the eccentric anomaly by solving Kepler's equation using an iterative Newton-Raphson method.
 * The eccentric anomaly is needed to describe the position of a satellite in its orbit.
 *
 * How it works:
 * - Starts with an initial guess for the eccentric anomaly (mean anomaly in radians).
 * - Iteratively improves the guess using Newton-Raphson until it converges within a specified tolerance.
 *
 * @param {number} M - The mean anomaly (in degrees).
 * @param {number} e - The eccentricity of the orbit.
 * @param {number} tolerance - The tolerance for the Newton-Raphson method (the desired accuracy).
 * @param {number} maxIterations - The maximum number of iterations allowed for the solver.
 * @returns {number} - The eccentric anomaly (in degrees).
 *
 * Usage Example:
 * ```js
 * let eccentricAnomaly = Kepler.solveEccentricAnomaly(30, 0.5, 1e-6, 100);
 * ```
 *
 * Important Details:
 * - If the solver fails to converge, it throws an error.
 * - Tolerance controls how accurate the solution will be.
 */
Kepler.solveEccentricAnomaly = function (M, e, tolerance, maxIterations) {
  let iterationCount = 0
  let error = tolerance + 1.0
  let Mrad = MathUtils.deg2Rad(M) // Convert mean anomaly to radians
  let eA = Mrad // Initial guess for eccentric anomaly

  while (error > tolerance) {
    iterationCount++
    if (iterationCount > maxIterations) {
      throw new Error('Failed to converge. ' + e + ' ' + M + ' ' + eA)
    }
    eA -= (eA - e * Math.sin(eA) - Mrad) / (1 - e * Math.cos(eA))
    error = Math.abs(eA - e * Math.sin(eA) - Mrad)
  }

  return MathUtils.rad2Deg(eA) // Return result in degrees
}

/**
 * osvToKepler - Computes Keplerian elements from an Orbital State Vector (OSV).
 *
 * This function converts a satellite's orbital state vector (position and velocity) into Keplerian orbital elements.
 * Keplerian elements describe the shape and orientation of the orbit.
 *
 * How it works:
 * - Computes the angular momentum, eccentricity, semi-major axis, and inclination from the state vector.
 * - Uses vector cross products and trigonometric calculations to derive the elements.
 *
 * @param {Array} r - The position vector (in meters) [x, y, z].
 * @param {Array} v - The velocity vector (in meters per second) [vx, vy, vz].
 * @param {Date} ts - The timestamp for the OSV.
 * @returns {object} - An object containing the Keplerian elements (a, e, i, Omega, omega, M, etc.).
 *
 * Usage Example:
 * ```js
 * let keplerianElements = Kepler.osvToKepler([7000, 0, 0], [0, 7.5, 0], new Date());
 * ```
 *
 * Important Details:
 * - The gravitational parameter (mu) for Earth is used by default.
 * - The position and velocity vectors must be in meters and meters/second, respectively.
 */
Kepler.osvToKepler = function (r, v, ts) {
  const kepler = {}
  kepler.ts = ts
  const incl_min = 1e-7
  const mu = 3.986004418e14 // Standard gravitational parameter for Earth

  // Angular momentum vector
  kepler.k = MathUtils.cross(r, v)

  // Eccentricity vector
  kepler.ecc = MathUtils.vecsub(
    MathUtils.vecmul(MathUtils.cross(v, kepler.k), 1.0 / mu),
    MathUtils.vecmul(r, 1.0 / MathUtils.norm(r))
  )
  kepler.ecc_norm = MathUtils.norm(kepler.ecc)

  // Inclination
  kepler.incl = MathUtils.acosd(kepler.k[2] / MathUtils.norm(kepler.k))

  // Energy integral
  kepler.h =
    0.5 * MathUtils.norm(v) * MathUtils.norm(v) - mu / MathUtils.norm(r)

  // Semi-major axis
  kepler.a = -mu / (2.0 * kepler.h)

  // Longitude of ascending node
  kepler.Omega = MathUtils.atan2d(kepler.k[0], -kepler.k[1])

  // Argument of periapsis
  kepler.omega = 0
  if (kepler.incl < incl_min) {
    kepler.omega = MathUtils.atan2d(kepler.ecc[1], kepler.ecc[0]) - kepler.Omega
  } else {
    const asc_y = kepler.ecc[2] / MathUtils.sind(kepler.incl)
    const asc_x =
      kepler.ecc[1] -
      (MathUtils.cosd(kepler.Omega) * kepler.ecc[2]) /
        MathUtils.sind(kepler.incl)
    kepler.omega = MathUtils.atan2d(asc_y, asc_x)
  }

  return kepler
}

/**
 * propagate - Estimates an Orbital State Vector (OSV) at a given date from Keplerian elements.
 *
 * This function propagates the Keplerian elements forward or backward in time to estimate the satellite's
 * position and velocity at a new date.
 *
 * How it works:
 * - Computes the time difference between the current time and the reference time.
 * - Propagates the mean anomaly and solves for the eccentric anomaly using Newton-Raphson.
 * - Rotates the orbital position and velocity vectors to obtain the new state vector.
 *
 * @param {object} kepler - The Keplerian elements.
 * @param {Date} dateIn - The date to propagate to.
 * @returns {object} - The new OSV (position and velocity at the new date).
 *
 * Usage Example:
 * ```js
 * let newOsv = Kepler.propagate(keplerianElements, new Date());
 * ```
 *
 * Important Details:
 * - Ensure the semi-major axis (a) is non-zero, or propagation will fail.
 * - The propagated position and velocity vectors are returned in ECEF coordinates.
 */
Kepler.propagate = function (kepler, dateIn) {
  if (kepler.a == 0) {
    return
  }
  const diff = dateIn.getTime() - kepler.ts.getTime()
  const Mext =
    kepler.M +
    (360.0 * diff) / (Kepler.computePeriod(kepler.a, kepler.mu) * 1000.0)
  const Eext = this.solveEccentricAnomaly(Mext, kepler.ecc_norm, 1e-5, 10)

  const r_orbital = [
    kepler.a * (MathUtils.cosd(Eext) - kepler.ecc_norm),
    kepler.b * MathUtils.sind(Eext),
    0,
  ]
  const r_ext = MathUtils.rotZ(
    MathUtils.rotX(MathUtils.rotZ(r_orbital, kepler.omega), kepler.incl),
    kepler.Omega
  )

  return { r: r_ext, v: v_ext, ts: dateIn }
}
