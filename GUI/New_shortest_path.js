// ===================================
// New_shortest_path.js - Dynamic Pathfinding Logic
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

// ===================================
// 1. Min-Priority Queue Implementation (Essential for Dijkstra's)
// ===================================

class PriorityQueue {
  constructor() {
    // Array of objects: [{id: 'nodeId', priority: distance}]
    this.values = []
  }

  enqueue(id, priority) {
    this.values.push({ id, priority })
    this.bubbleUp()
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
    const min = this.values[0]
    const end = this.values.pop()
    if (this.values.length > 0) {
      this.values[0] = end
      this.sinkDown()
    }
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
// 2. Geometric Utility Functions
// (Assumed available globally, defining placeholders for clarity)
// ===================================

/**
 * Calculates the Euclidean distance between two ECEF positions in km.
 * @param {number[]} posA_ECEF - [x, y, z] in km.
 * @param {number[]} posB_ECEF - [x, y, z] in km.
 * @returns {number} Distance in km.
 */
function calculateDistance(posA_ECEF, posB_ECEF) {
  // Assuming MathUtils.vecsub and MathUtils.norm are available globally
  if (
    typeof MathUtils === 'undefined' ||
    typeof MathUtils.vecsub === 'undefined'
  ) {
    const dx = posA_ECEF[0] - posB_ECEF[0]
    const dy = posA_ECEF[1] - posB_ECEF[1]
    const dz = posA_ECEF[2] - posB_ECEF[2]
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
  return MathUtils.norm(MathUtils.vecsub(posA_ECEF, posB_ECEF))
}

/**
 * Simplified Earth Occlusion Test for ISLs.
 * Checks if the line segment between two ECEF points (A and B) intersects the Earth sphere.
 * Note: A rigorous LEO simulation requires checking against the WGS84 ellipsoid.
 * @param {number[]} posA_ECEF - [x, y, z] in km.
 * @param {number[]} posB_ECEF - [x, y, z] in km.
 * @returns {boolean} True if occluded (intersects Earth), false otherwise.
 */
function checkEarthOcclusion(posA_ECEF, posB_ECEF) {
  // Vector from A to B
  const d = MathUtils.vecsub(posB_ECEF, posA_ECEF)
  // Squared magnitude of d
  const d_dot_d = MathUtils.dot(d, d)
  // Vector from Earth center (0,0,0) to A
  const a = posA_ECEF
  // d dot a
  const d_dot_a = MathUtils.dot(d, a)
  // a dot a - R^2
  const a_dot_a_minus_R2 =
    MathUtils.dot(a, a) - EARTH_RADIUS_KM * EARTH_RADIUS_KM

  // Solve the quadratic equation for t: (d.d)t^2 + 2(d.a)t + (a.a - R^2) = 0
  const discriminant = d_dot_a * d_dot_a - d_dot_d * a_dot_a_minus_R2

  if (discriminant < 0) {
    // No real intersection, link is clear.
    return false
  }

  const sqrt_discriminant = Math.sqrt(discriminant)

  // t1 and t2 are intersection parameters along the line (not segment)
  const t1 = (-d_dot_a - sqrt_discriminant) / d_dot_d
  const t2 = (-d_dot_a + sqrt_discriminant) / d_dot_d

  // Link is occluded if an intersection point falls within the segment (0 < t < 1)
  // We only need to check the closest intersection point t1.
  if (t1 > 0 && t1 < 1) {
    return true // Closest intersection is in front of A and before B
  }

  // If t1 is <= 0 but t2 is between 0 and 1, it means A is inside the Earth
  // (which should not happen for a satellite).
  // If the segment [A, B] fully contains the Earth, both t1 and t2 would be between 0 and 1,
  // but since LEO satellites are above the surface, we usually just check if a root exists
  // within the segment.
  if (t1 < 0 && t2 > 0 && t2 < 1) {
    // This case implies A or B is inside Earth, which is geometrically unlikely for LEO.
    // Given the segment [0, 1], if t1 < 0 and t2 > 0, the Earth is behind A (or A is inside).
    // Let's rely on t1 > 0 && t1 < 1 for the segment check.
    return false
  }

  return false
}

// Note: calculateElevation is assumed to be available from GroundStations.js

// ===================================
// 3. Graph Construction
// ===================================

/**
 * Builds the dynamic adjacency list (graph) based on current satellite/GS positions and constraints.
 * @param {Date} currentTime - The current simulation time for propagation.
 * @returns {Map<string, {target: string, weight: number}[]>} The Adjacency List.
 */
function buildDynamicAdjacencyList(currentTime) {
  if (
    typeof satelliteObjects === 'undefined' ||
    typeof uploadedGroundStations === 'undefined'
  ) {
    console.error(
      'Satellite or Ground Station data not available for graph building.'
    )
    return new Map()
  }

  const AdjList = new Map()
  const allNodes = []

  // --- 1. Collect and Prepare Nodes (Satellites & GS) ---

  // Get current ECEF positions for all satellites (assumes they are propagated outside this function)
  const satellites = Object.values(satelliteObjects)

  // Initialize nodes in the Adjacency List
  satellites.forEach((sat) => {
    allNodes.push(sat.name)
    AdjList.set(sat.name, [])
  })
  uploadedGroundStations.forEach((gs) => {
    allNodes.push(gs.name)
    AdjList.set(gs.name, [])
  })

  // --- 2. Calculate ISLs (Inter-Satellite Links) ---
  // This is the most computationally expensive part (O(V^2), ideally O(V*k)).
  // For simplicity and general constellation support, we check all pairs here.
  // Performance Note: For large constellations, this must be optimized to check only neighbors.

  for (let i = 0; i < satellites.length; i++) {
    const satA = satellites[i]
    const posA_ECEF = satA.r_ECEF // Assumed to be updated in the main loop

    // Skip satellites without valid positions (r_ECEF should be in kilometers)
    if (!posA_ECEF || posA_ECEF.some(isNaN)) {
      console.warn(
        `[DEBUG: Graph] Skipping Sat A: ${satA.name} due to invalid ECEF position.`
      )
      continue
    }

    for (let j = i + 1; j < satellites.length; j++) {
      const satB = satellites[j]
      const posB_ECEF = satB.r_ECEF // Assumed to be updated in the main loop

      console.log(`[DEBUG: ISL Check] Checking ${satA.name} <-> ${satB.name}`) // DEBUG 2

      if (!checkEarthOcclusion(posA_ECEF, posB_ECEF)) {
        // Link is clear (Line-of-Sight is established)
        const distance_km = calculateDistance(posA_ECEF, posB_ECEF)
        // Latency in milliseconds (km / (km/s) * 1000)
        const latency_ms = (distance_km / SPEED_OF_LIGHT_KM_S) * 1000

        console.log(
          `[DEBUG: ISL Success] Link established! Distance: ${distance_km.toFixed(
            2
          )} km, Latency: ${latency_ms.toFixed(2)} ms`
        ) // DEBUG 3

        // Add bidirectional link
        AdjList.get(satA.name).push({ target: satB.name, weight: latency_ms })
        AdjList.get(satB.name).push({ target: satA.name, weight: latency_ms })
      } else {
        console.log(
          `[DEBUG: ISL Failure] Blocked by Earth Occlusion or out of range.`
        ) // DEBUG 4
      }
    }
  }

  // --- 3. Calculate SGLs (Satellite-Ground Links) ---
  // O(V_GS * V_SAT) checks

  // Note: The OrbitsGL GS file format in the doc did not include Min_Elevation,
  // but the architectural report (III.1.2) says it should.
  const DEFAULT_MIN_ELEVATION_DEG = 10.0 // Default if not in GS data

  for (const gs of uploadedGroundStations) {
    const posGS_ECEF = gs.positionECEF // Already computed in GroundStations.js

    // Find the minElevation property, defaulting if necessary
    const minElevation = gs.minElevation || DEFAULT_MIN_ELEVATION_DEG

    for (const sat of satellites) {
      const posSat_ECEF = sat.r_ECEF // Assumed ECEF position in km

      // Assumes 'calculateElevation' is available globally (from GroundStations.js)
      if (typeof calculateElevation === 'undefined') {
        console.error('calculateElevation function is missing!')
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
        const latency_ms = (distance_km / SPEED_OF_LIGHT_KM_S) * 1000

        // Add bidirectional link
        AdjList.get(gs.name).push({ target: sat.name, weight: latency_ms })
        AdjList.get(sat.name).push({ target: gs.name, weight: latency_ms })
      }
    }
  }

  console.log(`[DEBUG: Graph] Final AdjList size: ${AdjList.size}`) // DEBUG 5

  return AdjList
}

// ===================================
// 4. Dijkstra's Shortest Path Algorithm
// ===================================

/**
 * Finds the shortest path (minimum latency) from a source to a destination.
 * @param {Map<string, {target: string, weight: number}[]>} AdjList - The graph.
 * @param {string} sourceId - Starting node ID.
 * @param {string} destinationId - Ending node ID.
 * @returns {{path: string[], totalLatency: number}} Path and total cost.
 */
function dijkstra(AdjList, sourceId, destinationId) {
  const distances = new Map()
  const parents = new Map()
  const pq = new PriorityQueue()

  if (!AdjList.has(sourceId) || !AdjList.has(destinationId)) {
    console.warn(
      `Source (${sourceId}) or Destination (${destinationId}) not found in graph.`
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

  while (!pq.isEmpty()) {
    const { id: u, priority: dist_u } = pq.dequeue()

    if (u === destinationId) break

    // Skip if we found a shorter path to u already (stale entry)
    if (dist_u > distances.get(u)) continue

    // Relax edges
    for (const edge of AdjList.get(u)) {
      const v = edge.target
      const weight_uv = edge.weight
      const newDist = dist_u + weight_uv

      if (newDist < distances.get(v)) {
        distances.set(v, newDist)
        parents.set(v, u)
        pq.enqueue(v, newDist)
      }
    }
  }

  // --- Path Reconstruction (Backtracking) ---
  const shortestPath = []
  let current = destinationId
  let totalLatency = distances.get(destinationId) || Infinity

  while (current !== null && current !== undefined && current !== sourceId) {
    shortestPath.unshift(current)
    current = parents.get(current)
  }

  if (current === sourceId) {
    shortestPath.unshift(sourceId)
  } else if (totalLatency === Infinity) {
    console.warn(`No path found from ${sourceId} to ${destinationId}.`)
    return { path: [], totalLatency: Infinity }
  }

  return { path: shortestPath, totalLatency: totalLatency }
}

// ===================================
// 5. Main Execution Function
// ===================================

/**
 * Executes the full shortest path calculation pipeline.
 * Assumes the main animation loop updates 'today' (current time) and
 * propagates satellite positions (updates r_ECEF).
 */
function calculateShortestPath(sourceId, destId) {
  shortestPathData.isCalculating = true
  shortestPathData.sourceId = sourceId
  shortestPathData.destId = destId
  shortestPathData.path = []
  shortestPathData.totalLatency = Infinity

  console.log(
    `[ShortestPath] Starting calculation from ${sourceId} to ${destId}...`
  )

  // 1. Build the graph (dynamically changes with time)
  const currentTime = today // Assumes 'today' is the global time Date object
  const AdjList = buildDynamicAdjacencyList(currentTime)

  // 2. Run Dijkstra's
  const result = dijkstra(AdjList, sourceId, destId)

  // 3. Store results
  shortestPathData.path = result.path
  shortestPathData.totalLatency = result.totalLatency
  shortestPathData.isCalculating = false

  console.log('[ShortestPath] Calculation Complete.')
  console.log('Path:', shortestPathData.path.join(' -> '))
  console.log('Latency:', shortestPathData.totalLatency.toFixed(2), 'ms')

  // Update GUI if available (to display latency)
  if (typeof updatePathDisplayMetrics !== 'undefined') {
    updatePathDisplayMetrics(
      shortestPathData.totalLatency,
      shortestPathData.path.length
    )
  }

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
 * Format: Source_ID, Dest_ID (e.g., GS_A, Sat_25544)
 */
function parseShortestPathConfig(content) {
  const lines = content.split('\n')
  if (lines.length === 0) return

  const line = lines[0].trim()
  const parts = line.split(',').map((part) => part.trim())

  if (parts.length < 2) {
    console.error(
      'Invalid Shortest Path Config format. Expected: Source_ID, Dest_ID'
    )
    return
  }

  const sourceId = parts[0]
  const destId = parts[1]

  // We immediately set the GUI values and calculate
  if (guiControls && guiControls.pathSource && guiControls.pathDest) {
    guiControls.pathSource = sourceId
    guiControls.pathDest = destId
    // Force GUI update (optional, depending on dat.GUI structure)
    // gui.updateDisplay();
    calculateShortestPath(sourceId, destId)
  } else {
    console.log(
      `Path configuration loaded from file: Source=${sourceId}, Dest=${destId}`
    )
    calculateShortestPath(sourceId, destId)
  }
}

// Global function to update the HUD/Caption with path metrics
function updatePathDisplayMetrics(latency_ms, hop_count) {
  const latencyElement = document.getElementById('latencyDisplay')
  const hopsElement = document.getElementById('hopCountDisplay')

  if (latencyElement && hopsElement) {
    latencyElement.textContent = `Latency: ${latency_ms.toFixed(2)} ms`
    hopsElement.textContent = `Hops: ${hop_count - 1}` // path array includes source and destination
  }
}
