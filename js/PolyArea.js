'use strict';

define("PolyArea", ['jquery', "Drawable"], function ($, Drawable) {

    return class PolyArea extends Drawable {

        constructor(featureGroup, map) {
            super(map);
            this.map = map;
            this.positions = [];
            this.polygon = undefined;
            this.featureGroup = featureGroup;
        }

        show(map) {
            map.addLayer(this.featureGroup);
        }

        hide(map) {
            map.removeLayer(this.featureGroup);
        }

        add(position) {
            this.positions.push(position);
            this.featureGroup.removeLayer(this.polygon);
            this.polygon = this.toLeaflet();
            this.featureGroup.addLayer(this.polygon);
        }

        removeLast() {

            if (this.positions.length > 0) {
                this.positions.pop();
                this.featureGroup.removeLayer(this.polygon);
            }

            if (this.positions.length > 0) {
                this.polygon = this.toLeaflet();
                this.featureGroup.addLayer(this.polygon);
            }
        }

        removeAll() {

            while (this.positions.length > 0) {
                this.positions.pop();
                this.featureGroup.removeLayer(this.polygon);
            }

            while (this.positions.length > 0) {
                this.polygon = this.toLeaflet();
                this.featureGroup.addLayer(this.polygon);
            }
        }

        toLeaflet() {

            var latLngs = [];

            for (var i = 0; i < this.positions.length; i ++) {
              latLngs.push(this.positions[i].toCentreLatLng(this.map));
            }

            for (var i = 0; i < latLngs.length; i++) {
                var point = this.map.project(latLngs[i], this.map.getMaxZoom());
                point.x -= 8;
                point.y += 8;
                latLngs[i] = this.map.unproject(point, this.map.getMaxZoom());
            }

            return L.polygon(
                latLngs, {
                    color: "#33b5e5",
                    weight: 1,
                    interactive: false
                }
            );
        }

        toJavaCode() {
            var output = "Area area = new Area(\n    new int[][]{";
            for (var i = 0; i < this.positions.length; i++) {
                output += `\n        { ${this.positions[i].x}, ${this.positions[i].y} }`;
                if (i !== this.positions.length - 1) {
                    output += ",";
                }
            }
            output += "\n    }\n)";
            if (this.positions.length > 0 && this.positions[0].z > 0) {
              output += `.setPlane(${this.positions[0].z})`;
            }
            output += ";";
            return output;
        }

        getName() {
          return "Area";
        }
    };
});
