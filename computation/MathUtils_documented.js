/**
 * MathUtils - A set of utility functions for mathematical operations.
 * Provides basic and advanced functions like trigonometric functions,
 * vector operations, matrix manipulations, etc.
 */
var MathUtils = {}

/**
 * Compute the sine of an angle given in degrees.
 *
 * @param {number} angle - The angle in degrees.
 * @returns {number} - The sine of the angle.
 *
 * Usage Example:
 * ```js
 * const sine = MathUtils.sind(45);
 * console.log(sine); // 0.7071
 * ```
 */
MathUtils.sind = function (angle) {
  return Math.sin(MathUtils.deg2Rad(angle))
}

/**
 * Compute the cosine of an angle given in degrees.
 *
 * @param {number} angle - The angle in degrees.
 * @returns {number} - The cosine of the angle.
 *
 * Usage Example:
 * ```js
 * const cosine = MathUtils.cosd(45);
 * console.log(cosine); // 0.7071
 * ```
 */
MathUtils.cosd = function (angle) {
  return Math.cos(MathUtils.deg2Rad(angle))
}

/**
 * Convert degrees to radians.
 *
 * @param {number} angle - The angle in degrees.
 * @returns {number} - The angle in radians.
 *
 * Usage Example:
 * ```js
 * const radians = MathUtils.deg2Rad(180);
 * console.log(radians); // 3.1415 (pi)
 * ```
 */
MathUtils.deg2Rad = function (angle) {
  return (angle * Math.PI) / 180.0
}

/**
 * Compute the tangent of an angle given in degrees.
 *
 * @param {number} angle - The angle in degrees.
 * @returns {number} - The tangent of the angle.
 *
 * Usage Example:
 * ```js
 * const tangent = MathUtils.tand(45);
 * console.log(tangent); // 1.0
 * ```
 */
MathUtils.tand = function (angle) {
  return Math.tan(MathUtils.deg2Rad(angle))
}

/**
 * Rotate a vector around the Z-axis by a given angle.
 *
 * @param {Array} vec - The vector [x, y, z] to rotate.
 * @param {number} angle - The angle of rotation in degrees.
 * @returns {Array} - The rotated vector.
 *
 * Usage Example:
 * ```js
 * const rotatedVec = MathUtils.rotZ([1, 0, 0], 90);
 * console.log(rotatedVec); // [0, 1, 0]
 * ```
 */
MathUtils.rotZ = function (vec, angle) {
  const rad = MathUtils.deg2Rad(angle)
  const cosAngle = Math.cos(rad)
  const sinAngle = Math.sin(rad)

  return [
    cosAngle * vec[0] - sinAngle * vec[1],
    sinAngle * vec[0] + cosAngle * vec[1],
    vec[2],
  ]
}

/**
 * Compute the dot product of two vectors.
 *
 * @param {Array} vec1 - The first vector [x, y, z].
 * @param {Array} vec2 - The second vector [x, y, z].
 * @returns {number} - The dot product of the two vectors.
 *
 * Usage Example:
 * ```js
 * const dotProduct = MathUtils.dot([1, 2, 3], [4, 5, 6]);
 * console.log(dotProduct); // 32
 * ```
 */
MathUtils.dot = function (vec1, vec2) {
  return vec1[0] * vec2[0] + vec1[1] * vec2[1] + vec1[2] * vec2[2]
}

/**
 * Cross product of two 3D vectors.
 *
 * @param {Array} vec1 - The first vector [x, y, z].
 * @param {Array} vec2 - The second vector [x, y, z].
 * @returns {Array} - The resulting vector from the cross product.
 *
 * Usage Example:
 * ```js
 * const crossProduct = MathUtils.cross([1, 0, 0], [0, 1, 0]);
 * console.log(crossProduct); // [0, 0, 1]
 * ```
 */
MathUtils.cross = function (vec1, vec2) {
  return [
    vec1[1] * vec2[2] - vec1[2] * vec2[1],
    vec1[2] * vec2[0] - vec1[0] * vec2[2],
    vec1[0] * vec2[1] - vec1[1] * vec2[0],
  ]
}

/**
 * Normalize a vector to have a length of 1.
 *
 * @param {Array} vec - The vector to normalize.
 * @returns {Array} - The normalized vector.
 *
 * Usage Example:
 * ```js
 * const normalizedVec = MathUtils.normalize([3, 4, 0]);
 * console.log(normalizedVec); // [0.6, 0.8, 0]
 * ```
 */
MathUtils.normalize = function (vec) {
  const length = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2])
  return [vec[0] / length, vec[1] / length, vec[2] / length]
}
