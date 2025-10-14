// ===================================
// New_shortest_path.js - Dynamic Pathfinding Logic
//
// This file implements the core logic for dynamic shortest path routing
// using Dijkstra's algorithm with a Min-Priority Queue.
// ===================================

// Global state object for the shortest path results and calculation status.
let shortestPathData = {
  path: [], // Array of node IDs (Satellite Names or GS Names) forming the shortest route.
  totalLatency: Infinity, // Total latency of the path in milliseconds.
  sourceId: null, // Starting node ID for the current calculation.
  destId: null, // Ending node ID for the current calculation.
  isCalculating: false, // Flag to indicate if the calculation is currently running.
}

// Earth Radius in kilometers (WGS84 estimate for geometric checks).
const EARTH_RADIUS_KM = 6378.137
// Speed of light in kilometers per second, used to convert distance to latency.
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

/**
 * Data Structure: PriorityQueue
 * Implements a Min-Heap, ensuring the element with the lowest 'priority' (latency)
 * is always at the front, which is crucial for Dijkstra's efficiency.
 */
class PriorityQueue {
  constructor() {
    // Stores elements as an array of objects: [{id: 'nodeId', priority: distance}].
    this.values = []
    console.log('[DEBUG: PQ] Priority Queue initialized.')
  }

  /**
   * Adds an element (node ID) with its priority (distance/latency) to the queue.
   * @param {string} id - The ID of the node.
   * @param {number} priority - The current shortest distance to this node.
   */
  enqueue(id, priority) {
    if (isNaN(priority)) {
      console.error(
        `[DEBUG: PQ ERROR] Attempted to enqueue node ${id} with NaN priority!`
      )
      return
    }
    this.values.push({ id, priority })
    this.bubbleUp() // Restore the Min-Heap property by moving the new element up.
    // console.log(`[DEBUG: PQ] Enqueued ${id} with priority ${priority.toFixed(4)}.`);
  }

  /**
   * Moves a newly inserted element up the heap until it finds its correct position
   * (i.e., its priority is greater than its parent's).
   */
  bubbleUp() {
    let idx = this.values.length - 1
    const element = this.values[idx]
    while (idx > 0) {
      let parentIdx = Math.floor((idx - 1) / 2)
      let parent = this.values[parentIdx]
      // Stop if priority is greater than or equal to parent's priority
      if (element.priority >= parent.priority) break
      // Swap positions
      this.values[parentIdx] = element
      this.values[idx] = parent
      idx = parentIdx
    }
  }

  /**
   * Removes and returns the element with the highest priority (minimum distance/latency).
   * @returns {Object} The node object {id, priority} with the smallest priority.
   */
  dequeue() {
    if (this.values.length === 0) {
      console.warn('[DEBUG: PQ] Attempted to dequeue from an empty queue.')
      return null
    }
    const min = this.values[0] // The minimum is always at the root.
    const end = this.values.pop() // Remove the last element.
    if (this.values.length > 0) {
      this.values[0] = end // Move the last element to the root.
      this.sinkDown() // Restore the Min-Heap property by moving the new root down.
    }
    // console.log(`[DEBUG: PQ] Dequeued ${min.id} with priority ${min.priority.toFixed(4)}.`);
    return min
  }

  /**
   * Moves the root element down the heap until it is in the correct position
   * (i.e., its priority is less than or equal to both children's priorities).
   */
  sinkDown() {
    let idx = 0
    const length = this.values.length
    const element = this.values[0]

    while (true) {
      let leftChildIdx = 2 * idx + 1
      let rightChildIdx = 2 * idx + 2
      let leftChild, rightChild
      let swap = null // Index to swap with (the smaller child)

      // Check left child
      if (leftChildIdx < length) {
        leftChild = this.values[leftChildIdx]
        if (leftChild.priority < element.priority) {
          swap = leftChildIdx
        }
      }
      // Check right child
      if (rightChildIdx < length) {
        rightChild = this.values[rightChildIdx]
        if (
          // If right child is smaller than element AND (no swap yet OR right is smaller than left)
          (swap === null && rightChild.priority < element.priority) ||
          (swap !== null && rightChild.priority < leftChild.priority)
        ) {
          swap = rightChildIdx
        }
      }
      if (swap === null) break // If no swap was needed, the element is in the correct place.
      this.values[idx] = this.values[swap]
      this.values[swap] = element
      idx = swap
    }
  }

