# worldMapSvg

A detailed SVG world map and single country maps including separated maps for autonomous regions, distinct island groups and disputed territories in the Miller cylindrical projection (ESRI:54003).

---

## Author

**Stephan Wagner**\
stephanwagner.me@gmail.com\
https://stephanwagner.me

---

## Building the maps

The map paths in the Adobe Illustrator file `src/map.ai` need to be named `path_ID` with `ID` being the [ISO country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2). Save the map file as `map.svg` with a precision of 3 decimal places. Then you can run the script `npm run build` to automatically generate the SVG maps into the folder `maps`.

Borders between countries and territories need to be named `border_ID1|ID2` and need to be unique to two countries.

---

## Sources

The maps are created using Adobe Illustrator with the help of following public map material:

- Natural Earth Data
  https://www.naturalearthdata.com

- Wikipedia: Miller cylindrical projection\
  https://upload.wikimedia.org/wikipedia/commons/a/ad/Blank_map_world_gmt.pdf

- OpenStreetMap\
  https://www.openstreetmap.org

- Google Maps\
  https://www.google.com/maps
