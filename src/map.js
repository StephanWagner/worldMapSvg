#!/usr/bin/node

const fs = require("fs");
const zlib = require("zlib");
const util = require('util')

const config = require("./config.js");
const regionNames = require("./config-region-names.js");
const countries = require("./config-countries.js");

// Debugging
const debug = function (id) {
  return true;
  // return id == "ZA" || id == "LS";
};

// Map data
const mapData = fs.readFileSync(__dirname + "/map.svg", "utf8");

// Counters
let errorCount = 0;
let regionMapCount = 0;
let combinedMapCount = 0;
let worldMapCount = 0;

// Data
let data = {};

// World map data
let worldFileContent = "";
let worldFileStrokeContent = "";
let worldMapViewBox = getMinMaxObj();

// Cache to combine maps
let combineCache = {};

// Cache for borders
let borderCache = [];

// Errors when a border is a path
const regexBorderErrorPaths =
  /<path id="border(?:-\d+)?-([a-z]+)-([a-z]+):([A-Za-z0-9.-]+)"/gu;

for (const match of mapData.matchAll(regexBorderErrorPaths)) {
  log("✗ Error: Polyline as path detected (border" + (match[0] ? '-' + match[0] : '') + "-" + match[1] + "-" + match[2] + ":" + match[3] + ")", "red");
}

// Errors when a polygon border is a path
const regexPolygonBorderErrorPaths =
  /<path id="border-inset(?:-\d+)?-([a-z]+)-([a-z]+):([A-Za-z0-9.-]+)"/gu;

for (const match of mapData.matchAll(regexPolygonBorderErrorPaths)) {
  log("✗ Error: Polygon as path detected (border-inset" + (match[0] ? '-' + match[0] : '') + "-" + match[1] + "-" + match[2] + ":" + match[3] + ")", "red");
}

// Errors when a polyline is a path
const regexPolylineErrorPaths =
  /<path id="shore(?:-\d+)?:([A-Za-z0-9.-]+)"/gu;

for (const match of mapData.matchAll(regexPolylineErrorPaths)) {
  log("✗ Error: Polyline as path detected (shore" + (match[0] ? '-' + match[0] : '') + ":" + match[1] + ")", "red");
}

// Get ignore paths
const regexIgnorePaths =
  /<path id="ignore(?:-\d+)?:([A-Za-z0-9.-]+)" d="([A-Za-z0-9,.\r\n\t\s-]+)"/gu;

for (const match of mapData.matchAll(regexIgnorePaths)) {
  // Get the id
  const id = getCleanId(match[1]);

  // Debug
  if (!debug(id)) {
    continue;
  }

  // Clean up path
  let path = match[2];
  path = cleanUpPath(path, id);

  // Cache
  if (!data[id]) {
    data[id] = {
      paths: [],
      ignore: [],
      pathsCut: [],
      polylines: [],
      polygons: [],
    };
  }
  data[id].ignore.push(path);

  // Add to combined cache
  addPathsToCombineCache(id, path, true);
}

// Regular expression to match region paths
const regexPaths =
  /<path id="area(?:-\d+)?:([A-Za-z0-9.-]+)" d="([A-Za-z0-9,.\r\n\t\s-]+)"/gu;

// Process region map paths
for (const match of mapData.matchAll(regexPaths)) {

  // Get ids
  const idsStr = match[1];
  const ids = idsStr.split(".");

  // Clean up path
  let path = match[2];
  path = cleanUpPath(path, ids.join(','));

  for (let id of ids) {
    id = getCleanId(id);

    // Debug
    if (!debug(id)) {
      continue;
    }

    // Cache
    if (!data[id]) {
      data[id] = {
        paths: [],
        ignore: [],
        pathsCut: [],
        polylines: [],
        polygons: [],
      };
    }
    data[id].paths.push(path);

    // Add to combined cache
    addPathsToCombineCache(id, path);
  }
}

