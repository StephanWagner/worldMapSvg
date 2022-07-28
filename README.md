# worldMapSvg

A detailed SVG world map and single country maps including contested territories and autonomous regions in the Miller cylindrical projection.

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

- Wikipedia: Miller cylindrical projection\
  https://en.wikipedia.org/wiki/Miller_cylindrical_projection \
  https://en.wikipedia.org/wiki/Miller_cylindrical_projection#/media/File:Miller_with_Tissot's_Indicatrices_of_Distortion.svg

- Library of Congress: Standard time zones of the world\
  https://www.loc.gov/item/2012592861 \
  https://maps.lib.utexas.edu/maps/world_maps/timezones_ref00.pdf

- OpenStreetMap\
  https://www.openstreetmap.org

- Google Maps\
  https://www.google.com/maps
