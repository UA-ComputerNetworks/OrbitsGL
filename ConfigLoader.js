// ConfigLoader.js

function loadConfigurationFile(configPath) {
  fetch(configPath)
    .then((response) => {
      if (!response.ok) throw new Error('Config file not found.')
      return response.text()
    })
    .then((text) => {
      const lines = text.split('\n')
      lines.forEach((line) => {
        const trimmed = line.trim()
        if (trimmed === '' || trimmed.startsWith('#')) return

        const [key, value] = trimmed
          .split('=')
          .map((s) => s.trim().replace(/^"|"$/g, ''))
        switch (key) {
          case 'ConstellationFile':
            loadTLEFile(value)
            break
          case 'HighlightSatellitesFile':
            loadSatelliteHighlightFile(value)
            break
          case 'ISLFile':
            loadISLFile(value)
            break
          case 'ShortestPathFile':
            loadShortestPathFile(value)
            break
          case 'GroundStationsFile':
            loadGroundStationsFromFile(value)
            break
          default:
            console.warn('Unknown config key:', key)
        }
      })
    })
    .catch((err) => {
      console.log('No config loaded:', err.message)
    })
}

// ⬇️ Dummy implementations you can override
function loadTLEFile(path) {
  fetch(path)
    .then((res) => res.text())
    .then((content) => {
      const filename = path.split('/').pop()
      const timestamp = extractTimestamp(filename) || Date.now()
      const constellationName = filename.split('_')[0]

      tleFiles.push({ name: filename, content, timestamp })

      if (!firstSatelliteEpoch) {
        firstSatelliteEpoch = new Date(timestamp)
      }

      guiControls.targetName = constellationName
      if (osvControls?.targetName) {
        osvControls.targetName.setValue(constellationName)
      }

      // Update text area if present
      const TLEinput = document.getElementById('TLEListinput')
      if (TLEinput) TLEinput.value += `${filename}\n`

      // Process the TLE (does everything)
      processTLEFile(content, filename)

      console.log(`Loaded and processed TLE: ${filename}`)
    })
    .catch((e) => console.error('Error loading TLE:', e))
}

function loadSatelliteHighlightFile(url) {
  fetch(url)
    .then((res) => res.text())
    .then((data) => {
      // Implement this in your app
      console.log('Loaded highlights:', url)
    })
}

function loadISLFile(url) {
  fetch(url)
    .then((res) => res.text())
    .then((data) => {
      // Implement this in your app
      console.log('Loaded ISL:', url)
    })
}

function loadShortestPathFile(url) {
  fetch(url)
    .then((res) => res.text())
    .then((data) => {
      // Implement this in your app
      console.log('Loaded shortest path:', url)
    })
}

function loadGroundStationsFromFile(url) {
  fetch(url)
    .then((res) => res.text())
    .then((data) => {
      // Implement this in your app
      console.log('Loaded ground stations:', url)
    })
}

function resetAllData() {
  // Wipe globals
  if (typeof satellites !== 'undefined') satellites = []
  if (typeof selectedSatellites !== 'undefined') selectedSatellites = []
  if (typeof satelliteObjects !== 'undefined') satelliteObjects = []
  if (typeof uploadedGroundStations !== 'undefined') uploadedGroundStations = []
  if (typeof islData !== 'undefined') islData = { links: [] }
  if (typeof shortestPathIds !== 'undefined') shortestPathIds = []

  if (typeof contextJs !== 'undefined')
    contextJs.clearRect(0, 0, canvasJs.width, canvasJs.height)

  if (typeof gl !== 'undefined')
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  console.log('Visualization reset.')
}