// Regular expression to match border polylines
// We use borders first, so they are sorted first
const regexBorderPolylines =
  /<polyline id="border(?:-\d+)?-([a-z]+)-([a-z]+):([A-Za-z0-9.-]+)" points="([A-Za-z0-9,.\r\n\t\s-]+)"/gu;

// Process region map polylines
for (const match of mapData.matchAll(regexBorderPolylines)) {
  const borderType = match[1];
  const borderSize = match[2];
  const polyline = cleanUpPolyline(match[4]);
  const idsStr = match[3];
  const ids = idsStr.split(".");
  let idsClean = [];

  for (let id of ids) {
    id = getCleanId(id);

    // Ignore temporary ids
    if (id == "XX") {
      continue;
    }

    // Debug
    if (!debug(id)) {
      continue;
    }

    // Cache
    if (!data[id]) {
      data[id] = {
        paths: [],
        ignore: [],
        pathsCut: [],
        polylines: [],
        polygons: [],
      };
    }
    data[id].polylines.push(polyline);

    // Cache ids
    idsClean.push(id);
  }

  if (idsClean.length) {
    borderCache.push({
      ids: idsClean,
      type: borderType,
      size: borderSize,
      polyline: polyline,
    });
  }
}

// Regular expression to match region polylines
const regexPolylines =
  /<polyline id="shore(?:-\d+)?:([A-Za-z0-9.-]+)" points="([A-Za-z0-9,.\r\n\t\s-]+)"/gu;

// Process region map polylines
for (const match of mapData.matchAll(regexPolylines)) {

  // Get ids
  const idsStr = match[1];
  const ids = idsStr.split(".");

  for (let id of ids) {
    id = getCleanId(id);

    // Debug
    if (!debug(id)) {
      continue;
    }

    // Clean up path
    let polyline = match[2];
    polyline = cleanUpPolyline(polyline);

    // Cache
    if (!data[id]) {
      data[id] = {
        paths: [],
        ignore: [],
        pathsCut: [],
        polylines: [],
        polygons: [],
      };
    }
    data[id].polylines.push(polyline);
  }
}

// Regular expression to match border polylines
// We use borders first, so they are sorted first
const regexPolygonBorderPolylines =
  /<polygon id="border-inset(?:-\d+)?-([a-z]+)-([a-z]+):([A-Za-z0-9.-]+)" points="([A-Za-z0-9,.\r\n\t\s-]+)"/gu;

