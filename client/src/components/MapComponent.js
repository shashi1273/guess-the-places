import React from 'react';
import Map, { Marker } from 'react-map-gl';

function MapComponent({ onMapClick }) {
  return (
    <Map
      initialViewState={{ longitude: 0, latitude: 0, zoom: 2 }}
      style={{ width: '100vw', height: '400px' }}
      mapStyle="mapbox://styles/mapbox/streets-v11"
      mapboxAccessToken={import.meta.env.VITE_REACT_APP_MAPBOX_TOKEN}
      onClick={e => onMapClick(e.lngLat)}
    />
  );
}

export default MapComponent;
