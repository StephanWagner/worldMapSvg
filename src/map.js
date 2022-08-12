#!/usr/bin/node

const fs = require("fs");
const zlib = require("zlib");

const config = require("./config.js");

// Debugging
const debug = function (id) {
  return false;
  return id != "CO";
};

// Map data
const mapData = fs.readFileSync(__dirname + "/map.svg", "utf8");

// Counters
let errorCount = 0;
let countryMapCount = 0;
let combinedMapCount = 0;
let worldMapCount = 0;

// Data
let data = {};

// Word map data
let worldFileContent = "";
let worldFileStrokeContent = "";
let worldMapViewBox = getMinMaxObj();

// Cache to combine maps
let combineCache = {};

// Get ignore paths
let ignorePaths = {};
const regexIgnorePaths =
  /<path id="map-ignore_x5F_([A-Z0-9-]+)[_A-Za-z0-9]*" fill="#[A-Za-z0-9]+" d="([A-Za-z0-9,.\r\n\t\s-]+)"/gu;

for (const match of mapData.matchAll(regexIgnorePaths)) {
  // Get the id
  const id = getCleanId(match[1]);

  // Clean up path
  let path = match[2];
  path = cleanUpPath(path);

  // Cache path
  ignorePaths[id] = path;
}

// Regular expression to match country paths
const regexPaths =
  /<path id="map-path_x5F_([A-Z0-9-]+)[_A-Za-z0-9]*" fill="[A-Za-z0-9#]+" d="([A-Za-z0-9,.\r\n\t\s-]+)"/gu;

// Process country map paths
for (const match of mapData.matchAll(regexPaths)) {
  // Get the id
  const id = getCleanId(match[1]);

  // Debug
  if (debug(id)) {
    continue;
  }

  // Clean up path
  let path = match[2];
  path = cleanUpPath(path);

  // Cache
  if (!data[id]) {
    data[id] = {
      paths: [],
      polylines: []
    };
  }
  data[id].paths.push(path);

  // Cache combine paths
  if (config.combine[id]) {
    const combineId = config.combine[id];
    if (!combineCache[combineId]) {
      combineCache[combineId] = [];
    }
    let combinePath = path;

    if (config.combineMove.indexOf(id) !== -1) {
      combinePath = movePath(path, config.moveConstantX, 0);
    }
    combineCache[combineId].push(combinePath);
  }
}

// Regular expression to match border polylines
// We use borders first, so they are sorted first
const regexBorderPolylines =
  /<polyline id="map-border-([a-z]+)-([a-z]+)_x5F_([A-Za-z0-9|_]+)" fill="none" stroke="#[A-Za-z0-9]+" stroke-width="[0-9\.]+" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points="([A-Za-z0-9,.\r\n\t\s-]+)"/gu;

// Process country map polylines
for (const match of mapData.matchAll(regexBorderPolylines)) {
  // const borderType = match[1];
  // const borderSize = match[2];
  const polyline = cleanUpPolyline(match[4]);
  const borderIdsStr = match[3];
  const borderIds = borderIdsStr.split("_x7C_");


  for (let id of borderIds) {
    id = getCleanId(id);

    if (id == 'XX') {
      continue;
    }

    // Debug
    if (debug(id)) {
      continue;
    }

    // Cache
    if (!data[id]) {
      data[id] = {
        paths: [],
        polylines: []
      };
    }
    data[id].polylines.push(polyline);

    //borderIdsData += " data-border" + (index + 1) + '="' + borderId + '"';
  }

  // const borderPathSvg =
  //   "  <path" +
  //   borderIdsData +
  //   ' fill="none" stroke="#FFFFFF" stroke-width="' +
  //   config.borderSizes[borderSize] +
  //   '" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" d="' +
  //   borderPath +
  //   '"/>';

  // worldMapFileContent += borderPathSvg;
  // worldMapFileContent += "\n";

  // worldMapFileContentStroke += borderPathSvg;
  // worldMapFileContentStroke += "\n";
}

// Regular expression to match country polylines
const regexPolylines =
  /<polyline id="map-polyline_x5F_([A-Z0-9-]+)[_A-Za-z0-9]*" fill="none" stroke="#[A-Za-z0-9]+" stroke-width="[0-9\.]+" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points="([A-Za-z0-9,.\r\n\t\s-]+)"/gu;

// Process country map polylines
for (const match of mapData.matchAll(regexPolylines)) {
  // Get the id
  const id = getCleanId(match[1]);

  // Debug
  if (debug(id)) {
    continue;
  }

  // Clean up path
  let polyline = match[2];
  polyline = cleanUpPolyline(polyline);

  // Cache
  if (!data[id]) {
    data[id] = {
      paths: [],
      polylines: []
    };
  }
  data[id].polylines.push(polyline);
}

