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

function loadSatelliteHighlightFile(path) {
  fetch(path)
    .then((res) => res.text())
    .then((data) => {
      const lines = data.split('\n')
      satelliteColorMap = {} // reset

      lines.forEach((line) => {
        const trimmed = line.trim()
        if (trimmed === '' || trimmed.startsWith('#')) return

        const parts = trimmed.split(',').map((p) => p.trim())
        if (parts.length < 4) {
          console.warn(`Invalid line in highlight file: ${line}`)
          return
        }

        const id = parts[0]
        const r = parseInt(parts[1])
        const g = parseInt(parts[2])
        const b = parseInt(parts[3])
        const color = [r, g, b]

        // Try catalog number mapping first
        const satName = satelliteCatalogMap?.[id] || id
        satelliteColorMap[satName] = color

        console.log(`✔ Highlight: ${satName} → ${color}`)
      })

      // Trigger coloring and selection logic
      processSatelliteSelection()
      console.log(`✅ Satellite highlights applied from: ${path}`)
    })
    .catch((e) => {
      console.error(`❌ Failed to load Satellite Highlight File at ${path}:`, e)
    })
}

function loadISLFile(path) {
  fetch(path)
    .then((res) => res.text())
    .then((content) => {
      // Clear old ISL links
      islData.links = []

      // Determine mode
      const isCatalog = path.toLowerCase().includes('catalog')
      const type = isCatalog ? 'catalog' : 'name'

      // in GUI/islUpload.js
      parseISLFile(content, type)
      console.log(`✅ Loaded ISL from: ${path} [mode=${type}]`)
    })
    .catch((e) => {
      console.error(`❌ Failed to load ISL file at ${path}:`, e)
    })
}

function loadShortestPathFile(path) {
  fetch(path)
    .then((res) => res.text())
    .then((content) => {
      // Parse and store the paths
      parseShortestPathFile(content)

      // Optional: trigger first render manually here, or wait for time simulation
      console.log(`✅ Shortest path file loaded: ${path}`)
    })
    .catch((e) => {
      console.error(`❌ Failed to load shortest path file: ${path}`, e)
    })
}

function loadGroundStationsFromFile(url) {
  fetch(url)
    .then((res) => res.text())
    .then((text) => loadGroundStationsFromText(text))
    .catch((e) => console.error('Error loading ground stations:', e))
}
