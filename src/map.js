#!/usr/bin/node

const fs = require('fs');

// SVG data
const svgHeader = '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="1350.238px" height="713.73px" viewBox="0 0 1350.238 713.73">';
const svgFooter = '</svg>';

try {
  // Map data
  const data = fs.readFileSync('./map.svg', 'utf8');

  // Regular expression to match paths
  const regex = /<path id="path_x5F_([A-Z-]+)" fill="#[A-Z0-9]+" d="([A-Za-z0-9,.\r\n\t\s-]+)"/ug;

  // File count
  let fileCount = 0

  // Loop through map paths
  for (const match of data.matchAll(regex)) {
    // Get the id
    const id = match[1];

    // Clean up path
    let path = match[2];
    path = path.replace((/  |\t|\r\n|\n|\r/gm), '');

    // Generate file content
    let fileContent = svgHeader;
    fileContent += "\n";
    fileContent += '  <path data-id="' + id + '" d="' + path + '"/>';
    fileContent += "\n";
    fileContent += svgFooter;

    // Write file
    fs.writeFileSync('./maps/' + id + '.svg', fileContent);

    // Count generated files
    fileCount++;

    // Log id
    console.log(id);
  }

  // Success message
  console.log(fileCount + ' maps generated');

} catch (err) {
  console.error(err);
}


