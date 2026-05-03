import {
    APIProvider,
    AdvancedMarker,
    InfoWindow,
    Map as GoogleMap,
    useMap,
} from "@vis.gl/react-google-maps";
import { useMemo, useState } from "react";

import MainLayout from "../layouts/MainLayout.jsx";
import "../styles/map-page.css";

const binLocations = [
    {
        id: 1,
        name: "Campus Recycling Bin",
        type: "Mixed Recycling",
        address: "Ankara University Area",
        position: {
            lat: 39.781708,
            lng: 32.819687,
        },
    },
    {
        id: 2,
        name: "Plastic Waste Bin",
        type: "Plastic & Paper",
        address: "Ankara University Area",
        position: {
            lat: 39.781372,
            lng: 32.821052,
        },
    },
    {
        id: 3,
        name: "Çengel Cafe Waste Bin",
        type: "Glass",
        address: "Ankara University Area",
        position: {
            lat: 39.781103,
            lng: 32.821901,
        },
    },
    {
        id: 4,
        name: "Dekanlık Waste Bin",
        type: "Paper",
        address: "Ankara University Area",
        position: {
            lat: 39.779217,
            lng: 32.822917,
        },
    },
    {
        id: 5,
        name: "100.Yıl Waste Bin",
        type: "Mixed Recycling",
        address: "100.Yıl",
        position: {
            lat: 39.896378,
            lng: 32.797081,
        },
    },
];

function toRadians(value) {
    return (value * Math.PI) / 180;
}

