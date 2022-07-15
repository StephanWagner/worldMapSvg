#!/usr/bin/node

const fs = require("fs");

try {
  // Map data

  console.log(__dirname);

  const data = fs.readFileSync(__dirname + "/map.svg", "utf8");

  // Regular expression to match paths
  const regex =
    /<path id="path_x5F_([A-Z-]+)[_A-Za-z0-9]*" fill="#[A-Za-z0-9]+" d="([A-Za-z0-9,.\r\n\t\s-]+)"/gu;

  // File count
  let countryFileCount = 0;

  // Word map data
  let worldFileContent = "";
  let worldMapViewBox = {
    xMin: 10000,
    xMax: 0,
    yMin: 10000,
    yMax: 0,
  };

  // Process map paths
  for (const match of data.matchAll(regex)) {
    // Get the id
    const id = match[1];

    // Clean up path
    let path = match[2];
    path = path.replace(/  |\t|\r\n|\n|\r/gm, "");

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

    // Write country file
    fs.writeFileSync(
      __dirname + "/../maps/countries/" + id + ".svg",
      countryFileContent
    );

    // Generate world file content
    worldFileContent += '  <path data-id="' + id + '" d="' + path + '"/>';
    worldFileContent += "\n";

    // Count generated files
    countryFileCount++;

    // Country map success message
    console.log("✓ " + id);
  }

  // Country maps success message
  console.log(countryFileCount + " country maps generated");

  // Generate world map file content
  let worldMapFileContent = getSvgStart(worldMapViewBox);
  worldMapFileContent += "\n";
  worldMapFileContent += worldFileContent;
  worldMapFileContent += "</svg>";

  // Write world map file
  fs.writeFileSync(__dirname + "/../maps/world-map.svg", worldMapFileContent);

  // World map success message
  console.log("✓ World map");
} catch (err) {
  // Error message
  console.error(err);
}

// Get the start of the SVG with viewBox data
function getSvgStart(viewBox) {
  const width = (viewBox.xMax - viewBox.xMin).toFixed(3);
  const height = (viewBox.yMax - viewBox.yMin).toFixed(3);

  let svgStart =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="{X} {Y} {W} {H}">';

  svgStart = svgStart.replace(/{X}/g, viewBox.xMin);
  svgStart = svgStart.replace(/{Y}/g, viewBox.yMin);
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
  let xMax = 0;
  let yMin = 10000;
  let yMax = 0;

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
          xCur = parseFloat(values[0]);
          yCur = parseFloat(values[1]);
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

  xMin = xMin.toFixed(3);
  xMax = xMax.toFixed(3);
  yMin = yMin.toFixed(3);
  yMax = yMax.toFixed(3);

  return {
    xMin,
    xMax,
    yMin,
    yMax,
  };
}
