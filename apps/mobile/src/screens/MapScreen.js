import React, { useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";

const binLocations = [
    {
        id: 1,
        name: "Campus Recycling Bin",
        type: "Mixed Recycling",
        address: "Ankara University Area",
        coordinate: {
            latitude: 39.781708,
            longitude: 32.819687,
        },
    },
    {
        id: 2,
        name: "Plastic Waste Bin",
        type: "Plastic",
        address: "Ankara University Area",
        coordinate: {
            latitude: 39.781372,
            longitude: 32.821052,
        },
    },
    {
        id: 3,
        name: "Cengel Cafe Waste Bin",
        type: "Glass",
        address: "Ankara University Area",
        coordinate: {
            latitude: 39.781103,
            longitude: 32.821901,
        },
    },
    {
        id: 4,
        name: "Dekanlik Waste Bin",
        type: "Paper",
        address: "Ankara University Area",
        coordinate: {
            latitude: 39.779217,
            longitude: 32.822917,
        },
    },
    {
        id: 5,
        name: "100. Yil Waste Bin",
        type: "Metal",
        address: "100. Yil",
        coordinate: {
            latitude: 39.896378,
            longitude: 32.797081,
        },
    },
];

function toRadians(value) {
    return (value * Math.PI) / 180;
}

function calculateDistanceInKm(firstPosition, secondPosition) {
    const earthRadiusKm = 6371;

    const latDifference = toRadians(secondPosition.latitude - firstPosition.latitude);
    const lngDifference = toRadians(secondPosition.longitude - firstPosition.longitude);

    const firstLat = toRadians(firstPosition.latitude);
    const secondLat = toRadians(secondPosition.latitude);

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

function getColors(theme) {
    const dark = theme === "dark";
    return {
        page: dark ? "#101813" : "#F7F8F6",
        card: dark ? "#172119" : "#FFFFFF",
        nested: dark ? "#1E2A21" : "#F2F5F1",
        border: dark ? "#2D3B30" : "#E1E6DE",
        active: dark ? "#1F3827" : "#E8F3EC",
        activeBorder: dark ? "#7FD69A" : "#236B45",
        soft: dark ? "#1F3827" : "#E8F3EC",
        text: dark ? "#EDF4EE" : "#17221B",
        muted: dark ? "#BAC8BD" : "#5F6F64",
    };
}

export default function MapScreen({ theme = "light" }) {
    const mapRef = useRef(null);

    const [selectedLocationId, setSelectedLocationId] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const initialRegion = {
        latitude: 39.9285,
        longitude: 32.8428,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
    };
    const colors = getColors(theme);

    const sortedLocations = useMemo(() => {
        if (!userLocation) {
            return binLocations;
        }

        return [...binLocations]
            .map((location) => ({
                ...location,
                distance: calculateDistanceInKm(userLocation, location.coordinate),
            }))
            .sort((firstLocation, secondLocation) => {
                return firstLocation.distance - secondLocation.distance;
            });
    }, [userLocation]);

    async function getCurrentLocation() {
        try {
            setIsRefreshing(true);

            const permission = await Location.requestForegroundPermissionsAsync();

            if (permission.status !== "granted") {
                Alert.alert(
                    "Location permission needed",
                    "Please allow location permission to show your current location."
                );
                return null;
            }

            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const newUserLocation = {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
            };

            setUserLocation(newUserLocation);

            return newUserLocation;
        } catch (error) {
            Alert.alert("Location error", "Could not get your current location.");
            return null;
        } finally {
            setIsRefreshing(false);
        }
    }

    async function handleShowMyLocation() {
        const currentLocation = await getCurrentLocation();

        if (!currentLocation || !mapRef.current) {
            return;
        }

        mapRef.current.animateToRegion(
            {
                ...currentLocation,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            },
            700
        );
    }

    function focusBinLocation(location) {
        setSelectedLocationId(location.id);

        mapRef.current?.animateToRegion(
            {
                latitude: location.coordinate.latitude,
                longitude: location.coordinate.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
            },
            700
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.page }]}>
            <View style={[styles.container, { backgroundColor: colors.page }]}>
                <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View>
                        <Text style={styles.eyebrow}>Recycling Map</Text>
                        <Text style={[styles.title, { color: colors.text }]}>Waste Bin Locations</Text>
                        <Text style={[styles.subtitle, { color: colors.muted }]}>
                            See selected recycling bin points and sort them by your location.
                        </Text>
                    </View>

                    <View style={[styles.countBox, { backgroundColor: colors.soft, borderColor: colors.activeBorder }]}>
                        <Text style={styles.countNumber}>{binLocations.length}</Text>
                        <Text style={[styles.countLabel, { color: colors.muted }]}>points</Text>
                    </View>
                </View>

                <View style={[styles.mapCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        initialRegion={initialRegion}
                        showsUserLocation={!!userLocation}
                        showsMyLocationButton={false}
                    >
                        {binLocations.map((location) => (
                            <Marker
                                key={location.id}
                                coordinate={location.coordinate}
                                title={location.name}
                                description={`${location.type} - ${location.address}`}
                                pinColor={selectedLocationId === location.id ? "#174A31" : "#236B45"}
                                onPress={() => setSelectedLocationId(location.id)}
                            />
                        ))}
                    </MapView>

                    <Pressable
                        style={({ pressed }) => [
                            styles.myLocationButton,
                            { backgroundColor: colors.card },
                            pressed && styles.buttonPressed,
                        ]}
                        onPress={handleShowMyLocation}
                        disabled={isRefreshing}
                    >
                        {isRefreshing ? (
                            <ActivityIndicator size="small" color={colors.text} />
                        ) : (
                            <Text style={[styles.myLocationButtonText, { color: colors.text }]}>My Location</Text>
                        )}
                    </Pressable>
                </View>

                <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.listHeader}>
                        <View>
                            <Text style={[styles.listTitle, { color: colors.text }]}>Saved Bin Points</Text>
                            <Text style={[styles.listSubtitle, { color: colors.muted }]}>
                                {userLocation
                                    ? "Sorted by nearest location"
                                    : "Refresh location to sort by distance"}
                            </Text>
                        </View>

                        <Pressable
                            style={({ pressed }) => [
                                styles.refreshButton,
                                pressed && styles.buttonPressed,
                            ]}
                            onPress={getCurrentLocation}
                            disabled={isRefreshing}
                        >
                            <Text style={styles.refreshButtonText}>
                                {isRefreshing ? "..." : "Refresh"}
                            </Text>
                        </Pressable>
                    </View>

                    <FlatList
                        data={sortedLocations}
                        keyExtractor={(item) => String(item.id)}
                        style={styles.locationList}
                        contentContainerStyle={styles.locationListContent}
                        showsVerticalScrollIndicator
                        renderItem={({ item }) => {
                            const isSelected = selectedLocationId === item.id;

                            return (
                                <Pressable
                                    style={[
                                        styles.locationItem,
                                        {
                                            backgroundColor: isSelected ? colors.active : colors.nested,
                                            borderColor: isSelected ? colors.activeBorder : colors.border,
                                        },
                                    ]}
                                    onPress={() => focusBinLocation(item)}
                                >
                                    <View style={styles.locationIcon}>
                                        <Text style={styles.locationIconText}>R</Text>
                                    </View>

                                    <View style={styles.locationTextArea}>
                                        <Text style={[styles.locationName, { color: colors.text }]}>{item.name}</Text>
                                        <Text style={styles.locationType}>{item.type}</Text>
                                        <Text style={[styles.locationAddress, { color: colors.muted }]}>{item.address}</Text>
                                        <Text style={[styles.locationDistance, { color: colors.text }]}>
                                            {formatDistance(item.distance)}
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        }}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F7F8F6",
    },
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#F7F8F6",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 14,
        marginBottom: 14,
        padding: 18,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E1E6DE",
    },
    eyebrow: {
        color: "#236B45",
        fontSize: 11,
        fontWeight: "900",
        textTransform: "uppercase",
        marginBottom: 6,
    },
    title: {
        color: "#17221B",
        fontSize: 22,
        fontWeight: "900",
        marginBottom: 6,
    },
    subtitle: {
        color: "#5F6F64",
        fontSize: 13,
        lineHeight: 19,
        maxWidth: 230,
    },
    countBox: {
        width: 74,
        height: 74,
        borderRadius: 16,
        backgroundColor: "#E8F3EC",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#CBD6C8",
    },
    countNumber: {
        color: "#236B45",
        fontSize: 26,
        fontWeight: "900",
    },
    countLabel: {
        color: "#5F6F64",
        fontSize: 11,
        fontWeight: "800",
    },
    mapCard: {
        height: 330,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E1E6DE",
        marginBottom: 14,
    },
    map: {
        flex: 1,
    },
    myLocationButton: {
        position: "absolute",
        top: 14,
        right: 14,
        minHeight: 42,
        paddingHorizontal: 15,
        borderRadius: 10,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#0F172A",
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 5,
    },
    myLocationButtonText: {
        color: "#17221B",
        fontSize: 13,
        fontWeight: "900",
    },
    listCard: {
        flex: 1,
        minHeight: 280,
        padding: 14,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E1E6DE",
    },
    listHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 12,
    },
    listTitle: {
        color: "#17221B",
        fontSize: 17,
        fontWeight: "900",
    },
    listSubtitle: {
        color: "#5F6F64",
        fontSize: 12,
        marginTop: 4,
    },
    refreshButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#236B45",
    },
    refreshButtonText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "900",
    },
    locationList: {
        maxHeight: 390,
    },
    locationListContent: {
        gap: 10,
        paddingBottom: 8,
    },
    locationItem: {
        flexDirection: "row",
        gap: 12,
        padding: 12,
        borderRadius: 14,
        backgroundColor: "#F2F5F1",
        borderWidth: 1,
        borderColor: "#E1E6DE",
    },
    locationItemActive: {
        backgroundColor: "#ECFDF5",
        borderColor: "#86EFAC",
    },
    locationIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: "#236B45",
        alignItems: "center",
        justifyContent: "center",
    },
    locationIconText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "900",
    },
    locationTextArea: {
        flex: 1,
    },
    locationName: {
        color: "#17221B",
        fontSize: 14,
        fontWeight: "900",
        marginBottom: 3,
    },
    locationType: {
        color: "#236B45",
        fontSize: 12,
        fontWeight: "800",
        marginBottom: 2,
    },
    locationAddress: {
        color: "#5F6F64",
        fontSize: 12,
        marginBottom: 4,
    },
    locationDistance: {
        color: "#17221B",
        fontSize: 12,
        fontWeight: "900",
    },
    buttonPressed: {
        opacity: 0.75,
    },
});