function calculateDistanceInKm(firstPosition, secondPosition) {
    const earthRadiusKm = 6371;

    const latDifference = toRadians(secondPosition.lat - firstPosition.lat);
    const lngDifference = toRadians(secondPosition.lng - firstPosition.lng);

    const firstLat = toRadians(firstPosition.lat);
    const secondLat = toRadians(secondPosition.lat);

    const a =
        Math.sin(latDifference / 2) * Math.sin(latDifference / 2) +
        Math.cos(firstLat) *
        Math.cos(secondLat) *
        Math.sin(lngDifference / 2) *
        Math.sin(lngDifference / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
}

function formatDistance(distance) {
    if (distance == null) {
        return "Location needed";
    }

    if (distance < 1) {
        return `${Math.round(distance * 1000)} m away`;
    }

    return `${distance.toFixed(2)} km away`;
}

function MapContent({
                        center,
                        locations,
                        selectedLocation,
                        setSelectedLocation,
                        userPosition,
                        showMyLocation,
                    }) {
    const map = useMap();

    function handleShowMyLocation() {
        showMyLocation((position) => {
            if (map) {
                map.panTo(position);
                map.setZoom(16);
            }
        });
    }

    return (
        <div className="map-page__map-wrapper">
            <GoogleMap
                className="map-page__map"
                defaultCenter={center}
                defaultZoom={13}
                mapId="smart-recycle-map"
                gestureHandling="greedy"
                disableDefaultUI={false}
            >
                {locations.map((location) => (
                    <AdvancedMarker
                        key={location.id}
                        position={location.position}
                        title={location.name}
                        onClick={() => setSelectedLocation(location)}
                    >
                        <div className="map-page__marker">♻</div>
                    </AdvancedMarker>
                ))}

                {userPosition && (
                    <AdvancedMarker position={userPosition} title="Your Location">
                        <div className="map-page__user-marker">●</div>
                    </AdvancedMarker>
                )}

                {selectedLocation && (
                    <InfoWindow
                        position={selectedLocation.position}
                        onCloseClick={() => setSelectedLocation(null)}
                    >
                        <div className="map-page__info-window">
                            <h3>{selectedLocation.name}</h3>
                            <p>{selectedLocation.type}</p>
                            <span>{selectedLocation.address}</span>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>

            <button
                className="map-page__my-location-btn"
                type="button"
                onClick={handleShowMyLocation}
            >
                📍 My Location
            </button>
        </div>
    );
}

export default function MapPage() {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    const [selectedLocation, setSelectedLocation] = useState(null);
    const [userPosition, setUserPosition] = useState(null);
    const [locationError, setLocationError] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const center = useMemo(() => {
        return {
            lat: 39.9285,
            lng: 32.8428,
        };
    }, []);

    const sortedLocations = useMemo(() => {
        if (!userPosition) {
            return binLocations;
        }

        return [...binLocations]
            .map((location) => ({
                ...location,
                distance: calculateDistanceInKm(userPosition, location.position),
            }))
            .sort((firstLocation, secondLocation) => {
                return firstLocation.distance - secondLocation.distance;
            });
    }, [userPosition]);

    function refreshUserLocation(onSuccess) {
        setLocationError("");
        setIsRefreshing(true);

        if (!navigator.geolocation) {
            setLocationError("Your browser does not support location access.");
            setIsRefreshing(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newUserPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                setUserPosition(newUserPosition);
                setIsRefreshing(false);

                if (onSuccess) {
                    onSuccess(newUserPosition);
                }
            },
            () => {
                setLocationError("Location permission is needed to show your location.");
                setIsRefreshing(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    }

    function showMyLocation(onSuccess) {
        refreshUserLocation(onSuccess);
    }

    if (!apiKey) {
        return (
            <MainLayout>
                <section className="map-page">
                    <div className="map-page__header">
                        <p className="map-page__eyebrow">Recycling Map</p>
                        <h1 className="map-page__title">Waste Bin Locations</h1>
                        <p className="map-page__subtitle">
                            Google Maps API key is missing. Please add
                            VITE_GOOGLE_MAPS_API_KEY to your .env.local file.
                        </p>
                    </div>

                    <div className="map-page__empty">
                        <strong>Map cannot be loaded.</strong>
                        <span>Check your API key and restart the Vite server.</span>
                    </div>
                </section>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <section className="map-page">
                <div className="map-page__header">
                    <div>
                        <p className="map-page__eyebrow">Recycling Map</p>
                        <h1 className="map-page__title">Waste Bin Locations</h1>
                        <p className="map-page__subtitle">
                            View selected recycling bin locations on the map. Click a pin to
                            see details.
                        </p>
                    </div>

                    <div className="map-page__count">
                        <span>{binLocations.length}</span>
                        <small>saved locations</small>
                    </div>
                </div>

                <div className="map-page__content">
                    <div className="map-page__map-card">
                        <APIProvider apiKey={apiKey}>
                            <MapContent
                                center={center}
                                locations={binLocations}
                                selectedLocation={selectedLocation}
                                setSelectedLocation={setSelectedLocation}
                                userPosition={userPosition}
                                showMyLocation={showMyLocation}
                            />
                        </APIProvider>
                    </div>

                    <aside className="map-page__list">
                        <div className="map-page__list-header">
                            <div>
                                <h2>Saved Bin Points</h2>
                                <p>
                                    {userPosition
                                        ? "Sorted by nearest location"
                                        : "Refresh location to sort by distance"}
                                </p>
                            </div>

                            <button
                                className="map-page__refresh-btn"
                                type="button"
                                onClick={() => refreshUserLocation()}
                                disabled={isRefreshing}
                            >
                                {isRefreshing ? "Refreshing..." : "Refresh"}
                            </button>
                        </div>

                        {locationError && (
                            <div className="map-page__location-error">{locationError}</div>
                        )}

                        <div className="map-page__location-scroll">
                            {sortedLocations.map((location) => (
                                <button
                                    key={location.id}
                                    className={
                                        selectedLocation?.id === location.id
                                            ? "map-page__location map-page__location--active"
                                            : "map-page__location"
                                    }
                                    type="button"
                                    onClick={() => setSelectedLocation(location)}
                                >
                                    <span className="map-page__location-icon">♻</span>

                                    <span className="map-page__location-text">
                                        <strong>{location.name}</strong>
                                        <small>{location.type}</small>
                                        <em>{location.address}</em>
                                        <b>{formatDistance(location.distance)}</b>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </aside>
                </div>
            </section>
        </MainLayout>
    );
}