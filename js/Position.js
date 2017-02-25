'use strict';

define("Position", ['leaflet', 'Drawable'], function(L, Drawable) {

    return class Position extends Drawable {

        constructor(map, x, y, z) {
            super(map);
            this.x = Math.round(x);
            this.y = Math.round(y);
            this.z = z;
            this.rectangle = this.toLeaflet(this.map);
        }

        static fromLatLng(map, latLng, z) {
            var point = map.project(latLng, map.getMaxZoom());
            var y = 53504 - point.y;
            y = Math.round((y - 32) / 32) + 14776;
            var x = Math.round((point.x - 32) / 32);
            return new Position(map, x, y, z);
        }

        toLatLng() {
            var x = (this.x * 32) + 8;
            var y = (53504 - ((this.y - 14776) * 32)) - 8;
            return this.map.unproject(L.point(x, y), this.map.getMaxZoom());
        }

        toCentreLatLng() {
            var x = ((this.x + 0.5) * 32);
            var y = ((53504 - ((this.y + 0.5 - 14776) * 32)));
            return this.map.unproject(L.point(x, y), this.map.getMaxZoom());
        }

        getDistance(position) {
            var diffX = Math.abs(this.x - position.x);
            var diffY = Math.abs(this.y - position.y);
            return Math.sqrt((diffX * diffX) + (diffY * diffY));
        }

        toLeaflet() {
            var point = this.map.project(this.toLatLng(), this.map.getMaxZoom());
            var startX = (Math.floor(point.x / 32) * 32) + 8;
            var startY = (Math.floor(point.y / 32) * 32) - 8;
            var endX = startX + 32;
            var endY = startY + 32;
            var startLatLng = this.map.unproject(L.point(startX, startY), this.map.getMaxZoom());
            var endLatLng = this.map.unproject(L.point(endX, endY), this.map.getMaxZoom());

            return L.rectangle(L.latLngBounds(startLatLng, endLatLng), {
                color: "#33b5e5",
                fillColor: "#33b5e5",
                fillOpacity: 1.0,
                weight: 1,
                clickable: false
            });
        }

        toJavaCode() {
            return `Position position = new Position(${this.x}, ${this.y}, ${this.z});`;
        }

        getName() {
            return "Position";
        }

        equals(position) {
            return this.x === position.x && this.y === position.y && this.z === position.z;
        }
    };
});
