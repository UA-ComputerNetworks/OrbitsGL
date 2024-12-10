// Initialize the LightstreamerClient to connect to the telemetry server
var lsClient = new LightstreamerClient(
  'https://push.lightstreamer.com',
  'ISSLIVE'
)

// Disable slowing down of the connection when dealing with large data
lsClient.connectionOptions.setSlowingEnabled(false)

// Object to store ISS telemetry data, including position (r) and velocity (v) in J2000 coordinates
var ISS = {
  osvIn: { r: [0.0, 0.0, 0.0], v: [0.0, 0.0, 0.0], ts: null }, // Input (raw) telemetry data
  osvProp: { r: [0.0, 0.0, 0.0], v: [0.0, 0.0, 0.0], ts: null }, // Propagated (calculated) telemetry
  kepler: { a: 0 }, // Orbital parameters (e.g., semi-major axis 'a')
  r_ECEF: [0, 0, 0], // Position in Earth-Centered Earth-Fixed coordinates
  v_ECEF: [0, 0, 0], // Velocity in ECEF coordinates
  alt: 0, // Altitude
  lon: 0, // Longitude
  lat: 0, // Latitude
}

// Example telemetry data to initialize ISS.osvIn with position (r) and velocity (v) vectors
ISS.osvIn.r = [-4228282.012, 4080666.827, -3421191.697] // X, Y, Z positions in meters
ISS.osvIn.v = [-1904.50887, -5821.53009, -4594.77013] // X, Y, Z velocities in m/s
ISS.osvIn.ts = new Date('November 20, 2021 19:28:04') // Timestamp of the telemetry data

// Object to store output telemetry data (e.g., from subscription updates)
var osvOut = {}
osvOut.r = [-4228282.012, 4080666.827, -3421191.697] // X, Y, Z positions
osvOut.v = [-1904.50887, -5821.53009, -4594.77013] // X, Y, Z velocities
osvOut.ts = new Date('November 20, 2021 19:28:04') // Timestamp of the data
osvOut.numLoaded = 0 // Counter to track loaded telemetry values

// Subscription for ISS telemetry data (position and velocity)
const sub = new Subscription(
  'MERGE',
  [
    'USLAB000032',
    'USLAB000033',
    'USLAB000034',
    'USLAB000035',
    'USLAB000036',
    'USLAB000037',
  ],
  ['TimeStamp', 'Value']
)

// Subscription for time updates (optional - for simulation time control)
const timeSub = new Subscription('MERGE', 'TIME_000001', [
  'TimeStamp',
  'Value',
  'Status.Class',
  'Status.Indicator',
])

// Subscribe to the data streams
lsClient.subscribe(sub)
lsClient.subscribe(timeSub)
lsClient.connect()
