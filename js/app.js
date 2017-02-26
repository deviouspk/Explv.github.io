require.config({
    shim : {
        "bootstrap" : { "deps" :['jquery'] }
    },
    paths: {
        jquery: "external/jquery-2.1.4",
        leaflet: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.0.3/leaflet",
        bootstrap: "external/bootstrap.min",
        domReady: "external/domReady"
    }
});

requirejs(['main']);
