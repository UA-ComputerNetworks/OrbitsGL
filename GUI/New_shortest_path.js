// ===================================
// New_shortest_path.js - Dynamic Pathfinding Logic (DEBUG VERSION)
//
// This file implements the core logic for dynamic shortest path routing
// using Dijkstra's algorithm with a Min-Priority Queue.
// ===================================

// Global state for shortest path data
let shortestPathData = {
  path: [], // Array of node IDs (Satellite Names or GS Names)
  totalLatency: Infinity, // Total latency in milliseconds
  sourceId: null, // Source node ID
  destId: null, // Destination node ID
  isCalculating: false, // Flag for calculation status
}

// Earth Radius in kilometers (WGS84 estimate for geometric checks)
const EARTH_RADIUS_KM = 6378.137
const SPEED_OF_LIGHT_KM_S = 299792.458

console.log(
  '[DEBUG: Constants] Earth Radius:',
  EARTH_RADIUS_KM,
  'km | Speed of Light:',
  SPEED_OF_LIGHT_KM_S,
  'km/s'
)

// ===================================
// 1. Min-Priority Queue Implementation (Essential for Dijkstra's)
// ===================================

class PriorityQueue {
  constructor() {
    this.values = []
    console.log('[DEBUG: PQ] Priority Queue initialized.')
  }

  enqueue(id, priority) {
    if (isNaN(priority)) {
      console.error(
        `[DEBUG: PQ ERROR] Attempted to enqueue node ${id} with NaN priority!`
      )
      return
    }
    this.values.push({ id, priority })
    this.bubbleUp()
    // console.log(`[DEBUG: PQ] Enqueued ${id} with priority ${priority.toFixed(4)}.`);
  }

  bubbleUp() {
    let idx = this.values.length - 1
    const element = this.values[idx]
    while (idx > 0) {
      let parentIdx = Math.floor((idx - 1) / 2)
      let parent = this.values[parentIdx]
      if (element.priority >= parent.priority) break
      this.values[parentIdx] = element
      this.values[idx] = parent
      idx = parentIdx
    }
  }

  dequeue() {
    if (this.values.length === 0) {
      console.warn('[DEBUG: PQ] Attempted to dequeue from an empty queue.')
      return null
    }
    const min = this.values[0]
    const end = this.values.pop()
    if (this.values.length > 0) {
      this.values[0] = end
      this.sinkDown()
    }
    // console.log(`[DEBUG: PQ] Dequeued ${min.id} with priority ${min.priority.toFixed(4)}.`);
    return min
  }

  sinkDown() {
    let idx = 0
    const length = this.values.length
    const element = this.values[0]

    while (true) {
      let leftChildIdx = 2 * idx + 1
      let rightChildIdx = 2 * idx + 2
      let leftChild, rightChild
      let swap = null

      if (leftChildIdx < length) {
        leftChild = this.values[leftChildIdx]
        if (leftChild.priority < element.priority) {
          swap = leftChildIdx
        }
      }
      if (rightChildIdx < length) {
        rightChild = this.values[rightChildIdx]
        if (
          (swap === null && rightChild.priority < element.priority) ||
          (swap !== null && rightChild.priority < leftChild.priority)
        ) {
          swap = rightChildIdx
        }
      }
      if (swap === null) break
      this.values[idx] = this.values[swap]
      this.values[swap] = element
      idx = swap
    }
  }

  isEmpty() {
    return this.values.length === 0
  }
}

// ===================================
// 2. Geometric Utility Functions (Enhanced ECEF/NaN Checking)
// ===================================

/**
 * Calculates the Euclidean distance between two ECEF positions in km.
 * @param {number[]} posA_ECEF - [x, y, z] in km.
 * @param {number[]} posB_ECEF - [x, y, z] in km.
 * @returns {number} Distance in km.
 */
function calculateDistance(posA_ECEF, posB_ECEF) {
  if (
    !Array.isArray(posA_ECEF) ||
    posA_ECEF.length !== 3 ||
    posA_ECEF.some(isNaN)
  ) {
    console.error('[DEBUG: DISTANCE ERROR] Invalid posA_ECEF:', posA_ECEF)
    return Infinity
  }
  if (
    !Array.isArray(posB_ECEF) ||
    posB_ECEF.length !== 3 ||
    posB_ECEF.some(isNaN)
  ) {
    console.error('[DEBUG: DISTANCE ERROR] Invalid posB_ECEF:', posB_ECEF)
    return Infinity
  }

  // Assuming MathUtils.vecsub and MathUtils.norm are available globally
  if (
    typeof MathUtils !== 'undefined' &&
    typeof MathUtils.vecsub !== 'undefined' &&
    typeof MathUtils.norm !== 'undefined'
  ) {
    const distance = MathUtils.norm(MathUtils.vecsub(posA_ECEF, posB_ECEF))
    // console.log(`[DEBUG: DISTANCE] Calculated distance using MathUtils: ${distance.toFixed(2)} km`)
    return distance
  }

  const dx = posA_ECEF[0] - posB_ECEF[0]
  const dy = posA_ECEF[1] - posB_ECEF[1]
  const dz = posA_ECEF[2] - posB_ECEF[2]
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

  // console.log(`[DEBUG: DISTANCE] Calculated distance (fallback): ${distance.toFixed(2)} km`)
  return distance
}

