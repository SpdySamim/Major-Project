mapboxgl.accessToken =mapToken;
const map = new mapboxgl.Map({
container: 'map', // container ID
style:"mapbox://styles/mapbox/satellite-streets-v12",
center:listing.geometry.coordinates, // starting position [lng, lat]
zoom: 10 // starting zoom
});

const marker = new mapboxgl.Marker({color:"red"})
.setLngLat(listing.geometry.coordinates)
.setPopup(new mapboxgl.Popup({offset: 25, className: 'my-class'})
.setHTML(`<h4>${listing.title}</h4><p>Excat location provided by the owner</p>`)
.setMaxWidth("300px"))
.addTo(map);