for (var id in data) {
  id = getCleanId(id);

  const countryData = data[id];

  // Debug
  if (debug(id)) {
    continue;
  }

  if (countryData.polylines.length) {

    let polylinesData = [];

    // Sort polylines
    for (let polyline of countryData.polylines) {
      let pSplit = polyline.split(" ");

      const pFirstSplit = pSplit[0].split(",");
      let pFirst = {
        x: pFirstSplit[0],
        y: pFirstSplit[1],
      };

      const pLastSplit = pSplit[pSplit.length - 1].split(",");
      let pLast = {
        x: pLastSplit[0],
        y: pLastSplit[1],
      };

      if (float(pFirst.x) > float(pLast.x)) {
        pSplit = pSplit.reverse();
        const pFirstC = pFirst;
        pFirst = pLast;
        pLast = pFirstC;
      }

      polylinesData.push({
        first: pFirst,
        last: pLast,
        points: pSplit,
      });
    }

    let index = 0;
    let sortedPolylinesData = [];
    let lastPolyline = null;
    const unsortedPolylinesData = polylinesData;

    while (unsortedPolylinesData.length && index < 20) {
      if (index == 0) {
        sortedPolylinesData.push(unsortedPolylinesData[0]);
        lastPolyline = unsortedPolylinesData[0];
        unsortedPolylinesData.shift();
      } else {
        for (let [index, unsortedPolyline] of unsortedPolylinesData.entries()) {
          if (
            (lastPolyline.last.x == unsortedPolyline.first.x &&
              lastPolyline.last.y == unsortedPolyline.first.y) ||
            (lastPolyline.last.x == unsortedPolyline.last.x &&
              lastPolyline.last.y == unsortedPolyline.last.y)
          ) {
            if (
              lastPolyline.last.x == unsortedPolyline.last.x &&
              lastPolyline.last.y == unsortedPolyline.last.y
            ) {
              unsortedPolyline.points = unsortedPolyline.points.reverse();
              const upFirstC = unsortedPolyline.first;
              unsortedPolyline.first = unsortedPolyline.last;
              unsortedPolyline.last = upFirstC;
            }
            sortedPolylinesData.push(unsortedPolyline);
            lastPolyline = unsortedPolyline;
            unsortedPolylinesData.splice(index, 1);
            break;
          }
        }
      }
      index++;
    }

    if (unsortedPolylinesData.length) {
      console.log("\x1b[31m", "✗ Error: Inconsistent borders detected (" + id + ")");
    }

    // Generate path
    // countryData.polylinesData.shift();

    let path = "";

    for (let [index, polylineData] of sortedPolylinesData.entries()) {
      if (index == 0) {
        path += "M" + polylineData.first.x + "," + polylineData.first.y;
      }

      let lastPoint;

      for (let [index2, point] of polylineData.points.entries()) {
        if (index2 == 0) {
          lastPoint = point;
          continue;
        }

        const pointSplit = point.split(",");
        const x = float(pointSplit[0]);
        const y = float(pointSplit[1]);

        const lastPointSplit = lastPoint.split(",");
        const lastX = float(lastPointSplit[0]);
        const lastY = float(lastPointSplit[1]);

        const diffX = float(x - lastX);
        const diffY = float(y - lastY);

        // Line
        if (diffX != 0 && diffY != 0) {
          path += "l" + diffX + "," + diffY;
        }

        // Horizontal line
        if (diffX != 0 && diffY == 0) {
          path += "h" + diffX;
        }

        // Vertical line
        if (diffX == 0 && diffY != 0) {
          path += "v" + diffY;
        }

        lastPoint = point;
      }
    }

    path +=
      "L" +
      sortedPolylinesData[0].first.x +
      "," +
      sortedPolylinesData[0].first.y +
      "z";

    path = path.replace(/,-/g, "-");

    if (!data[id]) {
      data[id] = {
        paths: [],
        polylines: [],
        polylinesData: [],
      };
    }
    data[id].paths.push(path);
  }

  path = data[id].paths.join(" ");

  // Add to combined
  if (config.combine[id]) {
    const combineId = config.combine[id];
    if (!combineCache[combineId]) {
      combineCache[combineId] = [];
    }
    let combinePath = path;

    if (config.combineMove.indexOf(id) !== -1) {
      combinePath = movePath(path, config.moveConstantX, 0);
    }
    combineCache[combineId].push(combinePath);
  }

  // Get viewBox
  const viewBox = getViewBox(path);

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

  // Get world map path
  if (config.ignoreWorldMap.indexOf(id) === -1) {
    let worldMapPath = path;

    if (ignorePaths[id]) {
      worldMapPath += " " + ignorePaths[id];
    }

    const includedViewBox = getViewBox(worldMapPath);

    // Update world map viewBox
    if (includedViewBox.xMin < worldMapViewBox.xMin) {
      worldMapViewBox.xMin = includedViewBox.xMin;
    }

    if (includedViewBox.xMax > worldMapViewBox.xMax) {
      worldMapViewBox.xMax = includedViewBox.xMax;
    }

    if (includedViewBox.yMin < worldMapViewBox.yMin) {
      worldMapViewBox.yMin = includedViewBox.yMin;
    }

    if (includedViewBox.yMax > worldMapViewBox.yMax) {
      worldMapViewBox.yMax = includedViewBox.yMax;
    }

    // Generate world file content
    worldFileContent +=
      '  <path data-map="' + id + '" d="' + worldMapPath + '"/>';
    worldFileContent += "\n";

    worldFileStrokeContent +=
      '  <path data-map="' +
      id +
      '" stroke="' +
      config.strokeColor +
      '" stroke-width="' +
      config.strokeWidth +
      '" stroke-linecap="round" stroke-linejoin="round" d="' +
      worldMapPath +
      '"/>';
    worldFileStrokeContent += "\n";
  }

  // Count generated files
  countryMapCount++;

  // Country map success message
  console.log("\x1b[36m", "✓ " + id);
}

