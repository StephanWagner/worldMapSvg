#!/usr/bin/node

const fs = require("fs");

// SVG data
const svgHeader =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="{X} {Y} {W} {H}">';
const svgFooter = "</svg>";

try {
  // Map data
  const data = fs.readFileSync("./map.svg", "utf8");

  // Regular expression to match paths
  const regex =
    /<path id="path_x5F_([A-Z-]+)" fill="#[A-Z0-9]+" d="([A-Za-z0-9,.\r\n\t\s-]+)"/gu;

  // File count
  let fileCount = 0;

  // Loop through map paths
  for (const match of data.matchAll(regex)) {
    // Get the id
    const id = match[1];

    // Clean up path
    let path = match[2];
    path = path.replace(/  |\t|\r\n|\n|\r/gm, "");

    // Get viewBox
    var viewBox = getViewBox(path);

    // Generate file content
    let fileContent = svgHeader;
    fileContent = fileContent.replace(/{X}/g, viewBox.xMin);
    fileContent = fileContent.replace(/{Y}/g, viewBox.yMin);
    fileContent = fileContent.replace(/{W}/g, viewBox.width);
    fileContent = fileContent.replace(/{H}/g, viewBox.height);
    fileContent += "\n";
    fileContent += '  <path data-id="' + id + '" d="' + path + '"/>';
    fileContent += "\n";
    fileContent += svgFooter;

    // Write file
    fs.writeFileSync("../maps/countries/" + id + ".svg", fileContent);

    // Count generated files
    fileCount++;

    // Log id
    console.log(id);
  }

  // Success message
  console.log(fileCount + " maps generated");
} catch (err) {
  // Error message
  console.error(err);
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
  width = (xMax - xMin).toFixed(3);
  height = (yMax - yMin).toFixed(3);

  return {
    width,
    height,
    xMin,
    xMax,
    yMin,
    yMax,
  };
}
