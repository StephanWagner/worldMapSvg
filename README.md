# worldMapSvg

A detailed SVG world map and single country maps including contested territories and autonomous regions in the Miller cylindrical projection.

---

## Author

**Stephan Wagner**\
stephanwagner.me@gmail.com\
https://stephanwagner.me

---

## Building the maps

The map paths in Illustrator need to be named as `path_ID` with `ID` being the [ISO country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2). Save the map file as `map.svg` in the `src` folder. Then you can run the script `npm run build` to automatically generate the SVG maps to the folder `maps`.

---

## Sources

The maps are created using Adobe Illustrator with the help of the following map material:

- Wikipedia: Miller cylindrical projection\
  https://en.wikipedia.org/wiki/Miller_cylindrical_projection\
  https://en.wikipedia.org/wiki/Miller_cylindrical_projection#/media/File:Miller_with_Tissot's_Indicatrices_of_Distortion.svg

- Library of Congress: Standard time zones of the world\
  https://www.loc.gov/item/2012592861\
  https://maps.lib.utexas.edu/maps/world_maps/timezones_ref00.pdf

- Google Maps\
  https://www.google.com/maps