/**
 * Simplified Earth Occlusion Test for ISLs.
 * @param {number[]} posA_ECEF - [x, y, z] in km.
 * @param {number[]} posB_ECEF - [x, y, z] in km.
 * @returns {boolean} True if occluded (intersects Earth), false otherwise.
 */
function checkEarthOcclusion(posA_ECEF, posB_ECEF) {
  // CRITICAL CHECK: Ensure MathUtils is available for vector/dot products
  if (
    typeof MathUtils === 'undefined' ||
    typeof MathUtils.vecsub === 'undefined' ||
    typeof MathUtils.dot === 'undefined'
  ) {
    console.error(
      '[DEBUG: OCCLUSION ERROR] MathUtils library is missing! Cannot perform occlusion check.'
    )
    // Default to 'not occluded' if the check cannot be performed, allowing graph creation
    return false
  }

  // Input validation for ECEF positions
  if (posA_ECEF.some(isNaN) || posB_ECEF.some(isNaN)) {
    console.warn(
      '[DEBUG: OCCLUSION WARNING] One or both ECEF positions contain NaN. Assuming occluded.'
    )
    return true
  }

  // Vector from A to B
  const d = MathUtils.vecsub(posB_ECEF, posA_ECEF)
  // Squared magnitude of d
  const d_dot_d = MathUtils.dot(d, d)
  // Vector from Earth center (0,0,0) to A
  const a = posA_ECEF
  // d dot a
  const d_dot_a = MathUtils.dot(d, a)
  // a dot a - R^2
  const R_sq = EARTH_RADIUS_KM * EARTH_RADIUS_KM
  const a_dot_a_minus_R2 = MathUtils.dot(a, a) - R_sq

  // Solve the quadratic equation for t: (d.d)t^2 + 2(d.a)t + (a.a - R^2) = 0
  const discriminant = d_dot_a * d_dot_a - d_dot_d * a_dot_a_minus_R2

  if (discriminant < 0) {
    // console.log('[DEBUG: OCCLUSION] Discriminant < 0. No real intersection. Clear.')
    return false
  }

  const sqrt_discriminant = Math.sqrt(discriminant)

  // CRITICAL CHECK: If d_dot_d is close to zero (A and B are same location)
  if (Math.abs(d_dot_d) < 1e-6) {
    console.warn(
      '[DEBUG: OCCLUSION WARNING] Distance between A and B is zero. Assuming clear (or same node).'
    )
    return false
  }

  // t1 and t2 are intersection parameters along the line (not segment)
  const t1 = (-d_dot_a - sqrt_discriminant) / d_dot_d
  const t2 = (-d_dot_a + sqrt_discriminant) / d_dot_d

  // Check if either intersection point falls within the segment (0 < t < 1)
  const isOccluded = (t1 > 0 && t1 < 1) || (t2 > 0 && t2 < 1)

  if (isOccluded) {
    // console.log(`[DEBUG: OCCLUSION] Blocked! t1: ${t1.toFixed(3)}, t2: ${t2.toFixed(3)}.`)
    return true
  }

  // console.log(`[DEBUG: OCCLUSION] Clear. t1: ${t1.toFixed(3)}, t2: ${t2.toFixed(3)}.`)
  return false
}

// ===================================
// 3. Graph Construction (Detailed Debugging)
// ===================================

/**
 * Builds the dynamic adjacency list (graph) based on current satellite/GS positions and constraints.
 */
