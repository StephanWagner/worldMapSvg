module.exports = {
  // Total of maps
  totalMaps: 420,

  // Precision
  decimals: 3,

  // Stroke options for file world-with-stroke.svg
  strokeWidth: 10,
  strokeColor: "#eee",
  coloredPathColor: "#bbb",

  // Border options
  borderSizes: {
    m: 0.05,
    s: 0.015,
  },

  // Move amount when moving a path horizontally around the globe
  moveConstantX: 1335,

  // Ignore on world map
  ignoreWorldMap: [
    // United Arab Emirates
    "AE",

    // Somalia
    "SO",

    // Cyprus
    "CY",         // Cypress combined
    "CY-GR-TR",   // Greek and Tyrkish Cypress
    "CY-GR-SBA",  // Greek Cypress with Akrotiri and Dhekelia
    "CY-SBA",     // Akrotiri and Dhekelia

    // Great Britain
    "IE-NIR",     // Ireland with Northern Ireland
    "GB",         // Great Britain
    "GB-UK",      // United Kingdom
    "GB-EAW",     // England and Wales
    "GB-EAS",     // England and Scotland
    "GB-SAW",     // Scotland and Wales

    // Georgia
    "GE",

    // Moldova
    "MD",

    // Turkey
    "TR",

    // Ukraine
    "UA",

    // US Aleutian Islands
    "US-ALI-W",
    "US-ALI-E",

    // Adaman and Nicobar Islands
    "IN-AN"
  ],

  // Ignore creating file
  ignoreFile: [
    // Cypress
    "CY-GR-TR",   // Greek and Tyrkish Cypress

    // Great Britain
    "GB-EAS",     // England and Scotland
    "GB-SAW",     // Scotland and Wales

    // Guernsey
    "GG-I",         // Outer islands

    // US Aleutian Islands
    "US-ALI-W",
    "US-ALI-E",
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

  // Paths that need to be moved to the left
  combineMoveNeg: [
    // Alaska, Aleutian Islands
    "US-SLI",
    "US-SMI",
    "US-SGI",
    "US-SPI",
    "US-ALI-E",
  ],

  // Combine paths to country
  combine: {

    // Alaska, Aleutian Islands
    "US-ALI-W": { ids: [{ id: "US-ALI" }, { id: "US-AK" }] },
    "US-ALI-E": { ids: [{ id: "US-ALI" }, { id: "US-AK" }] },
    "US-AK-ML": { ids: [{ id: "US-AK" }] },
    "US-SLI": { ids: [{ id: "US-AK" }] },
    "US-SMI": { ids: [{ id: "US-AK" }] },
    "US-SGI": { ids: [{ id: "US-AK" }] },
    "US-SPI": { ids: [{ id: "US-AK" }] },

    // Antigua and Barbuda
    "AG-04": { ids: [{ id: "AG" }] },
    "AG-10": { ids: [{ id: "AG" }] },

    // Australia
    "AU-ML": { ids: [{ id: "AU" }] },
    "AU-TAS": { ids: [{ id: "AU" }] },

    // Caribbean Netherlands
    "BQ-BO": { ids: [{ id: "BQ" }] },
    "BQ-SA": { ids: [{ id: "BQ" }] },

    // TODO China inclusive Hong Kong and Macau
    // TODO China inclusive Hong Kong, Macau and Taiwan
    // TODO CN-M China Mainland with Tibet

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

    // Cypress
    "CY-SBA": {
      ids: [
        { id: "CY-SBA-C" },
      ]
    },
    "CY-GR-TR": {
      ids: [
        { id: "CY-SBA-C", color: true },
      ],
    },

    "CY-GR-SBA": {
      ids: [
        { id: "CY-GR-SBA-C", color: true },
        { id: "CY-TR-C" }
      ]
    },
    "CY-TR": {
      ids: [
        { id: "CY-GR-SBA-C" },
        { id: "CY-TR-C", color: true },
      ],
    },

    // Greece
    "GR-ML": { ids: [{ id: "GR" }] },
    "GR-M": { ids: [{ id: "GR" }] },
    "GR-F": { ids: [{ id: "GR" }] },
    "GR-AE": { ids: [{ id: "GR" }] },

    // Italy
    "IT-ML": { ids: [{ id: "IT", hasEvenOdd: true }] },
    "IT-82": { ids: [{ id: "IT" }] },
    "IT-88": { ids: [{ id: "IT" }] },

    // Scotland
    "GB-SCT-A": { ids: [{ id: "GB-SCT" }] },
    "GB-ZET": { ids: [{ id: "GB-SCT" }] },

    // Spain
    "ES-ML": { ids: [{ id: "ES" }] },
    "ES-IB": { ids: [{ id: "ES" }] },

    // Ireland, Northern Ireland
    "GB-NIR": {
      ids: [
        { id: "IE-C" },
        { id: "GB-NIR-C", color: true },
      ],
    },
    "IE": {
      ids: [
        { id: "IE-C", color: true },
        { id: "GB-NIR-C" }
      ]
    },

    // United Kingdom: England
    "GB-ENG": {
      ids: [
        { id: "GB-ENG-C" },
        { id: "GB-WLS-C", color: true },
        { id: "GB-UK-ENG-C" },
      ]
    },
    "GB-SAW": {
      ids: [
        { id: "GB-UK-ENG-C", color: true }
      ]
    },

    // United Kingdom: Scotland
    "GB-WLS": {
      ids: [
        { id: "GB-ENG-C", color: true },
        { id: "GB-WLS-C" },
        { id: "GB-UK-WLS-C" },
      ]
    },
    "GB-EAS": { ids: [{ id: "GB-UK-WLS-C", color: true }] },

    // United Kingdom: Scotland
    "GB-SCT-A": { ids: [{ id: "GB-UK-SCT-C" }] },
    "GB-EAW": { ids: [{ id: "GB-UK-SCT-C", color: true }] },

    // Isle of Man
    "IM": {
      ids: [
        { id: "GB-UK-ENG-C", color: true },
        { id: "GB-UK-WLS-C", color: true },
        { id: "GB-UK-SCT-C", color: true }
      ]
    },

    // Guernsey
    "GG": {
      ids: [
        { id: "GG-A" },
        { id: "GG-JE" },
      ]
    },
    "GG-I": {
      ids: [
        { id: "GG-A" },
        { id: "GG-JE" }
      ]
    },

    // Jersey
    "JE": {
      ids: [
        { id: "GG-JE" }
      ]
    },

    // Indonesia
    "ID-BA": {
      ids: [
        { id: "ID", includeIgnore: true },
      ]
    },
    "ID-JW":
    {
      ids: [
        { id: "ID", includeIgnore: true },
      ]
    },
    "ID-KA":
    {
      ids: [
        { id: "ID", includeIgnore: true },
      ]
    },
    "ID-ML":
    {
      ids: [
        { id: "ID", includeIgnore: true },
      ]
    },
    "ID-PP":
    {
      ids: [
        { id: "ID", includeIgnore: true },
      ]
    },
    "ID-RI":
    {
      ids: [
        { id: "ID", includeIgnore: true },
      ]
    },
    "ID-SL":
    {
      ids: [
        { id: "ID", includeIgnore: true },
      ]
    },
    "ID-SM":
    {
      ids: [
        { id: "ID", includeIgnore: true },
      ]
    },

    // South Georgia and the South Sandwich Islands
    "GS-SG": { ids: [{ id: "GS" }] },
    "GS-SI": { ids: [{ id: "GS" }] },

    // Japan
    "JP-M": { ids: [{ id: "JP", includeIgnore: true }] },
    "JP-RY": { ids: [{ id: "JP", includeIgnore: true }] },

    // Kiribati
    "KI-G": { ids: [{ id: "KI" }] },
    "KI-L": { ids: [{ id: "KI" }] },
    "KI-P": { ids: [{ id: "KI" }] },

    // Saint Kitts and Nevis
    "KN-K": { ids: [{ id: "KN" }] },
    "KN-N": { ids: [{ id: "KN" }] },

    // South Korea
    "KR-M": { ids: [{ id: "KR" }] },
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
    "UM-67": { ids: [{ id: "UM" }] },
    "UM-71": { ids: [{ id: "UM" }] },
    // "UM-76": { ids: [{ id: "UM" }] }, // Ignore Navassa Island
    "UM-79": { ids: [{ id: "UM" }] },
    "UM-81": { ids: [{ id: "UM" }] },
    "UM-84": { ids: [{ id: "UM" }] },
    "UM-86": { ids: [{ id: "UM" }] },
    "UM-89": { ids: [{ id: "UM" }] },
    "UM-95": { ids: [{ id: "UM" }] },

    // Turkey
    "TR-EU": { ids: [{ id: "TR" }] },
    "TR-AS": { ids: [{ id: "TR" }] },

    // Venezuela
    "VE": { ids: [{ id: "VE" }] },
    "VE-O": { ids: [{ id: "VE" }] },

    // Virgin Islands
    "VG": {
      ids: [
        { id: "VG-C" },
        { id: "VI-C", color: true },
        { id: "VG-VI" }
      ]
    },
    "VI": {
      ids: [
        { id: "VG-C", color: true },
        { id: "VI-C" },
        { id: "VG-VI" }
      ],
    },
  },

};
