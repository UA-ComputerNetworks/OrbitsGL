/**
 * Frames - Static methods for handling Coordinate System Transformations.
 *
 * This object contains functions to transform orbital state vectors (OSV) and position vectors
 * between different coordinate systems such as J2000, CEP (Celestial Ephemeris Pole), and ECEF (Earth-Centered, Earth-Fixed).
 * These transformations are essential in satellite tracking and astronomy for determining accurate satellite positions and velocities.
 */

var Frames = {}

/**
 * osvJ2000ToECEF - Transforms an OSV (Orbital State Vector) from J2000 coordinates to ECEF.
 *
 * This function converts an orbital state vector (position and velocity) from the J2000 inertial frame to the ECEF (Earth-Centered, Earth-Fixed) frame.
 * It involves precession and nutation corrections, and applies Earth rotation using the Local Sidereal Time (LST).
 *
 * How it works:
 * - Computes the Julian time from the given OSV timestamp.
 * - Transforms the OSV from J2000 to CEP, and then from CEP to ECEF.
 * - Uses a rotation matrix based on the LST to account for Earth's rotation.
 *
 * @param {object} osv_J2000 - The orbital state vector in J2000 frame. Contains position (r) and velocity (v).
 * @param {object} nutPar - Nutation parameters required for correcting Earth's orientation.
 * @returns {object} - The OSV in ECEF frame, with position and velocity adjusted for Earth's rotation.
 *
 * Usage Example:
 * ```js
 * let osv_ECEF = Frames.osvJ2000ToECEF(osv_J2000, nutationParameters);
 * ```
 *
 * Important Details:
 * - Nutation parameters must be provided or computed for accurate transformations.
 * - This function accounts for precession, nutation, and Earth's rotation.
 */
Frames.osvJ2000ToECEF = function (osv_J2000, nutPar) {
  // Calculate the Julian time from the OSV timestamp
  const julian = TimeConversions.computeJulianTime(osv_J2000.ts)

  // Transform from J2000 to CEP
  const osv_CEP = Frames.osvJ2000ToCEP(osv_J2000, nutPar)
  const rCEP = osv_CEP.r
  const vCEP = osv_CEP.v

  const osv_ECEF = {}

  // Compute Local Sidereal Time (LST) for the Earth's rotation
  const LST = TimeConversions.computeSiderealTime(
    0,
    julian.JD,
    julian.JT,
    nutPar
  )

  // Apply rotation matrix to convert position to ECEF frame
  osv_ECEF.r = MathUtils.rotZ(rCEP, -LST)
  osv_ECEF.ts = osv_J2000.ts

  // Compute velocity transformation
  const dLSTdt = (1.00273790935 * 360.0) / 86400.0
  const v_rot = MathUtils.rotZ(vCEP, -LST)
  const omega = (Math.PI / 180.0) * dLSTdt

  const mat_11 = MathUtils.cosd(LST)
  const mat_12 = MathUtils.sind(LST)
  const mat_21 = -MathUtils.sind(LST)
  const mat_22 = MathUtils.cosd(LST)

  // Calculate the time-derivative of the GAST to convert velocities
  const k_1 = 360.985647366
  const dGASTdt = (1 / 86400.0) * k_1
  const dRdt_11 = -dGASTdt * (Math.PI / 180.0) * MathUtils.sind(LST)
  const dRdt_12 = dGASTdt * (Math.PI / 180.0) * MathUtils.cosd(LST)
  const dRdt_21 = -dGASTdt * (Math.PI / 180.0) * MathUtils.cosd(LST)
  const dRdt_22 = -dGASTdt * (Math.PI / 180.0) * MathUtils.sind(LST)

  const v_ECEF_x =
    mat_11 * osv_CEP.v[0] +
    mat_12 * osv_CEP.v[1] +
    dRdt_11 * osv_ECEF.r[0] +
    dRdt_12 * osv_ECEF.r[1]
  const v_ECEF_y =
    mat_21 * osv_CEP.v[0] +
    mat_22 * osv_CEP.v[1] +
    dRdt_21 * osv_ECEF.r[0] +
    dRdt_22 * osv_ECEF.r[1]
  const v_ECEF_z = v_rot[2]

  osv_ECEF.v = [v_ECEF_x, v_ECEF_y, v_ECEF_z]

  return osv_ECEF
}

/**
 * osvJ2000ToCEP - Transforms an OSV from J2000 to CEP coordinates.
 *
 * This function converts an orbital state vector from the J2000 inertial frame to the CEP (Celestial Ephemeris Pole) frame.
 * The transformation involves precession and nutation corrections based on IAU 1976 precession model.
 *
 * How it works:
 * - Applies the precession matrix to convert from J2000 to the Mean of Date (MoD) coordinates.
 * - Applies the nutation matrix to convert from MoD to CEP coordinates.
 *
 * @param {object} osv_J2000 - The OSV in J2000 frame.
 * @param {object} nutPar - Nutation parameters required for correcting Earth's orientation.
 * @returns {object} - The OSV in CEP frame.
 *
 * Usage Example:
 * ```js
 * let osv_CEP = Frames.osvJ2000ToCEP(osv_J2000, nutationParameters);
 * ```
 *
 * Important Details:
 * - Nutation parameters must be provided or computed for accurate transformations.
 * - Precession and nutation are based on IAU 1976 precession model.
 */