function buildDynamicAdjacencyList(currentTime) {
  console.log(
    `[DEBUG: Graph] Starting graph construction at time: ${currentTime.toISOString()}`
  )

  if (
    typeof satelliteObjects === 'undefined' ||
    typeof uploadedGroundStations === 'undefined'
  ) {
    console.error(
      '[DEBUG: Graph ERROR] Satellite or Ground Station data not available for graph building.'
    )
    return new Map()
  }

  const AdjList = new Map()
  const satellites = Object.values(satelliteObjects)

  console.log(
    `[DEBUG: Graph] Found ${satellites.length} satellites and ${uploadedGroundStations.length} ground stations.`
  )

  // --- 1. Collect and Prepare Nodes (Satellites & GS) ---
  satellites.forEach((sat) => {
    AdjList.set(sat.name, [])
    // CRITICAL CHECK: Log if ECEF is missing/invalid
    if (!sat.r_ECEF || sat.r_ECEF.some(isNaN)) {
      console.warn(
        `[DEBUG: Node Check] Satellite ${sat.name} has invalid or missing r_ECEF position.`
      )
    }
  })
  uploadedGroundStations.forEach((gs) => {
    AdjList.set(gs.name, [])
  })

  // --- 2. Calculate ISLs (Inter-Satellite Links) ---
  let islCount = 0
  for (let i = 0; i < satellites.length; i++) {
    const satA = satellites[i]
    const posA_ECEF = satA.r_ECEF

    // Skip satellites without valid positions
    if (!posA_ECEF || posA_ECEF.some(isNaN)) {
      continue
    }

    for (let j = i + 1; j < satellites.length; j++) {
      const satB = satellites[j]
      const posB_ECEF = satB.r_ECEF

      if (!posB_ECEF || posB_ECEF.some(isNaN)) {
        // console.warn(`[DEBUG: ISL Check] Skipping Sat B: ${satB.name} due to invalid ECEF position.`)
        continue
      }

      // console.log(`[DEBUG: ISL Check] Checking ${satA.name} <-> ${satB.name}`)

      if (!checkEarthOcclusion(posA_ECEF, posB_ECEF)) {
        // Link is clear (Line-of-Sight is established)
        const distance_km = calculateDistance(posA_ECEF, posB_ECEF)
        if (distance_km === Infinity || distance_km <= 0) {
          console.warn(
            `[DEBUG: ISL WARNING] Calculated distance is invalid (${distance_km.toFixed(
              2
            )} km). Skipping link.`
          )
          continue
        }
        const latency_ms = (distance_km / SPEED_OF_LIGHT_KM_S) * 1000

        console.log(
          `[DEBUG: ISL Success] ${satA.name} <-> ${
            satB.name
          } | Dist: ${distance_km.toFixed(
            2
          )} km | Latency: ${latency_ms.toFixed(2)} ms`
        )

        // Add bidirectional link
        AdjList.get(satA.name).push({ target: satB.name, weight: latency_ms })
        AdjList.get(satB.name).push({ target: satA.name, weight: latency_ms })
        islCount++
      } else {
        // console.log(
        //   `[DEBUG: ISL Failure] ${satA.name} <-> ${satB.name} | Blocked by Earth Occlusion.`
        // )
      }
    }
  }
  console.log(
    `[DEBUG: Graph] Total ISL links added: ${islCount * 2} (bidirectional).`
  )

  // --- 3. Calculate SGLs (Satellite-Ground Links) ---
  const DEFAULT_MIN_ELEVATION_DEG = 10.0
  let sglCount = 0

  if (typeof calculateElevation === 'undefined') {
    console.error(
      '[DEBUG: Graph ERROR] calculateElevation function is missing! SGL links will be skipped.'
    )
  } else {
    for (const gs of uploadedGroundStations) {
      const posGS_ECEF = gs.positionECEF // Already computed in GroundStations.js

      if (!posGS_ECEF || posGS_ECEF.some(isNaN)) {
        console.warn(
          `[DEBUG: SGL Check] Skipping GS ${gs.name} due to invalid ECEF position.`
        )
        continue
      }

      const minElevation = gs.minElevation || DEFAULT_MIN_ELEVATION_DEG

      // console.log(`[DEBUG: SGL Check] Checking links for GS: ${gs.name} (Min Elev: ${minElevation} deg)`)

      for (const sat of satellites) {
        const posSat_ECEF = sat.r_ECEF

        if (!posSat_ECEF || posSat_ECEF.some(isNaN)) {
          // console.warn(`[DEBUG: SGL Check] Skipping Sat ${sat.name} due to invalid ECEF position.`)
          continue
        }

        const elevation_angle = calculateElevation(
          posGS_ECEF,
          posSat_ECEF,
          gs.name,
          sat.name
        )

        if (elevation_angle >= minElevation) {
          // Link is established (above minimum elevation angle)
          const distance_km = calculateDistance(posGS_ECEF, posSat_ECEF)
          if (distance_km === Infinity || distance_km <= 0) {
            console.warn(
              `[DEBUG: SGL WARNING] Calculated distance is invalid (${distance_km.toFixed(
                2
              )} km). Skipping link.`
            )
            continue
          }
          const latency_ms = (distance_km / SPEED_OF_LIGHT_KM_S) * 1000

          console.log(
            `[DEBUG: SGL Success] ${gs.name} <-> ${
              sat.name
            } | Elev: ${elevation_angle.toFixed(
              2
            )} deg | Latency: ${latency_ms.toFixed(2)} ms`
          )

          // Add bidirectional link
          AdjList.get(gs.name).push({ target: sat.name, weight: latency_ms })
          AdjList.get(sat.name).push({ target: gs.name, weight: latency_ms })
          sglCount++
        } else {
          // console.log(`[DEBUG: SGL Failure] ${gs.name} <-> ${sat.name} | Elev: ${elevation_angle.toFixed(2)} deg (Too low)`)
        }
      }
    }
  }

  console.log(
    `[DEBUG: Graph] Total SGL links added: ${sglCount * 2} (bidirectional).`
  )
  console.log(`[DEBUG: Graph] Final AdjList size: ${AdjList.size}.`)

  return AdjList
}

