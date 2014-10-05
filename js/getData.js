var a = $.url().param("a");
var dataOSM;
var dataGeoJSON;
var capaDatos;
var cargado;

var grupoVias = [];
var grupoSalExitTo = [];
var grupoSalName = [];
var grupoSalNada = [];
var grupoSalRef = [];
var grupoSalNoRef = [];
var grupoSalDestination = [];
var grupoSalSinSal = [];
var grupoPeaje = [];
var grupoOtros = [];
var grupoAreas = [];

var visibVias = true;
var visibSalExitTo = true;
var visibSalName = true;
var visibSalNada = true;
var visibSalRef = true;
var visibSalNoRef = true;
var visibSalDestination = true;
var visibSalSinSal = true;
var visibPeaje = true;
var visibOtros = true;
var visibAreas = true;

//Colores
var colorPeaje = "#0000ff";
var colorPeajeFondo = "#55a0bd";
var colorSalDestination = "#1e452b";
var colorSalExitTo = "#00b140";
var colorSalName = "#00ffff";
var colorSalNada = "#ff0000";
var colorSalRef = "#00ff00";
var colorSalNoRef = "#eca411";
var colorSalSinSal = "#ae0000";
var colorSalSinSalFondo = "#985652";
var colorAreas = "#f043b4";
var colorAreasFondo = "#d48fd1";



// addData
// Añado:       Vías y salidas
// Compruebo:   maxspeed, lanes, name, ref, construction y proposed en vías
//              exit_to, name, ref en salidas

