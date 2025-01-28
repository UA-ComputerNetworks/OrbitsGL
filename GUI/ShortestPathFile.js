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

function parseShortestPathFile(content) {
  const lines = content.split('\n').filter((line) => line.trim() !== '')
  shortestPaths = [] // Clear previous paths if re-uploading a new file

  lines.forEach((line) => {
    const [timestamp, ...satelliteIds] = line
      .split(',')
      .map((item) => item.trim())
    if (timestamp && satelliteIds.length > 0) {
      const satelliteNames = satelliteIds.map(
        (id) => satelliteCatalogMap[id] || id
      ) // Convert catalog numbers to names if needed
      shortestPaths.push({
        timestamp: new Date(timestamp),
        satelliteIds: satelliteNames,
      })
    } else {
      console.warn(`Invalid line format: ${line}`)
    }
  })

  console.log('Parsed Shortest Paths:', shortestPaths)

  // Visualize the paths
  //visualizeShortestPaths(matrix, nutPar, today)
}

function visualizeShortestPaths(matrix, nutPar, today) {
  shortestPaths.forEach((path) => {
    const { timestamp, satelliteIds } = path

    console.log(`At ${timestamp}, visualize path:`, satelliteIds)

    // Draw the path using the satellite IDs
    drawShortestPath(matrix, nutPar, satelliteIds, today)
  })
}