  /**
   * Checks if the priority queue is empty.
   * @returns {boolean} True if the queue has no elements.
   */
  isEmpty() {
    return this.values.length === 0
  }
}

// ===================================
// 2. Geometric Utility Functions (Enhanced ECEF/NaN Checking)
// ===================================

/**
 * Calculates the Euclidean distance between two ECEF positions in km.
 * @param {number[]} posA_ECEF - [x, y, z] position vector in km.
 * @param {number[]} posB_ECEF - [x, y, z] position vector in km.
 * @returns {number} Distance in km, or Infinity if inputs are invalid.
 */
function calculateDistance(posA_ECEF, posB_ECEF) {
  // Input validation: ensure ECEF arrays are valid and contain numbers.
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

  // Use external MathUtils library functions if available (preferred method).
  if (
    typeof MathUtils !== 'undefined' &&
    typeof MathUtils.vecsub !== 'undefined' &&
    typeof MathUtils.norm !== 'undefined'
  ) {
    // MathUtils.vecsub: vector subtraction (B - A)
    // MathUtils.norm: magnitude (length) of the vector
    const distance = MathUtils.norm(MathUtils.vecsub(posA_ECEF, posB_ECEF))
    // console.log(`[DEBUG: DISTANCE] Calculated distance using MathUtils: ${distance.toFixed(2)} km`)
    return distance
  }

  // Fallback: Direct Euclidean distance calculation (Euclidean norm of the difference vector).
  const dx = posA_ECEF[0] - posB_ECEF[0]
  const dy = posA_ECEF[1] - posB_ECEF[1]
  const dz = posA_ECEF[2] - posB_ECEF[2]
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

  // console.log(`[DEBUG: DISTANCE] Calculated distance (fallback): ${distance.toFixed(2)} km`)
  return distance
}

/**
 * Simplified Earth Occlusion Test for Inter-Satellite Links (ISLs).
 * Checks if the line segment between two ECEF points intersects the Earth sphere.
 * This is done by solving the quadratic equation for line-sphere intersection.
 * @param {number[]} posA_ECEF - [x, y, z] in km.
 * @param {number[]} posB_ECEF - [x, y, z] in km.
 * @returns {boolean} True if occluded (intersects Earth), false otherwise.
 */
function checkEarthOcclusion(posA_ECEF, posB_ECEF) {
  // CRITICAL CHECK: Ensure MathUtils library is available for vector operations.
  if (
    typeof MathUtils === 'undefined' ||
    typeof MathUtils.vecsub === 'undefined' ||
    typeof MathUtils.dot === 'undefined'
  ) {
    console.error(
      '[DEBUG: OCCLUSION ERROR] MathUtils library is missing! Cannot perform occlusion check.'
    )
    return false // Assume clear if check cannot be performed.
  }

  // Input validation for ECEF positions
  if (posA_ECEF.some(isNaN) || posB_ECEF.some(isNaN)) {
    console.warn(
      '[DEBUG: OCCLUSION WARNING] One or both ECEF positions contain NaN. Assuming occluded.'
    )
    return true
  }

  // D: Vector from A to B (Direction vector)
  const d = MathUtils.vecsub(posB_ECEF, posA_ECEF)
  // d_dot_d: Squared magnitude of D (coefficient 'a' in the quadratic equation)
  const d_dot_d = MathUtils.dot(d, d)
  // A: Vector from Earth center (0,0,0) to A
  const a = posA_ECEF
  // d_dot_a: Dot product of D and A (related to coefficient 'b')
  const d_dot_a = MathUtils.dot(d, a)
  // R_sq: Earth radius squared
  const R_sq = EARTH_RADIUS_KM * EARTH_RADIUS_KM
  // a_dot_a_minus_R2: Dot product of A with itself minus R^2 (coefficient 'c')
  const a_dot_a_minus_R2 = MathUtils.dot(a, a) - R_sq

  // Calculate the discriminant (b^2 - 4ac)
  const discriminant = d_dot_a * d_dot_a - d_dot_d * a_dot_a_minus_R2

  if (discriminant < 0) {
    // If discriminant is negative, no real intersection exists.
    return false
  }

  const sqrt_discriminant = Math.sqrt(discriminant)

  // CRITICAL CHECK: If distance is zero, skip calculation to avoid division by zero.
  if (Math.abs(d_dot_d) < 1e-6) {
    console.warn(
      '[DEBUG: OCCLUSION WARNING] Distance between A and B is zero. Assuming clear (or same node).'
    )
    return false
  }

  // Calculate intersection parameters t1 and t2 along the infinite line.
  const t1 = (-d_dot_a - sqrt_discriminant) / d_dot_d
  const t2 = (-d_dot_a + sqrt_discriminant) / d_dot_d

  // The link is occluded if any intersection point falls within the segment (0 < t < 1).
  const isOccluded = (t1 > 0 && t1 < 1) || (t2 > 0 && t2 < 1)

  if (isOccluded) {
    return true // Blocked by Earth.
  }

  return false // Intersections exist, but they are outside the segment [A, B].
}