function addData() { 
    MarkerStyleDefault = {        // Estilo por defecto de los nodos
        radius: 6,
        fillColor: "#000000",
        color: "#000000",
        weight: 3,
        opacity: 1,
        fillOpacity: 1
    };

    capaDatos = new L.geoJson(dataGeoJSON, {
        style: function(feature) {
            if (feature.geometry.type=='LineString') {                          // Estilo de las vías  
                if (feature.properties.tags.highway=='construction'){
                    return {"color": "#000000"};
                } else if (feature.properties.tags.highway=='proposed'){
                    return {"color": "#82858a"};
                } else if (feature.properties.tags.name==undefined) {
                    return {"color": "#ff0000"};
                } else if (feature.properties.tags.maxspeed==undefined){
                    if (feature.properties.tags.lanes==undefined){
                        return {"color": "#D430AB"};
                    } else {
                        return {"color": "#ffff00"};
                    }
                } else if (feature.properties.tags.lanes==undefined){
                        return {"color": "#ff8d00"};
                } else {
                        return {"color": "#0000ff"};
                }

            } else {                                                            // Estilo de los nodos
                if (feature.properties.tags.highway=="motorway_junction") {
                    if (feature.properties.tags.ref==undefined) {
                        if (feature.properties.tags.exit_to!==undefined){
                            return {fillColor: colorSalNoRef, color: colorSalExitTo};
                        } else if (feature.properties.tags.name!==undefined){
                            return {fillColor: colorSalNoRef, color: colorSalName};
                        } else {
                            return {fillColor: colorSalNoRef, color: colorSalNada};
                        }
                    } else {

                        if (feature.properties.tags.exit_to!==undefined){
                            return {fillColor: colorSalRef, color: colorSalExitTo};
                        } else if (feature.properties.tags.name!==undefined){
                            return {fillColor: colorSalRef, color: colorSalName};
                        } else {
                            return {fillColor: colorSalRef, color: colorSalNada};
                        }
                    }
                } else if (feature.properties.tags.barrier=="toll_booth") {
                    return {color: colorPeaje, fillColor:colorPeajeFondo};
                } else {
                    
                }
            }

        },
        onEachFeature: function (feature, layer) {                              //Configuro los popup de nodos y vías
            if (feature.properties.tags.highway=='motorway' || feature.properties.tags.highway=='motorway_link'){
                layer.bindPopup("<b>" + feature.properties.tags.name + " <span style='color:white;background-color:blue'>&nbsp" + 
                    feature.properties.tags.ref + "&nbsp</span></b><br/> maxspeed: <div class='maxspeed'>" + feature.properties.tags.maxspeed + 
                    "</div><br/>lanes: " + feature.properties.tags.lanes);
            }
            if (feature.properties.tags.highway=='motorway_junction') {
                layer.bindPopup("<b> Salida " + feature.properties.tags.ref + "</b><br/> name: " + feature.properties.tags.name + 
                    "<br/>exit_to: " + feature.properties.tags.exit_to + 
                    "<br>" + linkEditID("node", feature.properties.id) );
            }
            if (feature.properties.tags.highway=='construction') {
                layer.bindPopup("<b>En construcción: " + feature.properties.tags.name + " <span style='color:white;background-color:blue'>&nbsp" + 
                    feature.properties.tags.ref + "&nbsp</span></b><br/> maxspeed: " + feature.properties.tags.maxspeed + "<br/>lanes: " + 
                    feature.properties.tags.lanes);
            }
            if (feature.properties.tags.highway=='proposed') {
                layer.bindPopup("<b>En proyecto: " + feature.properties.tags.name + " <span style='color:white;background-color:blue'>&nbsp" + 
                    feature.properties.tags.ref + "&nbsp</span></b><br/> maxspeed: " + feature.properties.tags.maxspeed + "<br/>lanes: " + 
                    feature.properties.tags.lanes);
            }
            if (feature.properties.tags.barrier=='toll_booth') {
                layer.bindPopup("<b>Peaje: " + feature.properties.tags.name + "</b>" +
                    "<br>" + linkEditID("node", feature.properties.id) );
            }
        },
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, MarkerStyleDefault);        // Convierto los nodos en circleMarker
        }

    })
    .addTo(map);

    // Organizo los nodos y vías en grupos
    layers = capaDatos.getLayers()
    for (var i = 0; i < layers.length; i++) {                           
        if (layers[i].feature.geometry.type=='LineString') { // Organizo las vias
            grupoVias.push(layers[i]);
        } else if (layers[i].feature.properties.tags.highway=="motorway_junction") {    // Organizo las salidas
            if (layers[i].feature.properties.tags.ref!==undefined){ // Organizo según ref si o no
                grupoSalRef.push(layers[i]);
            } else {
                grupoSalNoRef.push(layers[i]);
            }
            if (layers[i].feature.properties.tags.exit_to!==undefined){ // Organizo segun exit_to, name o nada
                grupoSalExitTo.push(layers[i]);
            } else if (layers[i].feature.properties.tags.name!==undefined){
                grupoSalName.push(layers[i]);
            } else {
                grupoSalNada.push(layers[i]);
            }
        } else if (layers[i].feature.properties.tags.barrier=="toll_booth") {   // Organizo los peajes
            grupoPeaje.push(layers[i]);
        } else {
            grupoOtros.push(layers[i]);;    // Resto
        }
    };

    //Borro los nodos inutiles
    for (var i = 0; i < grupoOtros.length; i++) {
        map.removeLayer(grupoOtros[i]);
    };

    //Para ocultar datos
    if (!visibPeaje) {
        for (var i = 0; i < grupoPeaje.length; i++) {
            map.removeLayer(grupoPeaje[i]);
        };
    }
    if (!visibSalExitTo) {
        for (var i = 0; i < grupoSalExitTo.length; i++) {
            map.removeLayer(grupoSalExitTo[i]);
        };
    }
    if (!visibSalName) {
        for (var i = 0; i < grupoSalName.length; i++) {
            map.removeLayer(grupoSalName[i]);
        };
    }
    if (!visibSalRef) {
        for (var i = 0; i < grupoSalRef.length; i++) {
            map.removeLayer(grupoSalRef[i]);
        };
    }
    if (!visibSalNoRef) {
        for (var i = 0; i < grupoSalNoRef.length; i++) {
            map.removeLayer(grupoSalNoRef[i]);
        };
    }
}

// addData3
// Añado:       Áreas de servicio y Áreas de descanso
// Compruebo:   nombre

