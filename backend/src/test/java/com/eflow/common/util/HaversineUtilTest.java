package com.eflow.common.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class HaversineUtilTest {

    @Test
    void testSameLocationDistanceIsZero() {
        double dist = HaversineUtil.distanceMeters(12.7500, 80.1970, 12.7500, 80.1970);
        assertEquals(0.0, dist, 0.001);
    }

    @Test
    void testKnownDistanceAccuracy() {
        // SSN Main Gate to SSN Clock Tower (~300m)
        double lat1 = 12.7511;
        double lng1 = 80.1965;
        double lat2 = 12.7535;
        double lng2 = 80.1980;

        double dist = HaversineUtil.distanceMeters(lat1, lng1, lat2, lng2);
        assertTrue(dist > 250 && dist < 350, "Distance should be approximately ~315 meters, got: " + dist);
    }
}