// ===================================
// 4. Dijkstra's Shortest Path Algorithm
// ===================================

/**
 * Finds the shortest path (minimum latency) from a source to a destination.
 */
function dijkstra(AdjList, sourceId, destinationId) {
  console.log(
    `[DEBUG: Dijkstra] Starting path search: ${sourceId} -> ${destinationId}`
  )
  const distances = new Map()
  const parents = new Map()
  const pq = new PriorityQueue()

  if (!AdjList.has(sourceId)) {
    console.error(
      `[DEBUG: Dijkstra ERROR] Source node (${sourceId}) not found in graph.`
    )
    return { path: [], totalLatency: Infinity }
  }
  if (!AdjList.has(destinationId)) {
    console.error(
      `[DEBUG: Dijkstra ERROR] Destination node (${destinationId}) not found in graph.`
    )
    return { path: [], totalLatency: Infinity }
  }

  // Initialization: set all distances to Infinity, source to 0
  for (const nodeId of AdjList.keys()) {
    distances.set(nodeId, Infinity)
    parents.set(nodeId, null)
  }

  distances.set(sourceId, 0)
  pq.enqueue(sourceId, 0) // {id, distance}

  let iterations = 0

  while (!pq.isEmpty()) {
    iterations++
    const result = pq.dequeue()
    if (!result) break // Should not happen if isEmpty() check is correct

    const { id: u, priority: dist_u } = result

    // console.log(`[DEBUG: Dijkstra] Iteration ${iterations}: Processing node ${u} with distance ${dist_u.toFixed(4)} ms.`)

    if (u === destinationId) {
      console.log(
        `[DEBUG: Dijkstra] Destination ${destinationId} reached in ${iterations} iterations.`
      )
      break
    }

    // Skip if we found a shorter path to u already (stale entry)
    if (dist_u > distances.get(u)) {
      // console.log(`[DEBUG: Dijkstra] Skipping stale entry for ${u}.`)
      continue
    }

    // Relax edges
    const neighbors = AdjList.get(u)
    if (!neighbors) {
      console.warn(
        `[DEBUG: Dijkstra WARNING] Node ${u} has no entry in AdjList or its entry is null/undefined.`
      )
      continue
    }

    for (const edge of neighbors) {
      const v = edge.target
      const weight_uv = edge.weight

      if (isNaN(weight_uv) || weight_uv < 0) {
        console.error(
          `[DEBUG: Dijkstra ERROR] Invalid weight (${weight_uv}) for edge ${u} -> ${v}. Skipping relaxation.`
        )
        continue
      }

      const newDist = dist_u + weight_uv

      if (newDist < distances.get(v)) {
        distances.set(v, newDist)
        parents.set(v, u)
        pq.enqueue(v, newDist)
        // console.log(`[DEBUG: Dijkstra] Relaxed ${u} -> ${v}. New distance: ${newDist.toFixed(4)} ms.`)
      }
    }
  }

  // --- Path Reconstruction (Backtracking) ---
  const shortestPath = []
  let current = destinationId
  let totalLatency = distances.get(destinationId) || Infinity

  console.log(
    `[DEBUG: Dijkstra] Final calculated distance to ${destinationId}: ${totalLatency.toFixed(
      2
    )} ms.`
  )

  while (current !== null && current !== undefined && current !== sourceId) {
    shortestPath.unshift(current)
    current = parents.get(current)
  }

  if (current === sourceId) {
    shortestPath.unshift(sourceId)
    console.log('[DEBUG: Path Reconstruction] Path successfully reconstructed.')
  } else if (totalLatency === Infinity) {
    console.warn(
      `[DEBUG: Path Reconstruction WARNING] No path found from ${sourceId} to ${destinationId}.`
    )
    return { path: [], totalLatency: Infinity }
  } else {
    // This should ideally not happen if totalLatency is finite and the source was reachable
    console.error(
      `[DEBUG: Path Reconstruction ERROR] Failed to backtrack to source ${sourceId}, but totalLatency is finite (${totalLatency.toFixed(
        2
      )} ms). Loop terminated at ${current}.`
    )
  }

  return { path: shortestPath, totalLatency: totalLatency }
}