// ===================================
// 3. Graph Construction (Detailed Debugging)
// ===================================

/**
 * Builds the dynamic adjacency list (graph) based on current satellite/GS positions and constraints.
 * This is the step that makes the pathfinding "dynamic," as the graph changes every frame.
 * @param {Date} currentTime - The current simulation time.
 * @returns {Map<string, {target: string, weight: number}[]>} The Adjacency List (the Graph).
 */
function buildDynamicAdjacencyList(currentTime) {
  console.log(
    `[DEBUG: Graph] Starting graph construction at time: ${currentTime.toISOString()}`
  )

  // Check if required global data objects exist (assumed to be populated externally).
  if (
    typeof satelliteObjects === 'undefined' ||
    typeof uploadedGroundStations === 'undefined'
  ) {
    console.error(
      '[DEBUG: Graph ERROR] Satellite or Ground Station data not available for graph building.'
    )
    return new Map()
  }

  // Data Structure: AdjList (Adjacency List)
  // Maps node ID (string) to an array of neighbor objects: [{target: string, weight: number}].
  const AdjList = new Map()
  const satellites = Object.values(satelliteObjects)

  console.log(
    `[DEBUG: Graph] Found ${satellites.length} satellites and ${uploadedGroundStations.length} ground stations.`
  )

  // --- 1. Collect and Prepare Nodes (Satellites & GS) ---
  // Initialize an empty neighbor list for every node.
  satellites.forEach((sat) => {
    AdjList.set(sat.name, [])
    // Log warnings if satellite positions are invalid (critical for links).
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
  // Checks for direct link between every unique pair of satellites.
  let islCount = 0
  for (let i = 0; i < satellites.length; i++) {
    const satA = satellites[i]
    const posA_ECEF = satA.r_ECEF

    // Skip Sat A if position is invalid
    if (!posA_ECEF || posA_ECEF.some(isNaN)) {
      continue
    }

    for (let j = i + 1; j < satellites.length; j++) {
      const satB = satellites[j]
      const posB_ECEF = satB.r_ECEF

      // Skip Sat B if position is invalid
      if (!posB_ECEF || posB_ECEF.some(isNaN)) {
        continue
      }

      // 1. Check for Earth Occlusion
      if (!checkEarthOcclusion(posA_ECEF, posB_ECEF)) {
        // Link is clear.
        const distance_km = calculateDistance(posA_ECEF, posB_ECEF)
        if (distance_km === Infinity || distance_km <= 0) {
          console.warn(
            `[DEBUG: ISL WARNING] Calculated distance is invalid (${distance_km.toFixed(
              2
            )} km). Skipping link.`
          )
          continue
        }
        // 2. Calculate Latency (Weight)
        const latency_ms = (distance_km / SPEED_OF_LIGHT_KM_S) * 1000

        console.log(
          `[DEBUG: ISL Success] ${satA.name} <-> ${
            satB.name
          } | Dist: ${distance_km.toFixed(
            2
          )} km | Latency: ${latency_ms.toFixed(2)} ms`
        )

        // 3. Add Bidirectional Edge
        AdjList.get(satA.name).push({ target: satB.name, weight: latency_ms })
        AdjList.get(satB.name).push({ target: satA.name, weight: latency_ms })
        islCount++
      }
    }
  }
  console.log(
    `[DEBUG: Graph] Total ISL links added: ${islCount * 2} (bidirectional).`
  )

  // --- 3. Calculate SGLs (Satellite-Ground Links) ---
  const DEFAULT_MIN_ELEVATION_DEG = 10.0
  let sglCount = 0

  // Ensure the required external function is available.
  if (typeof calculateElevation === 'undefined') {
    console.error(
      '[DEBUG: Graph ERROR] calculateElevation function is missing! SGL links will be skipped.'
    )
  } else {
    for (const gs of uploadedGroundStations) {
      const posGS_ECEF = gs.positionECEF // Ground station position (ECEF, km).

      if (!posGS_ECEF || posGS_ECEF.some(isNaN)) {
        console.warn(
          `[DEBUG: SGL Check] Skipping GS ${gs.name} due to invalid ECEF position.`
        )
        continue
      }

      // Use GS-specific minElevation or a default value.
      const minElevation = gs.minElevation || DEFAULT_MIN_ELEVATION_DEG

      for (const sat of satellites) {
        const posSat_ECEF = sat.r_ECEF // Satellite position (ECEF, km).

        if (!posSat_ECEF || posSat_ECEF.some(isNaN)) {
          continue
        }

        // 1. Calculate Elevation Angle
        const elevation_angle = calculateElevation(
          posGS_ECEF,
          posSat_ECEF,
          gs.name,
          sat.name
        )

        // 2. Check Minimum Elevation Constraint
        if (elevation_angle >= minElevation) {
          // Link is established (above minimum elevation angle).
          const distance_km = calculateDistance(posGS_ECEF, posSat_ECEF)
          if (distance_km === Infinity || distance_km <= 0) {
            console.warn(
              `[DEBUG: SGL WARNING] Calculated distance is invalid (${distance_km.toFixed(
                2
              )} km). Skipping link.`
            )
            continue
          }
          // 3. Calculate Latency (Weight)
          const latency_ms = (distance_km / SPEED_OF_LIGHT_KM_S) * 1000

          console.log(
            `[DEBUG: SGL Success] ${gs.name} <-> ${
              sat.name
            } | Elev: ${elevation_angle.toFixed(
              2
            )} deg | Latency: ${latency_ms.toFixed(2)} ms`
          )

          // 4. Add Bidirectional Edge
          AdjList.get(gs.name).push({ target: sat.name, weight: latency_ms })
          AdjList.get(sat.name).push({ target: gs.name, weight: latency_ms })
          sglCount++
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
 * Finds the shortest path (minimum latency) from a source to a destination
 * using Dijkstra's algorithm.
 * @param {Map} AdjList - The graph (Adjacency List).
 * @param {string} sourceId - Starting node ID.
 * @param {string} destinationId - Ending node ID.
 * @returns {{path: string[], totalLatency: number}} Path array and total cost.
 */
function dijkstra(AdjList, sourceId, destinationId) {
  console.log(
    `[DEBUG: Dijkstra] Starting path search: ${sourceId} -> ${destinationId}`
  )
  // Data Structure: Map for minimum distances found so far.
  const distances = new Map()
  // Data Structure: Map to store the predecessor node for path reconstruction.
  const parents = new Map()
  // Data Structure: Min-Priority Queue for efficient node selection.
  const pq = new PriorityQueue()

  // Input validation: check if source/destination exist in the graph.
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

  // Initialization: set all distances to Infinity, source to 0.
  for (const nodeId of AdjList.keys()) {
    distances.set(nodeId, Infinity)
    parents.set(nodeId, null)
  }

  distances.set(sourceId, 0)
  pq.enqueue(sourceId, 0) // Start with the source node at distance 0.

  let iterations = 0

  // Main loop: continues until the priority queue is empty.
  while (!pq.isEmpty()) {
    iterations++
    const result = pq.dequeue()
    if (!result) break

    const { id: u, priority: dist_u } = result

    // Check for termination condition: destination found.
    if (u === destinationId) {
      console.log(
        `[DEBUG: Dijkstra] Destination ${destinationId} reached in ${iterations} iterations.`
      )
      break
    }

    // Optimization: Skip if we found a shorter path to u already (stale entry).
    if (dist_u > distances.get(u)) {
      continue
    }

    // Relax edges: examine neighbors of the current node u.
    const neighbors = AdjList.get(u)
    if (!neighbors) {
      console.warn(
        `[DEBUG: Dijkstra WARNING] Node ${u} has no entry in AdjList or its entry is null/undefined.`
      )
      continue
    }

    for (const edge of neighbors) {
      const v = edge.target // The neighbor node.
      const weight_uv = edge.weight // The latency of the link (u -> v).

      if (isNaN(weight_uv) || weight_uv < 0) {
        console.error(
          `[DEBUG: Dijkstra ERROR] Invalid weight (${weight_uv}) for edge ${u} -> ${v}. Skipping relaxation.`
        )
        continue
      }

      const newDist = dist_u + weight_uv // Candidate distance: distance to u + latency u->v.

      // Relaxation condition: if the candidate distance is shorter than the recorded distance to v.
      if (newDist < distances.get(v)) {
        distances.set(v, newDist) // Update shortest distance to v.
        parents.set(v, u) // Record u as the best predecessor for v.
        pq.enqueue(v, newDist) // Add/update v in the priority queue.
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

  // Backtrack from destination to source using the parents map.
  while (current !== null && current !== undefined && current !== sourceId) {
    shortestPath.unshift(current) // Add current node to the beginning of the path array.
    current = parents.get(current)
  }

  if (current === sourceId) {
    shortestPath.unshift(sourceId) // Add the source node.
    console.log('[DEBUG: Path Reconstruction] Path successfully reconstructed.')
  } else if (totalLatency === Infinity) {
    console.warn(
      `[DEBUG: Path Reconstruction WARNING] No path found from ${sourceId} to ${destinationId}.`
    )
    return { path: [], totalLatency: Infinity }
  } else {
    // Should not happen if total latency is finite.
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
 * Assumes 'today' (the current simulation time) and satellite data are globally available.
 * @param {string} sourceId - The ID of the starting node.
 * @param {string} destId - The ID of the ending node.
 * @returns {Object} The shortestPathData object.
 */
function calculateShortestPath(sourceId, destId) {
  // Reset and set state flags
  shortestPathData.isCalculating = true
  shortestPathData.sourceId = sourceId
  shortestPathData.destId = destId
  shortestPathData.path = []
  shortestPathData.totalLatency = Infinity

  console.group(`[ShortestPath] CORE CALCULATION: ${sourceId} -> ${destId}`)

  // Determine current simulation time.
  if (typeof today === 'undefined') {
    console.error(
      '[ShortestPath ERROR] Global variable "today" (current time) is undefined. Using new Date().'
    )
  }
  const currentTime = typeof today !== 'undefined' ? today : new Date()

  // 1. Build the dynamic graph.
  const AdjList = buildDynamicAdjacencyList(currentTime)

  // 2. Run Dijkstra's algorithm.
  const result = dijkstra(AdjList, sourceId, destId)

  // 3. Store results and clear calculating flag.
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

  // Update external GUI/display metrics if the function is defined.
  if (typeof updatePathDisplayMetrics !== 'undefined') {
    updatePathDisplayMetrics(
      shortestPathData.totalLatency,
      shortestPathData.path.length
    )
  }

  console.groupEnd()

  return shortestPathData
}

/**
 * Handles the event for uploading a file to configure the shortest path source and destination.
 * @param {Event} event - The file input change event.
 */
function handleShortestPathFileUpload(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target.result
      parseShortestPathConfig(content)
      event.target.value = '' // Reset input field for next upload.
    }
    reader.readAsText(file)
  }
}

/**
 * Parses the configuration file content (expected format: Source_ID, Dest_ID).
 * It extracts the IDs and immediately triggers the path calculation.
 * @param {string} content - The text content of the configuration file.
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

  // Update GUI controls and start calculation.
  if (
    typeof guiControls !== 'undefined' &&
    guiControls.pathSource &&
    guiControls.pathDest
  ) {
    guiControls.pathSource = sourceId
    guiControls.pathDest = destId
    // gui.updateDisplay();
    calculateShortestPath(sourceId, destId)
  } else {
    calculateShortestPath(sourceId, destId)
  }
}

/**
 * Global function to update external display elements (HUD/Caption) with path metrics.
 * Assumes the existence of HTML elements with IDs 'latencyDisplay' and 'hopCountDisplay'.
 * @param {number} latency_ms - The total latency of the path in milliseconds.
 * @param {number} hop_count - The number of nodes in the path array.
 */
function updatePathDisplayMetrics(latency_ms, hop_count) {
  const latencyElement = document.getElementById('latencyDisplay')
  const hopsElement = document.getElementById('hopCountDisplay')

  const latencyText =
    latency_ms === Infinity ? 'N/A (No Path)' : `${latency_ms.toFixed(2)} ms`
  // Hop count is path length - 1 (since path includes source and dest)
  const hopsText = hop_count <= 1 ? 'N/A' : `${hop_count - 1}`

  if (latencyElement && hopsElement) {
    latencyElement.textContent = `Latency: ${latencyText}`
    hopsElement.textContent = `Hops: ${hopsText}`
  }
}

/**
 * [visualizeShortestPaths] - Renders the shortest path segments and highlights the nodes.
 *
 * @param {Object} matrix - The view-projection matrix for rendering.
 * @param {Object} nutPar - Nutation parameters for coordinate transformation.
 * @param {Date} today - The current simulation timestamp.
 */
function visualizeShortestPaths2(matrix, nutPar, today) {
  if (
    typeof shortestPathData === 'undefined' ||
    !shortestPathData.path ||
    shortestPathData.path.length < 2 ||
    shortestPathData.totalLatency === Infinity
  ) {
    return
  }

  const path = shortestPathData.path

  // Custom Colors for Visualization
  const lineColor = [255, 165, 0] // Orange for connecting lines
  const sourceColor = [0, 255, 0] // Green for Source node
  const destColor = [255, 0, 0] // Red for Destination node
  const intermediateColor = [255, 255, 0] // Yellow for intermediate nodes

  const markerScale = 0.009
  const lineThickness = 5.0
  const pathPointsKm = []

  const sourceId = path[0]
  const destId = path[path.length - 1]

  // ----------------------------------------------------
  // 1. Process and Draw Highlighted Markers (Satellites and GS)
  // ----------------------------------------------------

  for (let i = 0; i < path.length; i++) {
    const nodeName = path[i]
    let posECEF_km = null
    let highlightColor

    // Determine color based on position in the path
    if (nodeName === sourceId) {
      highlightColor = sourceColor
    } else if (nodeName === destId) {
      highlightColor = destColor
    } else {
      highlightColor = intermediateColor
    }

    const sat = satelliteObjects[nodeName]
    const gs = uploadedGroundStations.find((g) => g.name === nodeName)

    if (sat && sat.satrec) {
      // --- Case A: Satellite Node ---
      createOsvForSatellite(sat, today)
      posECEF_km = sat.r_ECEF

      if (posECEF_km) {
        // Draw Satellite Marker (using J2000 OSV in meters, as required)
        drawSatellite(sat, matrix, nutPar, highlightColor, markerScale)
      }
    } else if (gs && gs.positionECEF) {
      // --- Case B: Ground Station Node ---
      posECEF_km = gs.positionECEF // ECEF is already in KM

      // Draw GS Marker using the dedicated helper for custom coloring/scaling
      drawSingleGroundStation(matrix, gs, highlightColor, markerScale)
    }

    if (posECEF_km) {
      pathPointsKm.push(posECEF_km) // Store position in KM for the line drawing
    } else {
      console.warn(
        `[ShortestPath Viz ERROR] Missing position for node: ${nodeName}. Path visualization may be broken.`
      )
    }
  }

  // ----------------------------------------------------
  // 2. Draw Connecting Lines (Segments in KM)
  // ----------------------------------------------------

  if (pathPointsKm.length >= 2) {
    const lineSegments = []

    for (let i = 0; i < pathPointsKm.length - 1; i++) {
      lineSegments.push(pathPointsKm[i])
      lineSegments.push(pathPointsKm[i + 1])
    }

    // Using the line color set previously
    lineShaders.setGeometry(lineSegments, lineColor)
    lineShaders.draw(matrix)
  }
}

/**
 * [drawSingleGroundStation] - Draws a single ground station point with custom color and scale.
 * This is used specifically for highlighting nodes in the shortest path visualization.
 *
 * @param {Object} matrix - View matrix
 * @param {Object} gsObject - The ground station object (e.g., from uploadedGroundStations)
 * @param {Array} color - The custom highlight color [R, G, B].
 * @param {Number} scale - The scaling factor for the marker.
 */
function drawSingleGroundStation(matrix, gsObject, color, scale) {
  const [x, y, z] = gsObject.positionECEF // Already ECEF computed in KM

  // Create matrix for point position and scale (using KM input)
  let stationMatrix = m4.translate(matrix, x, y, z)
  stationMatrix = m4.scale(stationMatrix, scale, scale, scale)

  // Draw using the same low-level method as the original GS function
  earthShaders.setSatelliteColor(color[0], color[1], color[2])
  earthShaders.draw(stationMatrix, 0, 0, LST, false, false, false, color)
}
