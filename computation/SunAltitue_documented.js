/**
 * Class for the computation of Sun altitude and related astronomical events.
 *
 * The SunAltitude class is responsible for calculating the Sun's altitude, right ascension, declination,
 * sunrise, and sunset times based on the observer's location (latitude and longitude) and the current date.
 */
class SunAltitude {
  /**
   * Initialize orbital parameters and orbits for Earth and the Sun.
   *
   * This constructor initializes the orbital parameters of the Earth and the Sun and sets up their orbits.
   * The Earth parameters include semi-major axis, eccentricity, inclination, and others needed for accurate
   * calculations of Sun-Earth interactions.
   *
   * How it works:
   * - Initializes Earth’s and Sun’s orbital parameters used in orbit propagation.
   * - Creates instances of `Orbit` for Earth and the Sun to compute their respective positions.
   */
  constructor() {
    // Initialize the orbital parameters for Earth and the Sun
    this.paramsEarth = {
      a: [1.00000011, -0.00000005],
      e: [0.01671022, -0.00003804],
      i: [0.00005, -46.94 / 3600.0],
      Omega: [-11.26064, -18228.25 / 3600.0],
      lP: [102.94719, 1198.28 / 3600.0],
      mL: [100.46436, 0.9856091],
    }
    this.paramsSun = {
      a: [0.0, 0.0],
      e: [0.0, 0.0],
      i: [0.0, 0.0],
      Omega: [0.0, 0.0],
      lP: [0.0, 0.0],
      mL: [0.0, 0.0],
    }

    // Create instances of the Orbit class for Sun and Earth
    this.orbitSun = new Orbit('Sun', this.paramsSun, 1e-12, 10)
    this.orbitEarth = new Orbit('Earth', this.paramsEarth, 1e-12, 10)
  }

  /**
   * Map an angle to the interval [0, 2*pi].
   *
   * @param {Number} rad
   *     The angle (in radians) to be limited.
   * @returns {Number} - The mapped angle in the interval [0, 2*pi].
   */
  limitAngle(rad) {
    const interval = 2 * Math.PI
    if (rad < 0) {
      rad += (1 + Math.floor(-rad / interval)) * interval
    } else {
      rad = rad % interval
    }
    return rad
  }

  /**
   * Compute the equatorial coordinates of the Sun.
   *
   * This function computes the Sun's right ascension and declination in the equatorial coordinate system,
   * which are necessary for determining its position in the sky.
   *
   * How it works:
   * - Calculates the position of the Earth and the Sun relative to each other using orbital mechanics.
   * - Converts these positions from the ecliptic coordinate system to equatorial coordinates.
   *
   * @param {Number} JT
   *     Julian time.
   * @param {Number} JD
   *     Julian date.
   * @returns {Object} - An object containing the Sun's right ascension (rA) and declination (decl).
   */
  computeEquitorial(JT, JD) {
    // Compute Earth and Sun positions in the ecliptic coordinate system
    const paramsEarth = this.orbitEarth.computeParameters(JT)
    const paramsSun = this.orbitSun.computeParameters(JT)
    const positionEarth = this.orbitEarth.computePosition(paramsEarth)
    const positionSun = this.orbitSun.computePosition(paramsSun)

    const rEarth = {
      x: positionEarth.x,
      y: positionEarth.y,
      z: positionEarth.z,
    }
    const rSun = { x: positionSun.x, y: positionSun.y, z: positionSun.z }
    const rRelative = Coordinates.diffCart(rSun, rEarth)

    // Perform rotation from Earth-centered Ecliptic to Equatorial coordinates
    const eclipticAngle = Coordinates.deg2Rad(23.43688)
    const rEquatorial_J2000 = Coordinates.rotateCartX(rRelative, eclipticAngle)
    const rEquatorial_CEP = Frames.posJ2000ToCEP(JT, rEquatorial_J2000)

    const equatorialSph = Coordinates.cartToSpherical(rEquatorial_CEP)

    return { rA: equatorialSph.theta, decl: equatorialSph.phi }
  }

  /**
   * Compute the altitude of the Sun for a given observer's location and time.
   *
   * This function calculates the Sun's altitude (angle above the horizon) based on the observer's
   * latitude, longitude, and the current Julian time.
   *
   * How it works:
   * - Computes the hour angle of the Sun.
   * - Transforms the hour angle into horizontal coordinates to compute the Sun's altitude.
   *
   * @param {Number} rA
   *     Right ascension of the Sun (in radians).
   * @param {Number} decl
   *     Declination of the Sun (in radians).
   * @param {Number} JD
   *     Julian day.
   * @param {Number} JT
   *     Julian time.
   * @param {Number} longitude
   *     Longitude of the observer (in degrees).
   * @param {Number} latitude
   *     Latitude of the observer (in degrees).
   * @returns {Number} - The altitude of the Sun (in degrees).
   */
  computeAltitude(rA, decl, JD, JT, longitude, latitude) {
    // Compute the hour angle of the Sun
    const ST0 = TimeConversions.computeSiderealTime(longitude, JD, JT)
    const h = Coordinates.deg2Rad(ST0) - rA

    // Convert hour angle to horizontal coordinates and return the altitude
    const rHoriz = Coordinates.equitorialToHorizontal(
      h,
      decl,
      Coordinates.deg2Rad(latitude)
    )
    const altitude = Coordinates.rad2Deg(rHoriz.a)

    return altitude
  }

