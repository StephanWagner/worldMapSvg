#!/usr/bin/node

const fs = require("fs");

const config = require("./config.js");

// Map data
const data = fs.readFileSync(__dirname + "/map.svg", "utf8");

// Counters
let errorCount = 0;
let countryCount = 0;
let combinedCount = 0;
let worldCount = 0;
let borderCount = 0;

// Word map data
let worldFileContent = "";
let worldMapViewBox = {
  xMin: 10000,
  xMax: -10000,
  yMin: 10000,
  yMax: -10000,
};

// Cache to combine maps
let combineCache = {};

// Regular expression to match country paths
const regex =
  /<path id="map_x5F_([A-Z0-9-]+)[_A-Za-z0-9]*" d="([A-Za-z0-9,.\r\n\t\s-]+)"/gu;

// Process country map paths
for (const match of data.matchAll(regex)) {
  // Get the id
  const id = match[1];

  // Debug
  // if (
  //   id != "KI" &&
  //   id != "KI-G" &&
  //   id != "KI-L" &&
  //   id != "KI-P"
  // ) {
  //   continue;
  // }

  // Clean up path
  let path = match[2];
  path = cleanUpPath(path);

  // Cache combine paths
  if (config.combine[id]) {
    const combineId = config.combine[id];
    if (!combineCache[combineId]) {
      combineCache[combineId] = [];
    }
    let combinePath = path;

    // TODO
    // There are errors when moving, so KI | Kiribati
    if (config.combineMove.indexOf(id) !== -1) {
      combinePath = movePath(path, config.moveConstantX, 0);
    }
    combineCache[combineId].push(combinePath);
  }

  // Get viewBox
  var viewBox = getViewBox(path);

  // Update world map viewBox
  if (viewBox.xMin < worldMapViewBox.xMin) {
    worldMapViewBox.xMin = viewBox.xMin;
  }

  if (viewBox.xMax > worldMapViewBox.xMax) {
    worldMapViewBox.xMax = viewBox.xMax;
  }

  if (viewBox.yMin < worldMapViewBox.yMin) {
    worldMapViewBox.yMin = viewBox.yMin;
  }

  if (viewBox.yMax > worldMapViewBox.yMax) {
    worldMapViewBox.yMax = viewBox.yMax;
  }

  // Generate country file content
  let countryFileContent = getSvgStart(viewBox);
  countryFileContent += "\n";
  countryFileContent += '  <path d="' + path + '"/>';
  countryFileContent += "\n";
  countryFileContent += "</svg>";
  countryFileContent += "\n";

  // Write country file
  fs.writeFileSync(
    __dirname + "/../maps/countries/" + id + ".svg",
    countryFileContent
  );

  // Generate world file content
  worldFileContent += '  <path data-map="' + id + '" d="' + path + '"/>';
  worldFileContent += "\n";

  // Count generated files
  countryCount++;

  // Country map success message
  console.log("\x1b[36m", "✓ " + id);
}

// Generate combined maps

for (const id in combineCache) {
  const path = combineCache[id].join(" ");
  const viewBox = getViewBox(path);

  let combinedFileContent = getSvgStart(viewBox);
  combinedFileContent += "\n";
  combinedFileContent += '  <path d="' + path + '"/>';
  combinedFileContent += "\n";
  combinedFileContent += "</svg>";
  combinedFileContent += "\n";

  // Write country file
  fs.writeFileSync(
    __dirname + "/../maps/countries/" + id + ".svg",
    combinedFileContent
  );

  // Count generated files
  combinedCount++;

  // Combined country map success message
  console.log("\x1b[33m", "✓ " + id);
}

// Generate world map file content
let worldMapFileContent = getSvgStart(worldMapViewBox);
worldMapFileContent += "\n";
worldMapFileContent += worldFileContent;

// Regular expression to match border paths
const regexBorders =
  /<path id="border_x5F_([A-Za-z0-9|_]+)" fill="none" stroke="#[A-Za-z0-9]+" stroke-width="[0-9\.]+" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" d="([A-Za-z0-9,.\r\n\t\s-]+)"/gu;

// Process border paths
for (const match of data.matchAll(regexBorders)) {
  const borderPath = cleanUpPath(match[2]);
  const borderIdsStr = match[1];
  const borderIds = borderIdsStr.split("_x7C_");

  let borderIdsData = "";
  borderIds.forEach(function (borderId, index) {
    borderIdsData += " data-border" + (index + 1) + '="' + borderId + '"';
  });

  worldMapFileContent +=
    "  <path" +
    borderIdsData +
    ' fill="none" stroke="#FFFFFF" stroke-width="0.05" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" d="' +
    borderPath +
    '"/>';
  worldMapFileContent += "\n";

  borderCount++;
}

// Close world map file
worldMapFileContent += "</svg>";
worldMapFileContent += "\n";

// Write world map file
const wordMapFilename = __dirname + "/../maps/world.svg";
fs.writeFileSync(wordMapFilename, worldMapFileContent);

// World map success messages
var fileSize = getFilesize(wordMapFilename);
console.log("\x1b[33m", "✓ World map (" + fileSize + ")");