function addData3() {
    MarkerStyleAreas = {        // Estilo por defecto de los nodos
        radius: 6,
        fillColor: colorAreasFondo,
        color: colorAreas,       //Color areas de servicio
        weight: 3,
        opacity: 1,
        fillOpacity: 1
    };

    capaDatos = new L.geoJson(dataGeoJSON, {
        style: function(feature) {  
            return {color: "#f043b4"}
        },
        onEachFeature: function (feature, layer) {                              //Configuro los popup
            var tipo;
            if (feature.properties.tags.highway=="services") {
                tipo="<img src='https://upload.wikimedia.org/wikipedia/commons/b/b6/Spain_traffic_signal_s127.svg' height=50px/>Área de servicio";
            } else if (feature.properties.tags.highway=="rest_area") {
                tipo="<img src='https://upload.wikimedia.org/wikipedia/commons/5/56/Spain_traffic_signal_s123.svg' height=50px/>Área de descanso";
            }
            if(feature.geometry.type=="Point"){
                layer.bindPopup("<b> " + tipo + ": " + feature.properties.tags.name + 
                    "<br>" + linkEditID("node", feature.properties.id) );
            } else {
                layer.bindPopup("<b> " + tipo + ": " + feature.properties.tags.name + 
                    "<br>" + linkEditID("way", feature.properties.id) );
            }
        },
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, MarkerStyleAreas);        // Convierto los nodos en circleMarker
        }

    })
    .addTo(map);

    // Organizo los nodos y vías en grupos
    layers = capaDatos.getLayers()
    for (var i = 0; i < layers.length; i++) {                           
        grupoAreas.push(layers[i]);
    };

    // Convierto las áreas a circulos
    for (var i = 0; i < grupoAreas.length; i++) {
        if(grupoAreas[i].feature!==undefined){
            if(grupoAreas[i].feature.geometry.type=="Polygon"){
                var tipo;
                if (grupoAreas[i].feature.properties.tags.highway=="services") {
                    tipo="<img src='https://upload.wikimedia.org/wikipedia/commons/b/b6/Spain_traffic_signal_s127.svg' height=50px/>Área de servicio";
                } else if (grupoAreas[i].feature.properties.tags.highway=="rest_area") {
                    tipo="<img src='https://upload.wikimedia.org/wikipedia/commons/5/56/Spain_traffic_signal_s123.svg' height=50px/>Área de descanso";
                }
                circulo = L.circleMarker(grupoAreas[i].getBounds().getCenter(), MarkerStyleAreas);
                circulo.bindPopup("<b> " + tipo + ": " + grupoAreas[i].feature.properties.tags.name + 
                    "<br>" + linkEditID("way", grupoAreas[i].feature.properties.id) );
                circulo.addTo(map);
                grupoAreas.push(circulo);
            }
        }
    };

    //Para ocultar datos
    if (!visibAreas) {
        for (var i = 0; i < grupoAreas.length; i++) {
            map.removeLayer(grupoAreas[i]);
        };
    }    
}

function getData () {
    consulta = '[out:json][timeout:25];area(3601311341)->.area;(relation["ref"="' + a + '"](area.area);way(r);node(w););out;';
    $.getJSON('http://overpass-api.de/api/interpreter?data=' + consulta,
        function (response) {
            dataOSM = response;
            dataGeoJSON = osmtogeojson(dataOSM, uninterestingTags = {
                "source": true,
                "source_ref": true,
                "source:ref": true,
                "history": true,
                "attribution": true,
                "created_by": true,
                "converted_by": false,
                "tiger:county": true,
                "tiger:tlid": true,
                "tiger:upload_uuid": true
            });
            addData();
            cargado++;
            $("div#feedback").html("Datos cargados (" + cargado + "/3) .");
        }
    )
    .fail(function() { $("div#feedback").append("Error al cargar."); });
}

function getData3 () {

    consulta = '[out:json][timeout:50];area(3601311341)->.area;(relation["ref"="' + a + 
        '"](area.area);way(r);node(w););(way(around:200)["highway"="services"]->.a;node' + 
        '(around:200)["highway"="services"]->.a;way(around:200)["highway"="rest_area"]->.a;nod' + 
        'e(around:200)["highway"="rest_area"]->.a;);(._;>;);out body;';

    
    $.getJSON('http://overpass-api.de/api/interpreter?data=' + consulta,
        function (response) {
            dataOSM = response;
            dataGeoJSON = osmtogeojson(dataOSM, uninterestingTags = {
                "source": true,
                "source_ref": true,
                "source:ref": true,
                "history": true,
                "attribution": true,
                "created_by": true,
                "converted_by": false,
                "tiger:county": true,
                "tiger:tlid": true,
                "tiger:upload_uuid": true
            });
            addData3();
            cargado++;
            $("div#feedback").html("Datos cargados (" + cargado + "/3) .");
        }
    )
    .fail(function() { $("div#feedback").append("Error al cargar."); });
}