// Generate combined paths
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
  /<path id="border-([a-z]+)-([a-z]+)_x5F_([A-Za-z0-9|_]+)" fill="none" stroke="#[A-Za-z0-9]+" stroke-width="[0-9\.]+" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" d="([A-Za-z0-9,.\r\n\t\s-]+)"/gu;

// // Process border paths
// for (const match of mapData.matchAll(regexBorders)) {
//   const borderType = match[1];
//   const borderSize = match[2];
//   const borderPath = cleanUpPath(match[4]);
//   const borderIdsStr = match[3];
//   const borderIds = borderIdsStr.split("_x7C_");

//   let borderIdsData = "";
//   borderIds.forEach(function (borderId, index) {
//     borderId = getCleanId(borderId);
//     borderIdsData += " data-border" + (index + 1) + '="' + borderId + '"';
//   });

//   const borderPathSvg =
//     "  <path" +
//     borderIdsData +
//     ' fill="none" stroke="#FFFFFF" stroke-width="' +
//     config.borderSizes[borderSize] +
//     '" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" d="' +
//     borderPath +
//     '"/>';

//   worldMapFileContent += borderPathSvg;
//   worldMapFileContent += "\n";

//   worldMapFileContentStroke += borderPathSvg;
//   worldMapFileContentStroke += "\n";
// }

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

// Done message
const mapsDone = countryMapCount + "/" + config.totalMaps;
const mapsDonePercent = ((countryMapCount / config.totalMaps) * 100).toFixed(2);
console.log("\x1b[35m", "› " + mapsDone + " done (" + mapsDonePercent + "%)");

// Errors
if (errorCount > 0) {
  console.log("\x1b[31m", "✗ " + errorCount + " error: See log above");
}

// Float precision
function float(value) {
  return parseFloat(parseFloat(value).toFixed(config.decimals));
}

// Get the start of the SVG with viewBox data
function getSvgStart(viewBox) {
  const width = (viewBox.xMax - viewBox.xMin).toFixed(config.decimals);
  const height = (viewBox.yMax - viewBox.yMin).toFixed(config.decimals);

  let svgStart =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="{X} {Y} {W} {H}">';

  svgStart = svgStart.replace(/{X}/g, viewBox.xMin.toFixed(config.decimals));
  svgStart = svgStart.replace(/{Y}/g, viewBox.yMin.toFixed(config.decimals));
  svgStart = svgStart.replace(/{W}/g, width);
  svgStart = svgStart.replace(/{H}/g, height);
  return svgStart;
}

// Get a clean id
function getCleanId(id) {
  return id.replace(/_[0-9]+_/, "");
}

// Get an onject with the start min and max values
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
      values = values.replace(/,,/g, ",");

      if (values.substring(0, 1) === ",") {
        values = values.substring(1);
      }

      values = values.split(",");

      switch (cmd) {
        case "M":
        case "L":
          x = float(values[0]);
          y = float(values[1]);
          break;

        case "H":
          x = float(values[0]);
          break;

        case "V":
          y = float(values[0]);
          break;

        case "l":
          x += float(values[0]);
          y += float(values[1]);
          break;

        case "h":
          x += float(values[0]);
          break;

        case "v":
          y += float(values[0]);
          break;
      }

      if (x < boundries.xMin) {
        boundries.xMin = float(x);
      }

      if (x > boundries.xMax) {
        boundries.xMax = float(x);
      }

      if (y < boundries.yMin) {
        boundries.yMin = float(y);
      }

      if (y > boundries.yMax) {
        boundries.yMax = float(y);
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

// Clean up a polyline
function cleanUpPolyline(polyline) {
  polyline = polyline.replace(/  |\t|\r\n|\n|\r/gm, "").trim();
  return polyline;
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
          x =
            moveX !== 0
              ? (parseFloat(val[0]) + moveX).toFixed(config.decimals)
              : val[0];
          y =
            moveY !== 0
              ? (parseFloat(val[1]) + moveY).toFixed(config.decimals)
              : val[1];
          newPath += cmd + x + "," + y;
          break;

        case "H":
          x =
            moveX !== 0
              ? (parseFloat(val[0]) + moveX).toFixed(config.decimals)
              : val[0];
          newPath += cmd + x;
          break;

        case "V":
          y =
            moveY !== 0
              ? (parseFloat(val[0]) + moveY).toFixed(config.decimals)
              : val[0];
          newPath += cmd + y;
          break;

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
