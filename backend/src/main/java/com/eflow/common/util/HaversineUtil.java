package com.eflow.common.util;

/**
 * Haversine formula for calculating great-circle distances between GPS coordinates.
 * Used for geofencing — determining if a student is within a stand's return radius.
 */
public final class HaversineUtil {

    private static final double EARTH_RADIUS_METERS = 6_371_000.0;

    private HaversineUtil() {
        // Utility class — no instantiation
    }

    /**
     * Calculates the great-circle distance in meters between two GPS points.
     *
     * @param lat1 Latitude of point 1 (degrees)
     * @param lng1 Longitude of point 1 (degrees)
     * @param lat2 Latitude of point 2 (degrees)
     * @param lng2 Longitude of point 2 (degrees)
     * @return Distance in meters
     */
    public static double distanceMeters(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_METERS * c;
    }
}