Frames.osvJ2000ToCEP = function (osv_J2000, nutPar) {
  const julian = TimeConversions.computeJulianTime(osv_J2000.ts)

  const T = (julian.JT - 2451545.0) / 36525.0

  // Apply precession and nutation matrices
  const z = 0.6406161388 * T + 3.04e-4 * T * T + 5.05e-6 * T * T * T
  const nu = 0.5567530277 * T - 1.185e-4 * T * T - 1.162e-5 * T * T * T
  const zeta = 0.6406161388 * T + 8.385e-5 * T * T + 4.999e-6 * T * T * T

  const rMoD = MathUtils.rotZ(
    MathUtils.rotY(MathUtils.rotZ(osv_J2000.r, zeta), -nu),
    z
  )
  const vMoD = MathUtils.rotZ(
    MathUtils.rotY(MathUtils.rotZ(osv_J2000.v, zeta), -nu),
    z
  )

  if (nutPar == null) {
    nutPar = Nutation.nutationTerms(T)
  }
  const rCEP = MathUtils.rotX(
    MathUtils.rotZ(MathUtils.rotX(rMoD, -nutPar.eps), nutPar.dpsi),
    nutPar.eps + nutPar.deps
  )
  const vCEP = MathUtils.rotX(
    MathUtils.rotZ(MathUtils.rotX(vMoD, -nutPar.eps), nutPar.dpsi),
    nutPar.eps + nutPar.deps
  )

  return { r: rCEP, v: vCEP, ts: osv_J2000.ts }
}

/**
 * posJ2000ToCEP - Converts a position vector from J2000 to CEP coordinates.
 *
 * This function transforms a position vector from the J2000 inertial frame to the CEP frame using precession and nutation corrections.
 *
 * How it works:
 * - Applies the precession matrix to convert from J2000 to MoD.
 * - Applies the nutation matrix to convert from MoD to CEP coordinates.
 *
 * @param {number} JT - Julian Time.
 * @param {Array} r - Position vector in J2000 coordinates.
 * @param {object} nutPar - Nutation parameters.
 * @returns {object} - Position vector in CEP coordinates.
 */
Frames.posJ2000ToCEP = function (JT, r, nutPar) {
  const T = (JT - 2451545.0) / 36525.0

  const z = 0.6406161388 * T + 3.04e-4 * T * T + 5.05e-6 * T * T * T
  const nu = 0.5567530277 * T - 1.185e-4 * T * T - 1.162e-5 * T * T * T
  const zeta = 0.6406161388 * T + 8.385e-5 * T * T + 4.999e-6 * T * T * T

  const rJ2000 = [r.x, r.y, r.z]

  const rMoD = MathUtils.rotZ(
    MathUtils.rotY(MathUtils.rotZ(rJ2000, zeta), -nu),
    z
  )

  if (nutPar == null) {
    nutPar = Nutation.nutationTerms(T)
  }
  const rCEP = MathUtils.rotX(
    MathUtils.rotZ(MathUtils.rotX(rMoD, -nutPar.eps), nutPar.dpsi),
    nutPar.eps + nutPar.deps
  )

  return { x: rCEP[0], y: rCEP[1], z: rCEP[2] }
}

/**
 * posCEPToJ2000 - Converts a position vector from CEP to J2000 coordinates.
 *
 * This function transforms a position vector from the CEP frame to the J2000 inertial frame using precession and nutation corrections.
 *
 * How it works:
 * - Applies the nutation matrix to convert from CEP to MoD.
 * - Applies the precession matrix to convert from MoD to J2000 coordinates.
 *
 * @param {number} JT - Julian Time.
 * @param {Array} rCEP - Position vector in CEP coordinates.
 * @param {object} nutPar - Nutation parameters.
 * @returns {Array} - Position vector in J2000 coordinates.
 */
Frames.posCEPToJ2000 = function (JT, rCEP, nutPar) {
  const T = (JT - 2451545.0) / 36525.0

  const z = 0.6406161388 * T + 3.04e-4 * T * T + 5.05e-6 * T * T * T
  const nu = 0.5567530277 * T - 1.185e-4 * T * T - 1.162e-5 * T * T * T
  const zeta = 0.6406161388 * T + 8.385e-5 * T * T + 4.999e-6 * T * T * T

  if (nutPar == null) {
    nutPar = Nutation.nutationTerms(T)
  }
  const rMOD = MathUtils.rotX(
    MathUtils.rotZ(
      MathUtils.rotX(rCEP, -(nutPar.eps + nutPar.deps)),
      -nutPar.dpsi
    ),
    nutPar.eps
  )

  const rJ2000 = MathUtils.rotZ(
    MathUtils.rotY(MathUtils.rotZ(rMOD, -z), nu),
    -zeta
  )

  return rJ2000
}
