let url='/markers';
let markers = [];
let map;
function getData(url, cb) {
  fetch(url)
    .then(response => response.json())
    .then(result => cb(result));
}
function SetMarker() {
    //Remove previous Marker.
    clearMarkers();
//Set Marker on Map
    getData(url, (data) => {
        data.forEach(addMarker);
    })
}
function RssiToHex(rssi) {
    if (rssi > -59) {
        return "#80ff00";
    }
    if (rssi > -81) {
        return "#bfff00";
    }
    if (rssi > -101) {
        return "#ffff00";
    }
    if (rssi > -107) {
        return "#ffbf00";
    }
    if (rssi > -111) {
        return "#ff8000";
    }
    if (rssi > -160) {
        return "#ff4000";
    }
}
function initMap(){
    getData(url, (data) => {
        const first_element = data[0] ;
        let position = { lat: first_element.gps_location.latitude, lng: first_element.gps_location.longitude};
        map = new google.maps.Map(document.getElementById('map'), {
            zoom: 19,
            center: position,
        });
        data.forEach(addMarker)
        setInterval(function () {
            SetMarker()
        }, 30000);
    });
}

// ###########################################################################3

function deleteMarkers() {
    clearMarkers();
    markers = [];
}
function clearMarkers() {
    setMapOnAll(null);
}
function setMapOnAll(map) {
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

async function addMarker(item) {
    let position = { lat: item.gps_location.latitude, lng: item.gps_location.longitude};
    let rssi = item.rssi;
    const marker = new google.maps.Circle({
        strokeColor: RssiToHex(rssi),
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: RssiToHex(rssi),
        fillOpacity: 0.35,
        center: position,
        map: map,
        radius: 2
    });
    markers.push(marker);
}
function showNowLocation(){
    url = "/markers?now=True";
    SetMarker();
}
function showTodaysLocations(){
    let date = new Date();
    let today = date.getUTCFullYear() +"-"+ pad(date.getUTCMonth()) +"-"+ pad(date.getUTCDate());
    url = "/markers?start=" + today;
    SetMarker();
}
function showYesterdaysLocations(){
    let date = new Date();
    date.setDate(date.getDate() - 1);
    let yesterday = date.getUTCFullYear() +"-"+ pad(date.getUTCMonth()) +"-"+ pad(date.getUTCDate());
    url = "/markers?start=" + yesterday;
    SetMarker();
}
function pad(d) {
    return (d < 10) ? '0' + d.toString() : d.toString();
}