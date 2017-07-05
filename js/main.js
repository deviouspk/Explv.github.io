'use strict';
var coordinates = [];
var lastCoordinatesIndex = [];
define("main", ['domReady!', 'jquery', 'jqueryui', 'bootstrap', 'leaflet', 'Position', 'Path', 'Area', 'Areas', 'PolyArea', 'SyntaxHighlighter', 'locations'],

    function (doc, $, $ui, Bootstrap, L, Position, Path, Area, Areas, PolyArea, SyntaxHighlighter, locations) {

        var OutputType = Object.freeze({ARRAY: 1, LIST: 2, ARRAYS_AS_LIST: 3});
        var outputType = OutputType.ARRAY;


        var map = L.map('map', {
            //maxBounds: L.latLngBounds(L.latLng(-40, -180), L.latLng(85, 153))
            zoomControl: false
        }).setView([-73.16, -105.94], 15);
        map.dragging.disable();


        /*
         Init custom controls
         */
        var titleLabel = L.Control.extend({
            options: {
                position: 'topleft'
            },
            onAdd: function (map) {
                var container = L.DomUtil.create('div');
                container.id = 'titleLabel';
                container.innerHTML = "<span id='explv'>RsBots | </span> Duel Arena Map";

                L.DomEvent.disableClickPropagation(container);
                return container;
            }
        });
        map.addControl(new titleLabel());

        var coordinatesControl = L.Control.extend({
            options: {
                position: 'topleft'
            },
            onAdd: function (map) {
                var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
                container.id = 'coordinates-container';
                container.style.height = 'auto';

                var coordinatesForm = L.DomUtil.create('form', 'leaflet-bar leaflet-control leaflet-control-custom form-inline', container);
                var formGroup = L.DomUtil.create('div', 'form-group', coordinatesForm);
                var xCoordInput = L.DomUtil.create('input', 'form-control coord', formGroup);
                xCoordInput.type = 'text';
                xCoordInput.id = 'xCoord';
                var yCoordInput = L.DomUtil.create('input', 'form-control coord', formGroup);
                yCoordInput.type = 'text';
                yCoordInput.id = 'yCoord';
                var zCoordInput = L.DomUtil.create('input', 'form-control coord', formGroup);
                zCoordInput.type = 'text';
                zCoordInput.id = 'zCoord';

                L.DomEvent.disableClickPropagation(container);
                return container;
            }
        });
        map.addControl(new coordinatesControl());

        L.control.zoom({
            position: 'topleft'
        }).addTo(map);

        var planeControl = L.Control.extend({
            options: {
                position: 'topleft'
            },
            onAdd: function (map) {
                var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
                container.style.background = 'none';
                container.style.width = '70px';
                container.style.height = 'auto';


                L.DomEvent.disableClickPropagation(container);
                return container;
            }
        });
        map.addControl(new planeControl());

        var locationSearch = L.Control.extend({
            options: {
                position: 'topleft'
            },
            onAdd: function (map) {
                var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
                container.style.background = 'none';
                container.style.width = '200px';
                container.style.height = 'auto';

                L.DomEvent.disableClickPropagation(container);
                return container;
            }
        });
        map.addControl(new locationSearch());

        var collectionControls = L.Control.extend({
            options: {
                position: 'topright'
            },
            onAdd: function (map) {
                var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
                container.style.background = 'none';
                container.style.width = '70px';
                container.style.height = 'auto';

                var areaButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom toggle-collection', container);
                areaButton.id = 'toggle-area';
                areaButton.innerHTML = 'Area';

                var undoButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
                undoButton.id = 'undo';
                undoButton.innerHTML = '<i class="fa fa-undo" aria-hidden="true"></i>';

                var clearButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
                clearButton.id = 'clear';
                clearButton.innerHTML = '<i class="fa fa-trash" aria-hidden="true"></i>';

                L.DomEvent.disableClickPropagation(container);
                return container;
            }
        });
        map.addControl(new collectionControls());


        var z = 0;

        var layer;

        function setMapLayer() {
            //console.log('https://raw.githubusercontent.com/Explv/osrs_map_full/master/' + z + '/{z}/{x}/{y}.png');
            if (layer !== undefined) {
                map.removeLayer(layer);
            }
            layer = L.tileLayer('https://raw.githubusercontent.com/Explv/osrs_map_full/master/' + z + '/{z}/{x}/{y}.png', {
                minZoom: 11,
                maxZoom: 11,
                attribution: 'Map data',
                noWrap: true,
                tms: true
            });
            layer.addTo(map);
            map.invalidateSize();
        }

        setMapLayer();

        var mapLabels = new L.layerGroup();

        for (var location in locations) {

            if (locations.hasOwnProperty(location)) {
                if (locations[location].z !== z) {
                    continue;
                }

                var mapLabel = L.marker(locations[location].toCentreLatLng(map), {
                    icon: L.divIcon({
                        className: 'map-label',
                        html: `<p>${location}</p>`
                    }),
                    zIndexOffset: 1000
                });

                mapLabels.addLayer(mapLabel);
            }
        }

        mapLabels.addTo(map);
        map.removeLayer(mapLabels);


        var path = new Path(map, new L.FeatureGroup());
        var areas = new Areas(map, new L.FeatureGroup());
        var polyArea = new PolyArea(new L.FeatureGroup(), map);

        var currentDrawable;

        var prevMouseRect, prevMousePos;
        var cursorX, cursorY;

        var firstSelectedAreaPosition;
        var drawnMouseArea;

        var searchMarker;

        var editing = false;

        $("#output-type").change(function () {
            switch ($("#output-type").val()) {
                case "Array":
                    outputType = OutputType.ARRAY;
                    break;
                case "List":
                    outputType = OutputType.LIST;
                    break;
                case "Arrays.asList":
                    outputType = OutputType.ARRAYS_AS_LIST;
                    break;
            }
            output();
        });

        $(".toggle-collection").click(function () {

            editing = true;

            $(".active").removeClass("active");
            $(this).addClass("active");

            if ($("#output-container").css('display') == 'none') {
                $("#map-container").removeClass("col-lg-12 col-md-12 col-sm-12 col-xs-12");
                $("#map-container").addClass("col-lg-9 col-md-7 col-sm-8 col-xs-8");
                $("#output-container").show();
                map.invalidateSize();
            }

            path.hide(map);
            polyArea.hide(map);
            areas.show(map);
            currentDrawable = areas;

            output();
        });

        $("#undo").click(function () {
            currentDrawable.removeLast();
            console.log(lastCoordinatesIndex);
            if (lastCoordinatesIndex.length > 0) {
                for (let index = lastCoordinatesIndex.pop(); index > 0; index--) {
                    coordinates.pop();
                }
            }
            console.log(coordinates);
            //output();
        });

        $("#clear").click(function () {
            currentDrawable.removeAll();
            coordinates = [];
            output();
        });

        map.on('click', function (e) {
            if (!editing) {
                return;
            }

            var position = Position.fromLatLng(map, e.latlng, z);

            if (currentDrawable instanceof Areas) {
                if (firstSelectedAreaPosition === undefined) {
                    firstSelectedAreaPosition = position;
                } else {
                    map.removeLayer(drawnMouseArea);
                    areas.add(new Area(firstSelectedAreaPosition, position));
                    firstSelectedAreaPosition = undefined;
                    output()
                }
            } else {
                currentDrawable.add(position);
                output();
            }
        });

        map.on('mousemove', function (e) {

            var mousePos = Position.fromLatLng(map, e.latlng, z);

            if (prevMousePos !== mousePos) {

                prevMousePos = mousePos;

                if (prevMouseRect !== undefined) map.removeLayer(prevMouseRect);

                prevMouseRect = mousePos.toLeaflet(map);
                prevMouseRect.addTo(map);

                $("#xCoord").val(mousePos.x);
                $("#yCoord").val(mousePos.y);
                $("#zCoord").val(mousePos.z);
            }

            if (editing) {

                if (firstSelectedAreaPosition !== undefined) {

                    if (drawnMouseArea !== undefined) map.removeLayer(drawnMouseArea);

                    drawnMouseArea = new Area(firstSelectedAreaPosition, mousePos).toLeaflet(map);
                    drawnMouseArea.addTo(map, true);
                }
            }
        });

        $(".coord").keyup(goToSearchCoordinates);

        function goToSearchCoordinates() {
            var x = $("#xCoord").val();
            var y = $("#yCoord").val();
            if ($.isNumeric(x) && $.isNumeric(y)) {
                goToCoordinates(x, y);
            }
        }

        function goToCoordinates(x, y) {
            if (searchMarker !== undefined) map.removeLayer(searchMarker);
            searchMarker = new L.marker(new Position(x, y, z).toCentreLatLng(map));
            searchMarker.addTo(map);
            map.panTo(searchMarker.getLatLng());
        }

        document.onmousemove = function (e) {
            cursorX = e.clientX;
            cursorY = e.clientY;
        };

        $("#code-output").on('input propertychange paste', function () {
            currentDrawable.fromString($("#code-output").text());
        });

        function output() {

            var output = "";

            if (currentDrawable instanceof PolyArea) {
                output += currentDrawable.toJavaCode();
            } else {
                switch (outputType) {
                    case OutputType.ARRAY:
                        output += currentDrawable.toArrayString();
                        break;
                    case OutputType.LIST:
                        output += currentDrawable.toListString();
                        break;
                    case OutputType.ARRAYS_AS_LIST:
                        output += currentDrawable.toArraysAsListString();
                        break;
                }
            }

            $("#code-output").html(output);
            SyntaxHighlighter.highlight($("#code-output"));
        }

        function generateCoordinates() {
            var wentInHere = false;
            var output = "";
            // output += currentDrawable.toListString();

            var rectangles;
            rectangles = currentDrawable.getRectangles();


            var counter = 0;
            if (currentDrawable.areas !== null && currentDrawable.areas[0] !== undefined) {
                currentDrawable.areas.forEach(function (area) {

                        let x1 = area.getStartX();
                        let x2 = area.getEndX();
                        let y1 = area.getStartY();
                        let y2 = area.getEndY();

                        let upperLeft = new Coordinate(Math.min(x1, x2), Math.max(y1, y2));
                        let bottomRight = new Coordinate(Math.max(x1, x2), Math.min(y1, y2));

                        let width = bottomRight.x - upperLeft.x;
                        let height = upperLeft.y - bottomRight.y;

                        var currentCoordinates = [];
                        var startCoordinatesLength = coordinates.length;
                        counter = 0;
                        for (let y = upperLeft.y; y >= bottomRight.y; y--) {
                            for (let x = upperLeft.x; x <= bottomRight.x; x++) {
                                if (coordinates.length >= 1) {
                                    var coordinate = new Coordinate(x, y);
                                    var alreadyInarray = false;

                                    coordinates.forEach(function (savedCoordinate) {
                                        wentInHere = true;
                                        if (coordinate.x === savedCoordinate.x && coordinate.y === savedCoordinate.y) {
                                            alreadyInarray = true;
                                        }
                                    });
                                    counter++;
                                    if (!alreadyInarray) {
                                        coordinates.push(coordinate);
                                        currentCoordinates.push(coordinate);
                                    }

                                } else {

                                    coordinates.push(new Coordinate(x, y));
                                    currentCoordinates.push(coordinate);
                                }
                                console.log(x, y);
                            }
                        }
                        var endCoordinatesLength = coordinates.length;
                        if (currentCoordinates.length !== 0 && startCoordinatesLength !== endCoordinatesLength)
                            lastCoordinatesIndex.push(currentCoordinates.length);
                        else if (currentCoordinates.length === 0 && currentDrawable.getLength() === lastCoordinatesIndex.length + 1)
                            lastCoordinatesIndex.push(0);

                        console.log("counter: " + counter + " length:" + coordinates.length);
                        console.log(lastCoordinatesIndex);
                        console.log(coordinates);
                        var form = document.forms["test"];

                        for (let i = 0; i < coordinates.length; i++) {
                            addHidden(form, "coordinate[" + i + "][x]", coordinates[i].x);
                            addHidden(form, "coordinate[" + i + "][y]", coordinates[i].y);
                        }
                    }
                );
            }

            $("#code-output").html(output);
            SyntaxHighlighter.highlight($("#code-output"));


        }

        function addHidden(theForm, key, value) {
            // Create a hidden input element, and append it to the form:
            var input = document.createElement('input');
            input.type = 'hidden';
            input.name = key; // 'the key/name of the attribute/field that is sent to the server
            input.value = value;
            theForm.appendChild(input);
        }

        function Coordinate(x, y) {
            this.x = x;
            this.y = y;
            this.coordinateToString = function () {
                return "x: " + x + " " + "y: " + y;
            }
        }
    })
;