worldCount++;

// Success messages
console.log("\x1b[32m", "✓ " + countryCount + " individual maps generated");
console.log("\x1b[32m", "✓ " + combinedCount + " combined maps generated");
console.log("\x1b[32m", "✓ " + worldCount + " world maps generated");
console.log("\x1b[32m", "✓ " + borderCount + " borders added to world map");

// Errors
if (errorCount > 0) {
  console.log("\x1b[31m", "✗ " + errorCount + " error: See log above");
}

// Get the start of the SVG with viewBox data
function getSvgStart(viewBox) {
  const width = (viewBox.xMax - viewBox.xMin).toFixed(3);
  const height = (viewBox.yMax - viewBox.yMin).toFixed(3);

  let svgStart =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="{X} {Y} {W} {H}">';

  svgStart = svgStart.replace(/{X}/g, viewBox.xMin.toFixed(3));
  svgStart = svgStart.replace(/{Y}/g, viewBox.yMin.toFixed(3));
  svgStart = svgStart.replace(/{W}/g, width);
  svgStart = svgStart.replace(/{H}/g, height);
  return svgStart;
}

// Calculate SVG viewBox
function getViewBox(d) {
  const paths = d.split(" ");

  let xCur = 0;
  let yCur = 0;
  let xMin = 10000;
  let xMax = -10000;
  let yMin = 10000;
  let yMax = -10000;

  const regex = /([A-Za-z]+)([0-9-.,]+)/g;

  paths.forEach(function (path) {
    for (const match of path.matchAll(regex)) {
      const cmd = match[1];
      let values = match[2];

      values = values.replace(/-/g, ",-");

      if (values.substring(0, 1) === ",") {
        values = values.substring(1);
      }
      values = values.split(",");

      switch (cmd) {
        case "M":
        case "L":
          xCur = parseFloat(values[0]);
          yCur = parseFloat(values[1]);
          break;

        case "H":
          xCur = parseFloat(values[0]);
          break;

        case "V":
          yCur = parseFloat(values[0]);
          break;

        case "l":
          xCur += parseFloat(values[0]);
          yCur += parseFloat(values[1]);
          break;

        case "h":
          xCur += parseFloat(values[0]);
          break;

        case "v":
          yCur += parseFloat(values[0]);
          break;
      }

      if (xCur < xMin) {
        xMin = xCur;
      }

      if (xCur > xMax) {
        xMax = xCur;
      }

      if (yCur < yMin) {
        yMin = yCur;
      }

      if (yCur > yMax) {
        yMax = yCur;
      }
    }
  });

  return {
    xMin,
    xMax,
    yMin,
    yMax,
  };
}

// Clean up a path
function cleanUpPath(path) {
  path = path.replace(/  |\t|\r\n|\n|\r/gm, "");

  const paths = path.split(" ");

  paths.forEach(function (pathItem) {
    // Detect empty paths
    if (
      pathItem.indexOf("l") === -1 &&
      pathItem.indexOf("h") === -1 &&
      pathItem.indexOf("v") === -1
    ) {
      console.log("\x1b[31m", "✗ Error: Empty path detected");
      errorCount++;
    }

    // Detect curves
    if (pathItem.indexOf("c") > -1) {
      console.log("\x1b[31m", "✗ Error: Curve in path detected");
      errorCount++;
    }
  });

  return path;
}

// Move a path in x direction
function movePath(path, moveX, moveY) {
  const paths = path.split(" ");

  const regex = /([A-Za-z]+)([0-9-.,]+)/g;

  const newPaths = [];

  paths.forEach(function (path) {
    let newPath = "";

    for (const match of path.matchAll(regex)) {
      const cmd = match[1];
      let val = match[2];

      val = val.replace(/-/g, ",-");

      if (val.substring(0, 1) === ",") {
        val = val.substring(1);
      }
      val = val.split(",");

      let x;
      let y;

      switch (cmd) {
        case "M":
        case "L":
          x = moveX !== 0 ? (parseFloat(val[0]) + moveX).toFixed(3) : val[0];
          y = moveY !== 0 ? (parseFloat(val[1]) + moveY).toFixed(3) : val[1];
          newPath += cmd + x + "," + y;
          break;

        case "H":
          x = moveX !== 0 ? (parseFloat(val[0]) + moveX).toFixed(3) : val[0];
          newPath += cmd + x;
          break;

        case "V":
          y = moveY !== 0 ? (parseFloat(val[0]) + moveY).toFixed(3) : val[0];
          newPath += cmd + y;

        case "l":
          newPath += cmd + val[0] + "," + val[1];
          break;

        case "v":
        case "h":
          newPath += cmd + val[0];
          break;
      }
    }

    newPath += "z";

    newPaths.push(newPath);
  });

  return newPaths.join(" ");
}

// Get filesize
function getFilesize(filename) {
  const stats = fs.statSync(filename);
  const fileSizeInBytes = stats.size;
  const fileSizeInKilobytes = fileSizeInBytes / 1024;
  return fileSizeInKilobytes.toFixed(2) + ' KB';
}