  /**
   * Compute the longitude and latitude of the location where the Sun is at Zenith.
   *
   * This function determines the geographic coordinates (longitude and latitude) of the point on Earth
   * where the Sun is directly overhead (Zenith) at a given time.
   *
   * @param {Number} rA
   *     Right ascension of the Sun (in radians).
   * @param {Number} decl
   *     Declination of the Sun (in radians).
   * @param {Number} JD
   *     Julian day.
   * @param {Number} JT
   *     Julian time.
   * @param {Object} nutPar
   *     Nutation parameters.
   * @returns {Object} - An object containing the longitude and latitude of the Zenith point.
   */
  computeSunLonLat(rA, decl, JD, JT, nutPar) {
    const ST0 = TimeConversions.computeSiderealTime(0, JD, JT, nutPar)
    const lon =
      Coordinates.rad2Deg(
        this.limitAngle(Math.PI + rA - Coordinates.deg2Rad(ST0))
      ) - 180.0
    const lat = Coordinates.rad2Deg(decl)

    return { lon: lon, lat: lat }
  }

  /**
   * Compute sunrise and sunset times for a given location.
   *
   * This function calculates the times of sunrise and sunset for the observer's location based on the
   * Sun's altitude throughout the day.
   *
   * How it works:
   * - Iterates over the day to find when the Sun crosses the horizon (altitude 0).
   *
   * @param {Date} today
   *     Current date.
   * @param {Number} JD
   *     Current Julian date.
   * @param {Number} JT
   *     Current Julian time.
   * @param {Number} jtStep
   *     Time step for iterating over the day.
   * @param {Number} lon
   *     Longitude of the observer (in degrees).
   * @param {Number} lat
   *     Latitude of the observer (in degrees).
   * @returns {Object} - An object containing sunrise and sunset times.
   */
  computeSunriseSet(today, JD, JT, jtStep, lon, lat) {
    // Compute the Sun's equatorial coordinates and altitude
    const eqCoords = this.computeEquitorial(JT)
    const altitude = this.computeAltitude(
      eqCoords.rA,
      eqCoords.decl,
      JD,
      JT,
      lon,
      lat
    )

    // Initialize variables to store sunrise and sunset times
    let sunriseTime = null
    let sunsetTime = null
    const sunAngularRadius = 0.265

    // If the altitude is below the horizon
    if (altitude < 0) {
      // Iterate forward in time to find sunrise
      for (let deltaJt = 0; deltaJt < 1.0; deltaJt += jtStep) {
        const eqCoords = this.computeEquitorial(JT + deltaJt)
        let altFuture = this.computeAltitude(
          eqCoords.rA,
          eqCoords.decl,
          JD,
          JT + deltaJt,
          lon,
          lat
        )
        if (altFuture >= -sunAngularRadius) {
          let deltaMils = Math.floor(24 * 3600 * 1000 * deltaJt)
          sunriseTime = new Date(today.getTime() + deltaMils)
          break
        }
      }

      // Iterate backward in time to find sunset
      for (let deltaJt = 0; deltaJt < 1.0; deltaJt += jtStep) {
        const eqCoords = this.computeEquitorial(JT - deltaJt)
        let altPast = this.computeAltitude(
          eqCoords.rA,
          eqCoords.decl,
          JD,
          JT - deltaJt,
          lon,
          lat
        )
        if (altPast >= -sunAngularRadius) {
          let deltaMils = Math.floor(-24 * 3600 * 1000 * deltaJt)
          sunsetTime = new Date(today.getTime() + deltaMils)
          break
        }
      }
    } else {
      // Iterate forward in time to find sunset
      for (let deltaJt = 0; deltaJt < 1.0; deltaJt += jtStep) {
        const eqCoords = this.computeEquitorial(JT + deltaJt)
        let altFuture = this.computeAltitude(
          eqCoords.rA,
          eqCoords.decl,
          JD,
          JT + deltaJt,
          lon,
          lat
        )
        if (altFuture <= -sunAngularRadius) {
          let deltaMils = Math.floor(24 * 3600 * 1000 * deltaJt)
          sunsetTime = new Date(today.getTime() + deltaMils)
          break
        }
      }

      // Iterate backward in time to find sunrise
      for (let deltaJt = 0; deltaJt < 1.0; deltaJt += jtStep) {
        const eqCoords = this.computeEquitorial(JT - deltaJt)
        let altPast = this.computeAltitude(
          eqCoords.rA,
          eqCoords.decl,
          JD,
          JT - deltaJt,
          lon,
          lat
        )
        if (altPast <= -sunAngularRadius) {
          let deltaMils = Math.floor(-24 * 3600 * 1000 * deltaJt)
          sunriseTime = new Date(today.getTime() + deltaMils)
          break
        }
      }
    }

    return { rise: sunriseTime, set: sunsetTime }
  }
}
