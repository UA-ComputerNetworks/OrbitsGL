// Handle the Shortest Path File upload
document.getElementById('ShortestPathFileInput').onchange = function (event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = function (e) {
      const content = e.target.result

      // Parse the uploaded file content
      parseShortestPathFile(content)

      console.log('Shortest Path File processed:', content)
    }
    reader.readAsText(file)
  } else {
    console.error('No file selected for Shortest Path Visualization.')
  }
}
let shortestPaths = []
let currentPathIndex = -1 // Track the current path index

/**
 * Parse the shortest path file and store paths for visualization.
 * @param {string} content - File content
 */
function parseShortestPathFile(content) {
  const lines = content.split('\n').filter((line) => line.trim() !== '')
  shortestPaths = [] // Clear previous paths if re-uploading a new file

  lines.forEach((line) => {
    const [timestamp, ...satelliteIds] = line
      .split(',')
      .map((item) => item.trim())
    if (timestamp && satelliteIds.length > 0) {
      const satelliteNames = satelliteIds.map(
        (id) => satelliteCatalogMap[id] || id // Convert catalog numbers to names if needed
      )
      shortestPaths.push({
        timestamp: new Date(timestamp), // Convert timestamp to a Date object
        satelliteIds: satelliteNames,
      })
    } else {
      console.warn(`Invalid line format: ${line}`)
    }
  })

  // Sort paths by timestamp (just in case they are not already sorted)
  shortestPaths.sort((a, b) => a.timestamp - b.timestamp)

  console.log('Parsed Shortest Paths:', shortestPaths)
}

/**
 * Visualize the shortest path for the current time.
 * @param {Matrix} matrix - View matrix
 * @param {Object} nutPar - Nutation parameters
 * @param {Date} currentTime - The current time for visualization
 */
function visualizeShortestPaths(matrix, nutPar, currentTime) {
  if (!shortestPaths.length) {
    console.warn('No shortest paths to visualize.')
    return
  }

  let pathToVisualize = null

  // Handle cases before the first timestamp
  if (currentTime < shortestPaths[0].timestamp) {
    pathToVisualize = shortestPaths[0]
    currentPathIndex = 0
    console.log(
      `Current time is before the first timestamp. Visualizing the first path.`
    )
  }
  // Handle cases after the last timestamp
  else if (currentTime >= shortestPaths[shortestPaths.length - 1].timestamp) {
    pathToVisualize = shortestPaths[shortestPaths.length - 1]
    currentPathIndex = shortestPaths.length - 1
    console.log(
      `Current time is after the last timestamp. Visualizing the last path.`
    )
  }
  // Handle cases between timestamps
  else {
    for (let i = currentPathIndex + 1; i < shortestPaths.length; i++) {
      if (shortestPaths[i].timestamp <= currentTime) {
        currentPathIndex = i
        pathToVisualize = shortestPaths[i]
      } else {
        break
      }
    }
  }

  if (pathToVisualize) {
    const { timestamp, satelliteIds } = pathToVisualize
    console.log(`At ${timestamp}, visualizing path:`, satelliteIds)

    // Call drawShortestPath for the current path
    drawShortestPath(matrix, nutPar, satelliteIds, today)
  }
}
