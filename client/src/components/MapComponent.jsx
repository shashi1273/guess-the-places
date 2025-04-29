import Map from 'react-map-gl';
import mapboxgl from 'mapbox-gl';  // 👈 Add this line!

function MapComponent({ onMapClick }) {
  return (
    <Map
      mapboxAccessToken={import.meta.env.VITE_REACT_APP_MAPBOX_TOKEN}
      mapLib={mapboxgl}   // 👈 Add this prop!
      initialViewState={{
        longitude: 0,
        latitude: 0,
        zoom: 2,
      }}
      style={{ width: '100vw', height: '400px' }}
      mapStyle="mapbox://styles/mapbox/streets-v11"
      onClick={(e) => onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng })}  
    />
  );
}

export default MapComponent;