// getData41 y getData51
// Obtengo las salidas que no tienen ni siquiera marcado highway=motorway_junction

function getData41 () {

    consulta = '[out:json][timeout:25];area(3601311341)->.area;relation["ref"="'+ a +  //Obtengo los nodos de la autopista
        '"](area.area);way(r);node(w);out body;';

    
    $.getJSON('http://overpass-api.de/api/interpreter?data=' + consulta,
        function (response) {getData51(response);}
    )
    .fail(function() { $("div#feedback").append("Error al cargar."); });
}

function getData51 (response) {

    var nodosAutopista = response;
    var nodosalida = 0;

    consulta = '[out:json][timeout:50];area(3601311341)->.area;relation["ref"="' + a +  //Obtengo vias de salidas
    '"](area.area);way(r);node(w);way(bn);(way._["highway"="motorway_link"]->.A;way._["highway"="service"];);(._;>;);out body;'; 

    
    $.getJSON('http://overpass-api.de/api/interpreter?data=' + consulta,
        function (response) {
            MarkerStyleSalSinSal = {        // Estilo por defecto de los nodos
                radius: 6,
                fillColor: colorSalSinSalFondo,
                color: colorSalSinSal,       //Color salidas sin marcar
                weight: 3,
                opacity: 1,
                fillOpacity: 1
            };
            MarkerStyleSalDestination = {        // Estilo por defecto de los nodos
                radius: 6,
                fillColor: "#000000",
                color: colorSalDestination,       //Color salidas con destination
                weight: 3,
                opacity: 1,
                fillOpacity: 1
            };
            var viasSalidas = response;

            for (var i = 0; i < viasSalidas.elements.length; i++) {
                if (viasSalidas.elements[i].type == "way") {            // Solo trabajo con las vias de salida
                    if (viasSalidas.elements[i].tags.oneway == "-1") {  // Obtengo el ID del nodo de unión con la autopista
                        nodosalida = viasSalidas.elements[i].nodes.length;
                    } else {
                        nodosalida = 0;
                    }
                    if (viasSalidas.elements[i].tags.access !== "no") { // Si realmente es una salida
                        for (var j = 0; j < nodosAutopista.elements.length; j++) {  // Para cada nodo de la autopista
                            if (nodosAutopista.elements[j].id == viasSalidas.elements[i].nodes[nodosalida]) { //Busco el nodo de unión con la salida
                                lat=nodosAutopista.elements[j].lat;
                                lon=nodosAutopista.elements[j].lon;
                                if (nodosAutopista.elements[j].tags == undefined) {  // Si no tiene tags lo marco como salida sin marcar
                                    circulo = L.circleMarker(L.latLng(lat, lon), MarkerStyleSalSinSal);
                                    circulo.bindPopup("<b>Salida sin marcar</b>");
                                    circulo.addTo(map);
                                    grupoSalSinSal.push(circulo);
                                } else if (nodosAutopista.elements[j].tags.highway !== "motorway_junction" ) {  // Si no tiene motorway_junction  
                                    circulo = L.circleMarker(L.latLng(lat, lon), MarkerStyleSalSinSal);         // lo marco como salida sin marcar
                                    circulo.bindPopup("<b>Salida sin marcar</b>");
                                    circulo.addTo(map);
                                    grupoSalSinSal.push(circulo);
                                } else if (nodosAutopista.elements[j].tags.name == undefined && nodosAutopista.elements[j].tags.exit_to == undefined) {
                                    if (viasSalidas.elements[i].tags.destination !== undefined){                    // Si tiene destination
                                        circulo = L.circleMarker(L.latLng(lat, lon), MarkerStyleSalDestination);    // lo marco como salida con destination
                                        circulo.bindPopup("<b> Salida " + nodosAutopista.elements[j].tags.ref + "</b>" + 
                                            "<br> destination: " + viasSalidas.elements[i].tags.destination + "<br/>" + 
                                            linkEditID("node", nodosAutopista.elements[j].id) );
                                        if (nodosAutopista.elements[j].tags.ref == undefined) {
                                            circulo.setStyle({fillColor:colorSalNoRef});
                                        } else {
                                            circulo.setStyle({fillColor:colorSalRef});
                                        }
                                        circulo.addTo(map);
                                        circulo.feature = {properties: nodosAutopista.elements[j]};
                                        grupoSalDestination.push(circulo);
                                    }
                                }
                            };
                        };
                    }
                };
            };

            var copiagrupoSalRef = grupoSalRef;
            var k;
            for (var i = 0; i < grupoSalDestination.length; i++) {
                for (var j = 0; j < copiagrupoSalRef.length; j++) {
                    if (copiagrupoSalRef[j].feature.properties.id == grupoSalDestination[i].feature.properties.id){
                        k = grupoSalRef.indexOf(copiagrupoSalRef[j]);
                        map.removeLayer(copiagrupoSalRef[j]);
                        grupoSalRef.splice(k,1);
                        
                    }
                };
            };
            var copiagrupoSalNoRef = grupoSalNoRef;
            var k;
            for (var i = 0; i < grupoSalDestination.length; i++) {
                for (var j = 0; j < copiagrupoSalNoRef.length; j++) {
                    if (copiagrupoSalNoRef[j].feature.properties.id == grupoSalDestination[i].feature.properties.id){
                        k = grupoSalNoRef.indexOf(copiagrupoSalNoRef[j]);
                        map.removeLayer(copiagrupoSalNoRef[j]);
                        grupoSalNoRef.splice(k,1);

                    }
                };
            };
            var copiagrupoSalNada = grupoSalNada;
            var k;
            for (var i = 0; i < grupoSalDestination.length; i++) {
                for (var j = 0; j < copiagrupoSalNada.length; j++) {
                    if (copiagrupoSalNada[j].feature.properties.id == grupoSalDestination[i].feature.properties.id){
                        k = grupoSalNada.indexOf(copiagrupoSalNada[j]);
                        map.removeLayer(copiagrupoSalNada[j]);
                        grupoSalNada.splice(k,1);
                        
                    }
                };
            };

            for (var i = 0; i < grupoSalDestination.length; i++) {
                if (grupoSalDestination[i].feature.properties.tags.ref !==undefined){
                    grupoSalRef.push(grupoSalDestination[i]);
                } else {
                    grupoSalNoRef.push(grupoSalDestination[i]);
                }
            };

            for (var i = 0; i < grupoSalDestination.length; i++) {
                map.addLayer(grupoSalDestination[i]);
            };

            //Para ocultar datos
            if (!visibSalSinSal) {
                for (var i = 0; i < grupoSalSinSal.length; i++) {
                    map.removeLayer(grupoSalSinSal[i]);
                };
            }  
            if (!visibSalDestination) {
                for (var i = 0; i < grupoSalDestination.length; i++) {
                    map.removeLayer(grupoSalDestination[i]);
                };
            }

            cargado++;
            $("div#feedback").html("Datos cargados (" + cargado + "/3) .");

        }
    )
    .fail(function() { $("div#feedback").append("Error al cargar."); });
}

