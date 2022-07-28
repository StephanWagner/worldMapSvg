#!/usr/bin/node

const fs = require("fs");
const zlib = require("zlib");

const config = require("./config.js");

// Map data
const data = fs.readFileSync(__dirname + "/map.svg", "utf8");

// Counters
let errorCount = 0;
let countryMapCount = 0;
let combinedMapCount = 0;
let worldMapCount = 0;

// Word map data
let worldFileContent = "";
let worldFileStrokeContent = "";
let worldMapViewBox = getMinMaxObj();

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
    // There are errors when moving, see KI | Kiribati
    if (config.combineMove.indexOf(id) !== -1) {
      combinePath = movePath(path, config.moveConstantX, 0);
    }
    combineCache[combineId].push(combinePath);
  }

  // Get viewBox
  const viewBox = getViewBox(path);

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

  worldFileStrokeContent +=
    '  <path data-map="' +
    id +
    '" stroke="#DDDDDD" stroke-width="' +
    config.strokeWidth +
    '" stroke-linecap="round" stroke-linejoin="round" d="' +
    path +
    '"/>';
  worldFileStrokeContent += "\n";

  // Count generated files
  countryMapCount++;

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
  combinedMapCount++;

  // Combined country map success message
  console.log("\x1b[33m", "✓ " + id);
}

// Generate world map file content
let worldMapFileContent = getSvgStart(worldMapViewBox);

let worldMapViewBoxStroke = worldMapViewBox;
worldMapViewBoxStroke.xMin -= config.strokeWidth / 2;
worldMapViewBoxStroke.yMin -= config.strokeWidth / 2;
worldMapViewBoxStroke.xMax += config.strokeWidth / 2;
worldMapViewBoxStroke.yMax += config.strokeWidth / 2;
let worldMapFileContentStroke = getSvgStart(worldMapViewBoxStroke);

worldMapFileContent += "\n";
worldMapFileContent += worldFileContent;

worldMapFileContentStroke += "\n";
worldMapFileContentStroke += worldFileStrokeContent;
worldMapFileContent += "\n";
worldMapFileContentStroke += worldFileContent;

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
    borderId = borderId.replace(/_[0-9]+_/, "");
    borderIdsData += " data-border" + (index + 1) + '="' + borderId + '"';
  });

  const borderPathSvg =
    "  <path" +
    borderIdsData +
    ' fill="none" stroke="#FFFFFF" stroke-width="0.05" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" d="' +
    borderPath +
    '"/>';

  worldMapFileContent += borderPathSvg;
  worldMapFileContent += "\n";

  worldMapFileContentStroke += borderPathSvg;
  worldMapFileContentStroke += "\n";
}

// Close world map file
worldMapFileContent += "</svg>";
worldMapFileContent += "\n";

worldMapFileContentStroke += "</svg>";
worldMapFileContentStroke += "\n";

// Write world map file
const wordMapFilename = __dirname + "/../maps/world.svg";
fs.writeFileSync(wordMapFilename, worldMapFileContent);

const wordMapFilenameStroke = __dirname + "/../maps/world-with-stroke.svg";
fs.writeFileSync(wordMapFilenameStroke, worldMapFileContentStroke);

// World map success messages
const fileSize = getFilesize(wordMapFilename);
const compressedFilesize = getCompressedFilesize(worldMapFileContent);

console.log(
  "\x1b[33m",
  "✓ World map (" + fileSize + ") (" + compressedFilesize + " compressed)"
);

worldMapCount++;

// Worls map with stroke success message
const fileSizeStroke = getFilesize(wordMapFilenameStroke);
const compressedFilesizeStroke = getCompressedFilesize(
  worldMapFileContentStroke
);

console.log(
  "\x1b[33m",
  "✓ World map with stroke (" +
    fileSizeStroke +
    ") (" +
    compressedFilesizeStroke +
    " compressed)"
);

worldMapCount++;

// Success messages
console.log("\x1b[32m", "✓ " + countryMapCount + " individual maps generated");
console.log("\x1b[32m", "✓ " + combinedMapCount + " combined maps generated");
console.log("\x1b[32m", "✓ " + worldMapCount + " world maps generated");

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

function getMinMaxObj() {
  return {
    xMin: 10000,
    xMax: -10000,
    yMin: 10000,
    yMax: -10000,
  };
}

// Calculate SVG viewBox
function getViewBox(d) {
  const paths = d.split(" ");

  let x = 0;
  let y = 0;
  let boundries = getMinMaxObj();

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
          x = parseFloat(values[0]);
          y = parseFloat(values[1]);
          break;

        case "H":
          x = parseFloat(values[0]);
          break;

        case "V":
          y = parseFloat(values[0]);
          break;

        case "l":
          x += parseFloat(values[0]);
          y += parseFloat(values[1]);
          break;

        case "h":
          x += parseFloat(values[0]);
          break;

        case "v":
          y += parseFloat(values[0]);
          break;
      }

      if (x < boundries.xMin) {
        boundries.xMin = x;
      }

      if (x > boundries.xMax) {
        boundries.xMax = x;
      }

      if (y < boundries.yMin) {
        boundries.yMin = y;
      }

      if (y > boundries.yMax) {
        boundries.yMax = y;
      }
    }
  });

  return boundries;
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
  const filesizeInBytes = stats.size;
  return getFilesizeWithUnits(filesizeInBytes);
}

// Get compressed filesize
function getCompressedFilesize(data) {
  const zippedFileData = zlib.gzipSync(data);
  const filesize = zippedFileData.length;
  return getFilesizeWithUnits(filesize);
}

// Get filesize with Units
function getFilesizeWithUnits(filesizeInBytes) {
  const filesizeInKilobytes = filesizeInBytes / 1024;

  // Return in MB
  if (filesizeInKilobytes > 1024) {
    const filesizeInMegabytes = filesizeInBytes / 1024;
    return filesizeInMegabytes.toFixed(2) + " MB";
  }

  // Return in KB
  return filesizeInKilobytes.toFixed(2) + " KB";
}