// Process region map polylines
for (const match of mapData.matchAll(regexPolygonBorderPolylines)) {
  const borderType = match[1];
  const borderSize = match[2];
  const polygon = cleanUpPolyline(match[4]);
  const idsStr = match[3];
  const ids = idsStr.split(".");
  const id = getCleanId(ids[0]);
  const idCut = getCleanId(ids[1]);

  // Debug
  if (!debug(id)) {
    continue;
  }

  // Create path
  let path = '';
  let pSplit = polygon.split(" ");
  let index = 0;
  let lastPoint;

  for (const point of pSplit) {
    if (index == 0) {
      path += "M" + point;
      lastPoint = point;
      index++;
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

    index++;

    if (index == pSplit.length) {
      path += "z";
      break;
    }
  }

  // Cache
  if (!data[id]) {
    data[id] = {
      paths: [],
      ignore: [],
      pathsCut: [],
      polylines: [],
      polygons: [],
    };
  }
  data[id].paths.push(path);
  data[id].polygons.push(polygon);

  borderCache.push({
    ids: [idCut, id],
    type: borderType,
    size: borderSize,
    polygon: polygon,
    path: path,
  });

  // Take path away
  if (idCut != 'XX') {
    if (!data[idCut]) {
      data[idCut] = {
        paths: [],
        ignore: [],
        pathsCut: [],
        polylines: [],
        polygons: [],
      };
    }
    data[idCut].pathsCut.push(path);
  }

  // Add to combined cache
  addPathsToCombineCache(idCut, path, false, true);
}

// Lakes
const regexLakes =
  /<path id="lake(?:-\d+)?:([A-Za-z0-9.-]+)" d="([A-Za-z0-9,.\r\n\t\s-]+)"/gu;

// Process region map polylines
for (const match of mapData.matchAll(regexLakes)) {
  // Get ids
  const idsStr = match[1];
  const ids = idsStr.split(".");

  // Clean up path
  let path = match[2];
  path = cleanUpPath(path, ids.join(','));
  
  for (let id of ids) {
    id = getCleanId(id);

    // Debug
    if (!debug(id)) {
      continue;
    }

    // Cache
    if (!data[id]) {
      data[id] = {
        paths: [],
        ignore: [],
        pathsCut: [],
        polylines: [],
        polygons: [],
      };
    }
    data[id].pathsCut.push(path);

    // Add to combined cache
    addPathsToCombineCache(id, path, false, true);
  }
}


// Process data
for (var id in data) {
  id = getCleanId(id);

  const regionData = data[id];

  // Debug
  if (!debug(id)) {
    continue;
  }

  if (regionData.polylines.length) {
    let polylinesData = [];

    // Sort polylines
    for (let polyline of regionData.polylines) {
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

      // TODO
      // Make sure the largest borders are calculated FIRST from left to right

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

    // Group unsorted polylines

    const ungroupedPolylinesData = polylinesData;
    const maxWhile = 40;
    let indexWhile = 0;
    let groupFound = false;

    // Add first group
    const groupedPolylinesData = [{
      grouped: [
        ungroupedPolylinesData[0]
      ],
      sorted: []
    }];
    ungroupedPolylinesData.splice(0, 1);

    // Continue adding while ungrouped polylines exist
    while (ungroupedPolylinesData.length && indexWhile < maxWhile) {

      groupFound = false;

      // Loop through groups
      for (let [indexGPD, groupedPolylineGroup] of groupedPolylinesData.entries()) {

        // Loop through grouped polylines
        for (let [indexGP, groupedPolyline] of groupedPolylineGroup.grouped.entries()) {

          // Find matches in ungrouped polylines
          for (let [indexUP, ungroupedPolyline] of ungroupedPolylinesData.entries()) {
            if (
              (
                ungroupedPolyline.first.x == groupedPolyline.first.x &&
                ungroupedPolyline.first.y == groupedPolyline.first.y
              )
              ||
              (
                ungroupedPolyline.last.x == groupedPolyline.last.x &&
                ungroupedPolyline.last.y == groupedPolyline.last.y
              )
              ||
              (
                ungroupedPolyline.first.x == groupedPolyline.last.x &&
                ungroupedPolyline.first.y == groupedPolyline.last.y
              )
              ||
              (
                ungroupedPolyline.last.x == groupedPolyline.first.x &&
                ungroupedPolyline.last.y == groupedPolyline.first.y
              )
            ) {
              groupedPolylinesData[indexGPD].grouped.push(ungroupedPolyline);
              ungroupedPolylinesData.splice(indexUP, 1);
              groupFound = true;
              break;
            }
          }

          // Abort if match found
          if (groupFound) {
            break;
          }
        }

        // Abort if match found
        if (groupFound) {
          break;
        }
      }

      // Add new group if none found
      if (!groupFound) {
        groupedPolylinesData.push({
          grouped: [
            ungroupedPolylinesData[0]
          ],
          sorted: []
        });
        ungroupedPolylinesData.splice(0, 1);
      }

      // Savegard
      indexWhile++;
    }

    // Error
    if (ungroupedPolylinesData.length) {
      log("✗ Error: Inconsistent borders or polylines detected (" + id + ")", "red");
      errorCount++;
    }

    // Sort grouped polylines

    indexWhile = 0;

    // Loop through groups
    for (let [indexGPD, groupedPolylineGroup] of groupedPolylinesData.entries()) {

      // Add first sorted
      groupedPolylinesData[indexGPD].sorted.push(
        groupedPolylineGroup.grouped[0]
      );
      groupedPolylineGroup.lastPolyline = groupedPolylineGroup.grouped[0];
      groupedPolylineGroup.grouped.splice(0, 1);

      // Sort data while unsorted polylines exist
      while (groupedPolylineGroup.grouped.length && indexWhile < maxWhile) {

        // Find matches in unsorted polylines
        for (let [indexUP, unsortedPolyline] of groupedPolylineGroup.grouped.entries()) {

          if (
            (
              groupedPolylineGroup.lastPolyline.last.x == unsortedPolyline.first.x &&
              groupedPolylineGroup.lastPolyline.last.y == unsortedPolyline.first.y
            )
            ||
            (
              groupedPolylineGroup.lastPolyline.last.x == unsortedPolyline.last.x &&
              groupedPolylineGroup.lastPolyline.last.y == unsortedPolyline.last.y
            )
          ) {
            if (
              (
                groupedPolylineGroup.lastPolyline.last.x == unsortedPolyline.last.x &&
                groupedPolylineGroup.lastPolyline.last.y == unsortedPolyline.last.y
              )
            ) {
              unsortedPolyline.points = unsortedPolyline.points.reverse();

              const upFirstCache = unsortedPolyline.first;
              unsortedPolyline.first = unsortedPolyline.last;
              unsortedPolyline.last = upFirstCache;
            }

            groupedPolylinesData[indexGPD].sorted.push(
              unsortedPolyline
            );
            groupedPolylinesData[indexGPD].lastPolyline = unsortedPolyline;
            groupedPolylinesData[indexGPD].grouped.splice(indexUP, 1);
          }
        }

        indexWhile++;
      }

      // Error
      if (groupedPolylineGroup.grouped.length) {
        log("✗ Error: Inconsistent borders or polylines detected (" + id + ")", "red");
        errorCount++;
      }
    }

    // Generate paths

    // Loop through groups
    for (let [indexGPD, groupedPolylineGroup] of groupedPolylinesData.entries()) {

      let path = "";

      for (let [index, sortedPolyline] of groupedPolylineGroup.sorted.entries()) {

        if (index == 0) {
          path += "M" + sortedPolyline.first.x + "," + sortedPolyline.first.y;
        }

        let lastPoint;

        for (let [index2, point] of sortedPolyline.points.entries()) {
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

      // Close path
      path += "z";

      if (!data[id]) {
        data[id] = {
          paths: [],
          ignore: [],
          pathsCut: [],
          polylines: [],
          polygons: [],
        };
      }
      data[id].paths.push(path);

      // Add to combined cache
      addPathsToCombineCache(id, path);
    }
  }

  path = data[id].paths.join(" ");

  if (data[id].pathsCut.length) {
    path += " " + data[id].pathsCut.join(" ");
  }

  if (config.ignoreFile.indexOf(id) === -1) {
    // Get viewBox
    const viewBox = getViewBox(path);

    // Generate region file content
    let regionFileContent = getSvgStart(viewBox);
    regionFileContent += "\n";
    regionFileContent += '  <path' + (data[id].pathsCut.length ? ' fill-rule="evenodd"' : '') + ' d="' + path + '"/>';
    regionFileContent += "\n";
    regionFileContent += "</svg>";
    regionFileContent += "\n";

    // Write region file
    fs.writeFileSync(
      __dirname + "/../maps/regions/" + getFilename(id),
      regionFileContent
    );
  }

  // Get world map path
  if (
    config.ignoreWorldMap.indexOf(id) === -1
  ) {
    let worldMapPath = path;

    if (data[id].ignore.length) {
      for (const ignorePath of data[id].ignore) {
        worldMapPath += " " + ignorePath;
      }
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
      '  <path data-id="' + id + '" data-country="' + (countries[id] ? countries[id] : id) + '"' + (regionNames[id] ? ' data-name="' + regionNames[id] + '"' : '') + (data[id].pathsCut.length ? ' fill-rule="evenodd"' : '') + ' d="' + worldMapPath + '"/>';
    worldFileContent += "\n";

    worldFileStrokeContent +=
      '  <path data-id="' +
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
  regionMapCount++;
}

// Generate combined paths
for (const id in combineCache) {
  let path = combineCache[id].paths.join(" ");
  let coloredPath = combineCache[id].coloredPaths.join(" ");

  if (combineCache[id].pathsCut && combineCache[id].pathsCut.length) {
    if (combineCache[id].hasEvenOdd) {
      path += ' ' + combineCache[id].pathsCut.join(" ");
    }

    if (combineCache[id].hasEvenOddColor) {
      coloredPath += ' ' + combineCache[id].pathsCut.join(" ");
    }
  }

  // Get viewbox
  let viewBox = getViewBox(path);

  if (coloredPath) {
    const combinedPath = path + " " + coloredPath;
    viewBox = getViewBox(combinedPath);
  }

  // Create file content
  let combinedFileContent = getSvgStart(viewBox);
  combinedFileContent += "\n";
  combinedFileContent += '  <path' + (combineCache[id].hasEvenOdd ? ' fill-rule="evenodd"' : '') + ' d="' + path + '"/>';
  if (coloredPath) {
    combinedFileContent += "\n";
    combinedFileContent += '  <path ' + (combineCache[id].hasEvenOddColor ? ' fill-rule="evenodd"' : '') + ' fill="' + config.coloredPathColor + '" d="' + coloredPath + '"/>';
  }
  combinedFileContent += "\n";
  combinedFileContent += "</svg>";
  combinedFileContent += "\n";

  // Write region file
  fs.writeFileSync(
    __dirname + "/../maps/regions/" + getFilename(id),
    combinedFileContent
  );

  // Count generated files
  combinedMapCount++;
}

function getFilename(id) {
  let regionName = regionNames[id] ? regionNames[id] : '';

  if (regionName) {
    regionName = regionName.replace(/ /g, "_");
  }

  return id + (regionName ? '_' + regionName : '') + ".svg";
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

for (const border of borderCache) {
  let path = "";

  if (border.path) {
    path = border.path;
  } else {
    let pSplit = border.polyline.split(" ");

    // Improve compressed size
    // Make sure the border is calculated from left to right as this is most likely the way the region shore is calculated
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
    }

    let index = 0;
    let lastPoint;

    for (const point of pSplit) {
      if (index == 0) {
        path += "M" + point;
        lastPoint = point;
        index++;
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

      index++;
    }
  }

  let borderTypeAttr = "";

  if (border.type == "t") {
    borderTypeAttr += ' stroke-dasharray="0.06"';
  }

  const borderPathSvg =
    '  <path data-border1="' +
    border.ids[0] +
    '" data-border2="' +
    border.ids[1] +
    '" fill="none" stroke="#FFFFFF" stroke-width="' +
    config.borderSizes[border.size] +
    '" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"' +
    borderTypeAttr +
    ' d="' +
    path +
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
const worldMapFilename = __dirname + "/../maps/world.svg";
fs.writeFileSync(worldMapFilename, worldMapFileContent);

const worldMapFilenameStroke = __dirname + "/../maps/world-with-stroke.svg";
fs.writeFileSync(worldMapFilenameStroke, worldMapFileContentStroke);

// World map success messages
const fileSize = getFilesize(worldMapFilename);
const compressedFilesize = getCompressedFilesize(worldMapFileContent);

log("✓ World map (" + fileSize + ") (" + compressedFilesize + " compressed)", "yellow");

worldMapCount++;

// Worls map with stroke success message
const fileSizeStroke = getFilesize(worldMapFilenameStroke);
const compressedFilesizeStroke = getCompressedFilesize(
  worldMapFileContentStroke
);

log("✓ World map with stroke (" + fileSizeStroke + ") (" + compressedFilesizeStroke + " compressed)", "yellow");

worldMapCount++;

// Success messages
log("✓ " + regionMapCount + " individual maps created", "green");
log("✓ " + combinedMapCount + " combined maps created", "green");
log("✓ " + worldMapCount + " world maps created", "green");

// Statistics
const statData = fs.readFileSync(worldMapFilename, 'utf8');

// Extract all <path> elements
const pathElements = statData.match(/<path\b[^>]*>/g);

let totalPaths = 0;
let totalSubPaths = 0;
let totalPoints = 0;

if (pathElements) {
  totalPaths = pathElements.length; // Total number of <path> elements

  pathElements.forEach((path) => {
    // Extract the `d` attribute
    const d = path.match(/d="([^"]+)"/);
    if (d) {
      // Count sub-paths (each new `M` or `m` command starts a new sub-path)
      const subPaths = d[1].split(/[Mm]/).filter(Boolean);
      totalSubPaths += subPaths.length;

      // Count points (M, L, m, l commands followed by coordinates)
      const commands = d[1].match(/[MLml]\s*[\d.,-]+/g);
      if (commands) {
        totalPoints += commands.length;
      }
    }
  });
}

log('i Paths: ' + totalPaths, 'cyan');
log('i Sub-Paths: ' + totalSubPaths, 'cyan');
log('i Points: ' + totalPoints, 'cyan');

// Done message
const mapsDone = regionMapCount + "/" + config.totalMaps;
const mapsDonePercent = ((regionMapCount / config.totalMaps) * 100).toFixed(2);
log("› Progress: " + mapsDone + " (" + mapsDonePercent + "%)", "magenta");

// Errors
if (errorCount > 0) {
  log("✗ " + errorCount + " error: See log above", "red");
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
function cleanUpPath(path, id) {
  path = path.replace(/  |\t|\r\n|\n|\r/gm, "");
  path = path.replace(/ZM/g, "Z M");
  path = path.replace(/zM/g, "Z M");

  const paths = path.split(" ");

  let cleanPaths = '';

  paths.forEach(function (pathItem) {
    // Clean up paths
    cleanPaths += recreateReadableSVGPath(pathItem, id) + " ";

    // Detect empty paths
    if (
      pathItem.indexOf("l") === -1 &&
      pathItem.indexOf("h") === -1 &&
      pathItem.indexOf("v") === -1
    ) {
      log("✗ Error: Empty path detected (" + id + ")", "red");
      errorCount++;
    }

    // Detect curves
    if (pathItem.indexOf("c") > -1) {
      log("✗ Error: Curve in path detected (" + id + ")", "red");
      errorCount++;
    }

    // Detect unclosed paths
    if (pathItem.indexOf("z") == -1 && pathItem.indexOf("Z") == -1) {
      log("✗ Error: Unclosed path detected (" + id + ")", "red");
      errorCount++;
    }
  });

  return cleanPaths;
}

// Parse an SVG path
function parseSVGPath(path, id) {
  // Regular expression to find commands and their numbers
  const commandRegex = /([a-zA-Z])([^a-zA-Z]*)/g;
  const pathArray = [];
  let match;

  while ((match = commandRegex.exec(path)) !== null) {
    const command = match[1];
    const numberString = match[2].trim();
    // Split numbers, taking into account possible negative signs
    const numbers = numberString === "" ? [] : numberString.match(/-?\d*\.?\d+/g).map(Number);

    // Group numbers into coordinate pairs or keep single based on command type
    let coordinates = [];
    if (command === 'H' || command === 'V' || command === 'h' || command === 'v') {
      // For 'H', 'V', 'h', and 'v', each number is treated as a single coordinate
      coordinates = numbers.map(n => [n]);
    } else if (command === 's' || command === 'S') {
      // For 's' and 'S', group every four numbers (two coordinate pairs)
      for (let i = 0; i < numbers.length; i += 4) {
        coordinates.push(numbers.slice(i, i + 4));
      }
    } else if (command === 'c' || command === 'C') {
      // For 'c' and 'C', group every six numbers (three coordinate pairs)
      for (let i = 0; i < numbers.length; i += 6) {
        coordinates.push(numbers.slice(i, i + 6));
      }
    } else {
      // For other commands like 'M' or 'L', pair the numbers
      for (let i = 0; i < numbers.length; i += 2) {
        coordinates.push(numbers.slice(i, i + 2));
      }
    }

    pathArray.push({
      command: command,
      coordinates: coordinates
    });
  }

  return pathArray;
}

function recreateReadableSVGPath(path, id) {
  const pathArray = parseSVGPath(path);

  let readablePath = '';

  pathArray.forEach(item => {
    if (item.coordinates.length === 0) {
      // For commands like 'Z' with no coordinates
      readablePath += `${item.command}`;
    } else {
      const command = item.command.toUpperCase();
      item.coordinates.forEach(coord => {
        // Append command and coordinates, ensuring use of commas
        if (command === 'H' || command === 'V') {
          // For horizontal and vertical commands, output each as separate commands
          if (coord[0] !== 0) {
            readablePath += `${item.command}${coord[0]}`;
          }
        } else if (command === 'S' || command === 'C') {
          // Convert 's' and 'c' commands to 'l', use only the endpoint which is the last pair
          const endPoint = coord.slice(-2);
          readablePath += `l${endPoint.join(',')} `;
        } else {
          // For other commands, output each coordinate pair with a comma
          readablePath += `${item.command}${coord.join(',')}`;
        }
      });
    }
  });

  return readablePath.trim();
}

// Clean up a polyline
function cleanUpPolyline(polyline) {
  polyline = polyline.replace(/  |\t|\r\n|\n|\r/gm, "").trim();

  // Fix when no commas used
  if (!polyline.includes(',')) {
    const points = polyline.split(/\s+/);
    let pointsWithComma = [];
    for (let i = 0; i < points.length; i += 2) {
      if (points[i + 1]) {
        pointsWithComma.push(points[i] + ',' + points[i + 1]);
      } else {
        pointsWithComma.push(points[i]);
      }
    }

    polyline = pointsWithComma.join(' ');
  }

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
      val = val.replace(/,,/g, ",");

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

    newPath += "Z";

    newPaths.push(newPath);
  });

  return newPaths.join(" ");
}

function addPathsToCombineCache(id, path, isIgnore, isCut) {
  if (config.combine[id]) {
    for (const idData of config.combine[id].ids) {
      const combineId = idData.id;
      const hasColor = idData.color;
      const hasEvenOdd = idData.hasEvenOdd;
      const includeIgnore = idData.includeIgnore;

      if (isIgnore && !includeIgnore) {
        return false;
      }

      if (!combineCache[combineId]) {
        combineCache[combineId] = {
          paths: [],
          coloredPaths: [],
          pathsCut: []
        };
      }

      let combinePath = path;

      if (config.combineMove.indexOf(id) !== -1) {
        combinePath = movePath(path, config.moveConstantX, 0);
      }
      if (config.combineMoveNeg.indexOf(id) !== -1) {
        combinePath = movePath(path, config.moveConstantX * -1, 0);
      }
      if (
        !combineCache[combineId].coloredPaths.includes(combinePath) &&
        !combineCache[combineId].paths.includes(combinePath) &&
        !combineCache[combineId].pathsCut.includes(combinePath)
      ) {
        if (isCut) {
          combineCache[combineId].pathsCut.push(combinePath);
        } else {
          combineCache[combineId][hasColor ? 'coloredPaths' : 'paths'].push(combinePath);
        }
      }

      if (hasEvenOdd) {
        if (hasColor) {
          combineCache[combineId].hasEvenOddColor = true;
        } else {
          combineCache[combineId].hasEvenOdd = true;
        }
      }
    }
  }
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

// Log data
function log(text, color) {
  const colors = {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    gray: "\x1b[90m"
  };

  color = colors[color] || color || colors.white;
  console.log(color, text, "\x1b[0m");
}

// Deep log data

function dLog(data) {
  console.log(util.inspect(data, { showHidden: false, depth: null, colors: true }));
}