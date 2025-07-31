/**
 * Checks if a satellite is visible from a ground station based on a minimum elevation angle.
 *
 * @param {Array} satECEF The ECEF position of the satellite.
 * @param {Array} gsECEF The ECEF position of the ground station.
 * @param {number} minElevation The minimum elevation angle in degrees.
 * @returns {boolean} True if the satellite is visible, false otherwise.
 */
function isSatelliteVisibleFromGroundStation(satECEF, gsECEF, minElevation) {
  const toSatellite = MathUtils.vecsub(satECEF, gsECEF)
  const up = gsECEF

  const dotProduct = MathUtils.dot(toSatellite, up)
  const cosAngle =
    dotProduct / (MathUtils.norm(toSatellite) * MathUtils.norm(up))
  const angle = Math.acos(cosAngle)
  const elevation = 90 - MathUtils.rad2Deg(angle)

  return elevation >= minElevation
}
