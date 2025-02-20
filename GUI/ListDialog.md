# ListDialog.js Documentation

## Overview

The `ListDialog.js` file manages the uploading, processing, and switching of TLE (Two-Line Element) files. It provides an interface for uploading TLE files and integrates with the satellite visualization system to dynamically process and display satellite data.

---

## Features

1. **File Upload Management**

   - Supports uploading multiple TLE files simultaneously.
   - Parses filenames to extract timestamps and sorts them chronologically.

2. **Satellite Data Processing**

   - Extracts satellite information, catalog numbers, and epochs from TLE data.
   - Dynamically creates and manages satellite objects for visualization.

3. **GUI Integration**

   - Displays uploaded file details in the GUI.
   - Enables seamless file selection, processing, and visualization.

4. **Time-based File Switching**
   - Automatically switches to the appropriate TLE file during simulation based on the current time.

---

## GUI Controls

### Purpose

Provide an intuitive interface for users to interact with TLE file uploads and satellite data.

### Elements

- **`ListEnter`**
  - Button for confirming and processing uploaded TLE files.
- **`ListCancel`**
  - Button for canceling the file input dialog.
- **`TLEinput`**
  - Textarea for displaying uploaded TLE file names.
- **`TLEFileInput`**
  - File input element for uploading multiple TLE files.

---

## Variables

```javascript
const ListEnter = document.getElementById('TLEListEnter')
const ListCancel = document.getElementById('TLEListCancel')
const TLEinput = document.getElementById('TLEListinput')
const TLEFileInput = document.getElementById('TLEFileInput') // File input element

const satelliteCatalogMap = {} // A map storing catalog numbers mapped to satellite names.
let tleFiles = [] // Array to store uploaded TLE files and their data.
```
