module.exports = {
  // Total of maps
  totalMaps: 355,

  // Precision
  decimals: 3,

  // Stroke options for file world-with-stroke.svg
  strokeWidth: 10,
  strokeColor: "#eee",
  coloredPathColor: "#aaa",

  // Border options
  borderSizes: {
    m: 0.06,
    s: 0.02,
  },

  // Move amount when moving a path horizontally around the globe
  moveConstantX: 1328,

  // Ignore on world map
  ignoreWorldMap: [
    // Cyprus
    "CY",

    // Great Britain
    "IE-NIR"
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
    "AG-04": { ids: [{ id: "AG" }] },
    "AG-10": { ids: [{ id: "AG" }] },

    // Australia
    "AU-ML": { ids: [{ id: "AU" }] },
    "AU-TAS": { ids: [{ id: "AU" }] },

    // Caribbean Netherlands
    "BQ-BO": { ids: [{ id: "BQ" }] },
    "BQ-SA": { ids: [{ id: "BQ" }] },

    // China
    "CN-HI": { ids: [{ id: "CN" }] },

    // Dominican Republic, Haiti
    "DO": {
      ids: [
        { id: "DO-C" },
        { id: "HT-C", color: true }
      ]
    },
    "HT": {
      ids: [
        { id: "DO-C", color: true },
        { id: "HT-C" }
      ],
    },

    // Akrotiri and Dhekelia
    "CY-AK": { ids: [{ id: "CY-SBA" }] },
    "CY-DH": { ids: [{ id: "CY-SBA" }] },

    // Cyprus, Greece
    "CY-GR1": { ids: [{ id: "CY-GR" }] },
    "CY-GR2": { ids: [{ id: "CY-GR" }] },

    // Scotland
    "GB-SCT-A": { ids: [{ id: "GB-SCT" }] },
    "GB-ZET": { ids: [{ id: "GB-SCT" }] },

    // Ireland, Northern Ireland
    "IE": {
      ids: [
        { id: "IE-C", color: true },
        { id: "GB-NIR-C" }
      ]
    },
    "GB-NIR": {
      ids: [
        { id: "IE-C" },
        { id: "GB-NIR-C", color: true },
      ],
    },

    // Kiribati
    "KI-G": { ids: [{ id: "KI" }] },
    "KI-L": { ids: [{ id: "KI" }] },
    "KI-P": { ids: [{ id: "KI" }] },

    // Saint Kitts and Nevis
    "KN-K": { ids: [{ id: "KN" }] },
    "KN-N": { ids: [{ id: "KN" }] },

    // South Korea
    "KR": { ids: [{ id: "KR" }] },
    "KR-49": { ids: [{ id: "KR" }] },
    
    // Dominican Republic, Haiti
    "MF": {
      ids: [
        { id: "MF-C" },
        { id: "SX-C", color: true }
      ]
    },
    "SX": {
      ids: [
        { id: "MF-C", color: true },
        { id: "SX-C" }
      ],
    },

    // Papua New Guinea
    "PG-ML": { ids: [{ id: "PG" }] },
    "PG-BA": { ids: [{ id: "PG" }] },

    // United States Minor Outlying Islands
    // TODO any more?
    "UM-67": { ids: [{ id: "UM" }] },
    "UM-71": { ids: [{ id: "UM" }] },
    "UM-76": { ids: [{ id: "UM" }] },
    "UM-79": { ids: [{ id: "UM" }] },
    "UM-81": { ids: [{ id: "UM" }] },
    "UM-84": { ids: [{ id: "UM" }] },
    "UM-86": { ids: [{ id: "UM" }] },
    "UM-95": { ids: [{ id: "UM" }] },

    // Venezuela
    "VE": { ids: [{ id: "VE" }] },
    "VE-O": { ids: [{ id: "VE" }] },

    // Virgin Islands
    "VG": { ids: [{ id: "VG-VI" }] },
    "VI": { ids: [{ id: "VG-VI" }] },
    
    // Virgin Islands
    "VG": {
      ids: [
        { id: "VG-C" },
        { id: "VI-C", color: true }
      ]
    },
    "VI": {
      ids: [
        { id: "VG-C", color: true },
        { id: "VI-C" }
      ],
    },
  },

};