// ===================================
// 5. Main Execution Function
// ===================================

/**
 * Executes the full shortest path calculation pipeline.
 */
function calculateShortestPath(sourceId, destId) {
  shortestPathData.isCalculating = true
  shortestPathData.sourceId = sourceId
  shortestPathData.destId = destId
  shortestPathData.path = []
  shortestPathData.totalLatency = Infinity

  console.group(`[ShortestPath] CORE CALCULATION: ${sourceId} -> ${destId}`)

  // Check for required global time variable
  if (typeof today === 'undefined') {
    console.error(
      '[ShortestPath ERROR] Global variable "today" (current time) is undefined. Using new Date().'
    )
  }
  const currentTime = typeof today !== 'undefined' ? today : new Date()

  // 1. Build the graph (dynamically changes with time)
  const AdjList = buildDynamicAdjacencyList(currentTime)

  // 2. Run Dijkstra's
  const result = dijkstra(AdjList, sourceId, destId)

  // 3. Store results
  shortestPathData.path = result.path
  shortestPathData.totalLatency = result.totalLatency
  shortestPathData.isCalculating = false

  console.log('[ShortestPath] Calculation Complete.')
  if (shortestPathData.totalLatency !== Infinity) {
    console.log('Path:', shortestPathData.path.join(' -> '))
    console.log('Latency:', shortestPathData.totalLatency.toFixed(2), 'ms')
  } else {
    console.log('Path:', 'No Path Found!')
  }

  // Update GUI if available (to display latency)
  if (typeof updatePathDisplayMetrics !== 'undefined') {
    updatePathDisplayMetrics(
      shortestPathData.totalLatency,
      shortestPathData.path.length
    )
  }

  console.groupEnd() // End of CORE CALCULATION group

  return shortestPathData
}

// Function to handle the Shortest Path Configuration File upload
function handleShortestPathFileUpload(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target.result
      parseShortestPathConfig(content)
      event.target.value = '' // Reset input
    }
    reader.readAsText(file)
  }
}

/**
 * Parses the proposed config file format.
 */
function parseShortestPathConfig(content) {
  const lines = content.split('\n')
  if (lines.length === 0) return

  const line = lines[0].trim()
  const parts = line.split(',').map((part) => part.trim())

  if (parts.length < 2 || !parts[0] || !parts[1]) {
    console.error(
      '[ShortestPath Config ERROR] Invalid Shortest Path Config format. Expected: Source_ID, Dest_ID'
    )
    return
  }

  const sourceId = parts[0]
  const destId = parts[1]

  console.log(
    `[ShortestPath Config] File loaded: Source=${sourceId}, Dest=${destId}`
  )

  // We immediately set the GUI values and calculate
  if (
    typeof guiControls !== 'undefined' &&
    guiControls.pathSource &&
    guiControls.pathDest
  ) {
    guiControls.pathSource = sourceId
    guiControls.pathDest = destId
    // gui.updateDisplay(); // Assuming external update call
    calculateShortestPath(sourceId, destId)
  } else {
    calculateShortestPath(sourceId, destId)
  }
}

// Global function to update the HUD/Caption with path metrics
function updatePathDisplayMetrics(latency_ms, hop_count) {
  const latencyElement = document.getElementById('latencyDisplay')
  const hopsElement = document.getElementById('hopCountDisplay')

  const latencyText =
    latency_ms === Infinity ? 'N/A (No Path)' : `${latency_ms.toFixed(2)} ms`
  const hopsText = hop_count <= 1 ? 'N/A' : `${hop_count - 1}` // path array includes source and destination

  if (latencyElement && hopsElement) {
    latencyElement.textContent = `Latency: ${latencyText}`
    hopsElement.textContent = `Hops: ${hopsText}`
  }
}
