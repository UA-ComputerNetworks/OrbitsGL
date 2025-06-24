function isSatelliteVisibleFromGroundStation(
  satECEF,
  gsECEF,
  minElevationDeg = 25
) {
  const unitGS = MathUtils.vecmul(gsECEF, 1 / MathUtils.norm(gsECEF))
  const toSat = MathUtils.vecsub(satECEF, gsECEF)
  const unitToSat = MathUtils.vecmul(toSat, 1 / MathUtils.norm(toSat))

  const dot = MathUtils.dot(unitGS, unitToSat)
  const elevationRad = Math.asin(dot)
  const elevationDeg = elevationRad * (180 / Math.PI)

  return elevationDeg > minElevationDeg
}
