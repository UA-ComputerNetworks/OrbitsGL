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
let currentShortestPathIndex = -1 // Track the current path index

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
        timestamp: new Date(
          timestamp.includes('Z') ? timestamp : timestamp + 'Z'
        ),
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

function visualizeShortestPaths(matrix, nutPar, today) {
  if (!shortestPaths.length) {
    console.warn('No shortest paths to visualize.')
    return
  }

  let newPathIndex = currentShortestPathIndex // Start from the current index

  // If `today` is before the first path timestamp, use the first available path
  if (today < shortestPaths[0].timestamp) {
    newPathIndex = 0
  }
  // If `today` is after the last path timestamp, use the last available path
  else if (today >= shortestPaths[shortestPaths.length - 1].timestamp) {
    newPathIndex = shortestPaths.length - 1
  }
  // If `today` is moving forward in time, find the next valid path
  else if (shortestPaths[newPathIndex].timestamp < today) {
    for (let i = newPathIndex + 1; i < shortestPaths.length; i++) {
      if (shortestPaths[i].timestamp > today) {
        break // Stop when reaching the first future timestamp
      }
      newPathIndex = i
    }
  }
  // If `today` is moving backward in time, find the closest previous path
  else if (shortestPaths[newPathIndex].timestamp > today) {
    for (let i = newPathIndex - 1; i >= 0; i--) {
      if (shortestPaths[i].timestamp <= today) {
        newPathIndex = i
        break
      }
    }
  }

  // Always draw the path if a valid one exists
  const pathToVisualize = shortestPaths[newPathIndex]
  console.log(`Visualizing shortest path at ${pathToVisualize.timestamp}`)
  console.log(
    `Path index: ${newPathIndex}, Satellites:`,
    pathToVisualize.satelliteIds
  )

  console.log(shortestPaths)

  drawShortestPath(matrix, nutPar, pathToVisualize.satelliteIds, today)

  // Update the index only when the path actually changes
  currentShortestPathIndex = newPathIndex
}
