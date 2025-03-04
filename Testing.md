# 📌 Satellite Visualization System - Testing Guide

This guide explains how to **test all features of the satellite visualization system**, including:

- **What you can do**
- **Where to find the correct files**
- **How to use each feature step-by-step**

## 🔹 Important: Upload a TLE File Before You Start

Before using any feature, you **must upload a TLE (Two-Line Element) file**. Without a TLE file, **satellites will not appear** in the system.

### How to Upload a TLE File

1. **Go to "Upload TLE File"** in the software.
2. **Navigate to the correct folder** (see locations below).
3. **Select the correct TLE file and upload it**.
4. The system will **load and display satellites**.

### 📂 TLE File Locations:

- **Select Satellite Testing** → `Testing/SelectSatellite_Testing/Starlink_20231116160005.txt`
- **ISL Testing** → `Testing/InterSatellite_Link_Testing/Starlink_70_20231030160003.txt`
- **Multi-TLE Testing** → `Testing/MultiTLE_Testing/Starlink_20231101000000.txt`, `Testing/MultiTLE_Testing/Starlink_20231102000000.txt`
- **Shortest Path Testing** → `Testing/Shortest_Path_Testing/Starlink_70_20231030160003.txt`

## 🔹 Time Settings (Required for All Features)

Time settings control **how satellites move** and **how features update**.

- **Start from Present Time** → Uses your **current system time**.
- **Time Wrap** → Controls how fast the simulation runs.
  - **Higher values = Faster movement**
  - **Lower values = Slower movement**
  - **0 = Time stops**  
    📌 **Before testing any feature, configure these settings!**

# 🚀 Features You Can Test and How to Use Them

Once you've uploaded a TLE file, you can test the following features:

## 1️⃣ Select and Highlight Specific Satellites

📌 **What This Does**: Allows users to **select satellites** from a TLE file and **highlight them in specific colors**.

### 📂 Folder:

`Testing/SelectSatellite_Testing/`

### 📄 Files Needed:

- **TLE File** → `Starlink_20231116160005.txt`
- **Selection by Name File** → `SelectTLE_Testing_ByName.txt`
- **Selection by Catalog File** → `SelectTLE_Testing_ByCatalog.txt`

### **File Format:**

#### 📌 Catalog Number Format (`SelectTLE_Testing_ByCatalog.txt`)

Each row contains: <catalog_number>, , ,

- `<catalog_number>` → The catalog number of the satellite.
- `<R>, <G>, <B>` → The RGB values for highlighting the satellite.

#### 📌 Name Format (`SelectTLE_Testing_ByName.txt`)

Each row contains: <satellite_name>, , ,

- `<satellite_name>` → The name of the satellite.
- `<R>, <G>, <B>` → The RGB values for highlighting the satellite.

### How to Use This Feature:

1. **Go to the "Upload TLE File" section** and upload `Testing/SelectSatellite_Testing/Starlink_20231116160005.txt`.
2. **Navigate to "Select Satellites"** in the GUI.
3. **Upload a Selection File**:
   - **By Name** → Upload `SelectTLE_Testing_ByName.txt`
   - **By Catalog Number** → Upload `SelectTLE_Testing_ByCatalog.txt`
4. **Selected satellites will be highlighted** in the assigned colors.
5. To **show or hide orbit lines**, go to **Display Settings** and toggle **Orbit Lines**.
6. **Use Time Wrap** to observe satellite movement.

✅ **Expected Outcome**:

- The selected satellites appear in the correct colors.
- The system properly highlights the chosen satellites.

## 2️⃣ View and Test Inter-Satellite Links (ISL)

📌 **What This Does**: Connects satellites with **lines that represent communication links**.

### 📂 Folder:

`Testing/InterSatellite_Link_Testing/`

### 📄 Files Needed:

- **TLE File** → `Starlink_70_20231030160003.txt`
- **ISL by Name File** → `ISL_ByName_Testing.txt`
- **ISL by Catalog File** → `ISL_ByCatalog_Testing.txt`

### **File Format:**

#### 📌 ISL by Name (`ISL_ByName_Testing.txt`)

Each row contains: <satellite_name_1>, <satellite_name_2>

- `<satellite_name_1>` → First satellite in the ISL connection.
- `<satellite_name_2>` → Second satellite in the ISL connection.

#### 📌 ISL by Catalog Number (`ISL_ByCatalog_Testing.txt`)

Each row contains:

- `<catalog_number_1>` → First satellite in the ISL connection.
- `<catalog_number_2>` → Second satellite in the ISL connection.

### How to Use This Feature:

1. **Upload a TLE file**: `Testing/InterSatellite_Link_Testing/Starlink_70_20231030160003.txt`
2. **Go to "Upload ISL File"** and select:
   - **By Name** → Upload `ISL_ByName_Testing.txt`
   - **By Catalog Number** → Upload `ISL_ByCatalog_Testing.txt`
3. **Lines appear between satellites** based on the file.
4. **Use Time Wrap** to observe changes over time.

✅ **Expected Outcome**:

- ISL connections between satellites are displayed.

## 3️⃣ Multi-TLE File Handling

📌 **What This Does**: Supports uploading multiple TLE files for satellites.

- Files are sorted by **epoch time** and dynamically switched during the simulation based on the current time.
- **The first epoch time in the satellite data is always used as the starting time for each update.**

### 📂 Folder:

`Testing/MultiTLE_Testing/`

### 📄 Files Needed:

- `Starlink_20231101000000.txt`
- `Starlink_20231102000000.txt`

### **Steps**:

1. **Go to the folder:** `Testing/MultiTLE_Testing/`
2. **Upload multiple TLE files via the Insert TLE List option.**
   - Files should have timestamps in their names, e.g., `Starlink_20231101000000.txt`.
3. **Enable the Start from Present Time toggle or keep it off:**
   - **Enabled** → The simulation uses the current system time.
   - **Disabled** → The simulation uses the epoch time of the first satellite in the file.
4. **Adjust the simulation time using the Time Wrap feature:**
   - Increase/decrease warp size to observe dynamic switching.

✅ **Expected Outcome**:

- **TLE files are sorted correctly by timestamp.**
- **The system updates and shifts files based on time progression.**

## 📝 Final Checklist

| Feature            | Folder & File Locations                | Expected Outcome              |
| ------------------ | -------------------------------------- | ----------------------------- |
| Upload TLE         | `Testing/SelectSatellite_Testing/`     | Satellites appear             |
| Select Satellites  | `Testing/SelectSatellite_Testing/`     | Highlighted satellites        |
| View ISLs          | `Testing/InterSatellite_Link_Testing/` | Lines between satellites      |
| Multi-TLE Handling | `Testing/MultiTLE_Testing/`            | Satellites update dynamically |

---
