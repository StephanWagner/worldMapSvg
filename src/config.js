module.exports = {
  // Total of maps
  totalMaps: 344,

  // Stroke width for file world-with-stroke.svg
  strokeWidth: 10,

  // Move amount when moving a path horizontally around the globe
  moveConstantX: 1328,

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
    // Australia
    "AU-ML": "AU",
    "AU-TAS": "AU",

    // Caribbean Netherlands
    "BQ-BO": "BQ",
    "BQ-SA": "BQ",

    // Kiribati
    "KI-G": "KI",
    "KI-L": "KI",
    "KI-P": "KI",

    // Saint Kitts and Nevis
    "KN-K": "KN",
    "KN-N": "KN",

    // South Korea
    KR: "KR",
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
    VE: "VE",
    "VE-O": "VE",
  },
};