function linkEditID (type, id) {    // Para obtener el link de edición en el editor ID dados el tipo de via y el ID del objeto
    return "<a target='_blank' href='http://level0.osmz.ru/?url=%2F%2Foverpass-api.de%2Fapi%2Finterpreter%3Fdata%3D%" + 
        "253Cosm-script%2520output%253D%2522xml%2522%2520timeout%253D%252225%2522%253E%250A%2520%2520%253Cunion%253E%250" + 
        "A%2520%2520%2520%2520%253Cquery%2520type%253D%2522" + type + "%2522%253E%250A%2520%2520%2520%2520%2520%2520%253Cid-query%" + 
        "2520type%253D%2522" + type + "%2522%2520ref%253D%2522" + id + 
        "%2522%252F%253E%250A%2520%2520%2520%2520%253C%252Fquery%253E%250A%2520%2520%253C%252Funion%253E%250A%2520%2520%253C" + 
        "print%2520mode%253D%2522meta%2522%252F%253E%250A%2520%2520%253Crecurse%2520type%253D%2522down%2522%252F%253E%250A%252" + 
        "0%2520%253Cprint%2520mode%253D%2522meta%2522%2520order%253D%2522quadtile%2522%252F%253E%250A%253C%252" + 
        "Fosm-script%253E'>Editar en level0</a>";
}