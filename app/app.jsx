import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Accelerometer, Magnetometer } from "expo-sensors";

export default function App() {
  const initialPosition = {
    latitude: 12.945639,
    longitude: 80.211410,
  };

  const [position, setPosition] = useState(initialPosition);
  const [trail, setTrail] = useState([initialPosition]);
  const [stepCount, setStepCount] = useState(0);
  const [heading, setHeading] = useState(0);
  const [accData, setAccData] = useState({ x: 0, y: 0, z: 0 });
  const [paused, setPaused] = useState(false);

  const prevAy = useRef(0);
  const headingRef = useRef(0);
  const recordedHeading = useRef(null);

  const STEP_LENGTH = 10; // meters
  const STEP_THRESHOLD = -0.17;

  useEffect(() => {
    const accSub = Accelerometer.addListener(({ x, y, z }) => {
      if (paused && recordedHeading.current !== null) {
        setAccData({ x, y, z });
        detectStep(y);
      }
    });
    Accelerometer.setUpdateInterval(100);

    const magSub = Magnetometer.addListener(({ x, y }) => {
      const h = calculateHeading(x, y);
      headingRef.current = h;
      setHeading(h);
    });
    Magnetometer.setUpdateInterval(100);

    return () => {
      accSub?.remove();
      magSub?.remove();
    };
  }, [paused]);

  const detectStep = (ay) => {
    if (prevAy.current < STEP_THRESHOLD && ay >= STEP_THRESHOLD) {
      if (!recordedHeading.current) return; // don't move unless paused heading is saved
      const currentHeading = recordedHeading.current;
      const { latitude, longitude } = vincentyDirect(
        position.latitude,
        position.longitude,
        currentHeading,
        STEP_LENGTH
      );
      const newPos = { latitude, longitude };
      setPosition(newPos);
      setTrail((prev) => [...prev, newPos]);
      setStepCount((c) => c + 1);
    }
    prevAy.current = ay;
  };

  const calculateHeading = (Bx, By) => {
    const headingRad = Math.atan2(-Bx, By);
    const headingDeg = (headingRad * 180) / Math.PI;
    return headingDeg < 0 ? headingDeg + 360 : headingDeg;
  };

  const vincentyDirect = (lat1, lon1, bearingDeg, distanceM) => {
    const a = 6378137.0;
    const f = 1 / 298.257223563;
    const b = (1 - f) * a;

    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;

    const φ1 = toRad(lat1);
    const λ1 = toRad(lon1);
    const α1 = toRad(bearingDeg);

    const sinα1 = Math.sin(α1);
    const cosα1 = Math.cos(α1);

    const tanU1 = (1 - f) * Math.tan(φ1);
    const cosU1 = 1 / Math.sqrt(1 + tanU1 * tanU1);
    const sinU1 = tanU1 * cosU1;

    const σ1 = Math.atan2(tanU1, cosα1);
    const sinα = cosU1 * sinα1;
    const cosSqα = 1 - sinα * sinα;
    const uSq = (cosSqα * (a * a - b * b)) / (b * b);
    const A = 1 + (uSq / 16384) *
      (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    const B = (uSq / 1024) *
      (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));

    let σ = distanceM / (b * A);
    let σPrev;
    for (let i = 0; i < 100; i++) {
      const cos2σm = Math.cos(2 * σ1 + σ);
      const sinσ = Math.sin(σ);
      const cosσ = Math.cos(σ);
      const Δσ = B * sinσ * (cos2σm + (B / 4) *
        (cosσ * (-1 + 2 * cos2σm ** 2) -
          (B / 6) * cos2σm * (-3 + 4 * sinσ ** 2) *
          (-3 + 4 * cos2σm ** 2)));
      σPrev = σ;
      σ = distanceM / (b * A) + Δσ;
      if (Math.abs(σ - σPrev) < 1e-12) break;
    }

    const tmp = sinU1 * Math.sin(σ) - cosU1 * Math.cos(σ) * cosα1;
    const φ2 = Math.atan2(
      sinU1 * Math.cos(σ) + cosU1 * Math.sin(σ) * cosα1,
      (1 - f) * Math.sqrt(sinα * sinα + tmp * tmp)
    );

    const λ = Math.atan2(
      Math.sin(σ) * sinα1,
      cosU1 * Math.cos(σ) - sinU1 * Math.sin(σ) * cosα1
    );

    const C = (f / 16) * cosSqα * (4 + f * (4 - 3 * cosSqα));
    const L = λ - (1 - C) * f * sinα *
      (σ + C * Math.sin(σ) *
        (Math.cos(2 * σ1 + σ) + C * Math.cos(σ) *
          (-1 + 2 * Math.cos(2 * σ1 + σ) ** 2)));

    const λ2 = λ1 + L;

    return {
      latitude: toDeg(φ2),
      longitude: toDeg(λ2),
    };
  };

  const totalDistance = (stepCount * STEP_LENGTH).toFixed(2);

  const handleReset = () => {
    setPosition(initialPosition);
    setTrail([initialPosition]);
    setStepCount(0);
    recordedHeading.current = null;
  };

  const togglePause = () => {
    setPaused((prev) => {
      const next = !prev;
      if (next) {
        recordedHeading.current = headingRef.current;
      }
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={{
          ...position,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
        }}
      >
        <Polyline coordinates={trail} strokeWidth={4} strokeColor="blue" />
        <Marker coordinate={position}>
          <View style={{ transform: [{ rotate: `${heading}deg` }] }}>
            <Text style={{ fontSize: 20 }}>🧭</Text>
          </View>
        </Marker>
      </MapView>

      <View style={styles.info}>
        <Text>Steps: {stepCount}</Text>
        <Text>Lat: {position.latitude.toFixed(7)}</Text>
        <Text>Lon: {position.longitude.toFixed(7)}</Text>
        <Text>Live Heading: {heading.toFixed(2)}°</Text>
        <Text>Paused Heading: {recordedHeading.current?.toFixed(2) ?? "N/A"}°</Text>
      </View>

      <View style={styles.displacementBar}>
        <Text style={styles.displacementText}>
          🚶 Displacement: {totalDistance} meters
        </Text>
      </View>

      <View style={styles.sensorBar}>
        <Text style={styles.sensorText}>
          📟 Accelerometer:{"\n"}
          ax = {accData.x.toFixed(3)}  ay = {accData.y.toFixed(3)}  az = {accData.z.toFixed(3)}
        </Text>
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
        <Text style={styles.resetText}>🔄 Reset</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.resetButton,
          {
            top: 100,
            backgroundColor: paused ? "#4caf50" : "#ffa500",
          },
        ]}
        onPress={togglePause}
      >
        <Text style={styles.resetText}>
          {paused ? "▶️ Resume" : "⏸️ Pause"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  info: {
    position: "absolute",
    bottom: 170,
    left: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 10,
    borderRadius: 10,
  },
  displacementBar: {
    position: "absolute",
    bottom: 120,
    left: 10,
    right: 10,
    backgroundColor: "#222",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  displacementText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  sensorBar: {
    position: "absolute",
    bottom: 60,
    left: 10,
    right: 10,
    backgroundColor: "#fffc",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  sensorText: {
    fontSize: 14,
    color: "#222",
    fontWeight: "600",
  },
  resetButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#ff5555",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
