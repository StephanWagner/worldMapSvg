module.exports = {
  // Total of maps
  totalMaps: 355,

  // Precision
  decimals: 3,

  // Stroke options for file world-with-stroke.svg
  strokeWidth: 10,
  strokeColor: "#EEEEEE",

  // Border options
  borderSizes: {
    m: 0.06,
    s: 0.02,
  },

  // Move amount when moving a path horizontally around the globe
  moveConstantX: 1328,

  // Ignore on world map
  ignoreWorldMap: [
    // Cyprus combined
    "CY",
  ],

  // Ignore creating file
  ignoreFile: [
    // Cyprus, Greek
    "CY-GR1",
    "CY-GR2",
  ],

  // Paths that need to be moved
  combineMove: [
    // Line Islands (Kiribati)
    "KI-L",

    // United States Minor Outlying Islands
    "UM-76",
    "UM-86",
    "UM-89",
    "UM-95",
  ],

  // Combine paths to country
  combine: {
    // Antigua and Barbuda
    "AG-04": "AG",
    "AG-10": "AG",

    // Australia
    "AU-ML": "AU",
    "AU-TAS": "AU",

    // Caribbean Netherlands
    "BQ-BO": "BQ",
    "BQ-SA": "BQ",

    // China
    "CN-HI": "CN",

    // Akrotiri and Dhekelia
    "CY-AK": "CY-SBA",
    "CY-DH": "CY-SBA",

    // Cyprus, Greece
    "CY-GR1": "CY-GR",
    "CY-GR2": "CY-GR",

    // Kiribati
    "KI-G": "KI",
    "KI-L": "KI",
    "KI-P": "KI",

    // Saint Kitts and Nevis
    "KN-K": "KN",
    "KN-N": "KN",

    // South Korea
    "KR": "KR",
    "KR-49": "KR",

    // Papua New Guinea
    "PG-ML": "PG",
    "PG-BA": "PG",

    // United States Minor Outlying Islands
    "UM-67": "UM",
    "UM-71": "UM",
    "UM-76": "UM",
    "UM-79": "UM",
    "UM-81": "UM",
    "UM-84": "UM",
    "UM-86": "UM",
    "UM-95": "UM",

    // Venezuela
    "VE": "VE",
    "VE-O": "VE",
  },
};
