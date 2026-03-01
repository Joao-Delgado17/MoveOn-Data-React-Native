import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Animated,
  Pressable,
  LayoutChangeEvent,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";

import { appendDeliveryTurnLog } from "./DeliveryTurnLog";

type RootStackParamList = {
  addItemDeliveryScreen: undefined;
};

const TASKS_KEY = "TASKS";
const DELIVERY_KEY = "delivery_entregas";
const RECOLHAS_KEY = "delivery_recolhas";

const GOOGLE_SHEETS_API_URL =
  "https://script.google.com/macros/s/AKfycbwoyiWWxn95qvS1xF2PLsZGzWywL-z0Qh0F5m8LCKRd-qmXR8KtxZ8TqwrclYbAj0IV/exec";

const DeliveryCard: React.FC<{ disabled?: boolean }> = ({ disabled = false }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [data, setData] = useState({ Entregas: 0, Recolhas: 0 });
  const [expanded, setExpanded] = useState(false);

  const collapsedH = 190;
  const expandedH = 240;

  const animatedHeight = useRef(new Animated.Value(collapsedH)).current;

  const cardWidthRef = useRef(0);
  const pressXRef = useRef<number>(0);
  const ignoreNextPressRef = useRef(false);

  const loadData = async () => {
    const storedTasks = await AsyncStorage.getItem(TASKS_KEY);
    const tasks = storedTasks ? JSON.parse(storedTasks) : {};
    setData({
      Entregas: tasks[DELIVERY_KEY] ?? 0,
      Recolhas: tasks[RECOLHAS_KEY] ?? 0,
    });
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation]);

  const setHeight = (isExpanded: boolean) => {
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? expandedH : collapsedH,
      duration: 240,
      useNativeDriver: false,
    }).start();
  };

  const toggleExpand = () => {
    if (disabled) return;

    ignoreNextPressRef.current = true;

    const next = !expanded;
    setExpanded(next);
    setHeight(next);

    setTimeout(() => {
      ignoreNextPressRef.current = false;
    }, 160);
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return null;

      const loc = await Location.getCurrentPositionAsync({});
      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
    } catch {
      return null;
    }
  };

  const logDeliveryTask = async (taskName: "Entregas" | "Recolhas", delta: number) => {
    if (delta === 0) return;

    try {
      const now = new Date();
      const dateString = now.toLocaleDateString("pt-PT");
      const timeString = now.toLocaleTimeString("pt-PT");

      const username = (await AsyncStorage.getItem("USERNAME")) || "Desconhecido";
      const userCity = (await AsyncStorage.getItem("CITY")) || "Desconhecido";

      const currentLocation = await getCurrentLocation();
      if (!currentLocation) return;

      const payload = {
        logs: [
          {
            Utilizador: username,
            Data: dateString,
            Hora: timeString,
            Cidade: userCity,
            Operador: "Delivery",
            Tarefa: taskName,
            Quantidade: delta,
            Latitude: currentLocation.latitude,
            Longitude: currentLocation.longitude,
          },
        ],
      };

      const res = await fetch(GOOGLE_SHEETS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!result?.success) {
        console.warn("⚠️ API rejeitou log:", result);
      }
    } catch (err) {
      console.error("❌ Erro ao enviar log Delivery:", err);
    }
  };

  // ⚡ mantém o atalho de segurar para Entregas (como já tinhas)
  const changeEntrega = async (delta: number) => {
    if (disabled) return;

    const stored = await AsyncStorage.getItem(TASKS_KEY);
    const tasks = stored ? JSON.parse(stored) : {};

    const current = tasks[DELIVERY_KEY] ?? 0;
    const next = Math.max(0, current + delta);

    if (next === current) return;

    tasks[DELIVERY_KEY] = next;
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));

    setData((prev) => ({ ...prev, Entregas: next }));

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    // ✅ log remoto
    void logDeliveryTask("Entregas", delta);

    // ✅ log local (histórico) - mantém como estava
    await appendDeliveryTurnLog("Entregas", delta);
  };

  const onPressCard = () => {
    if (disabled) return;

    if (ignoreNextPressRef.current) {
      ignoreNextPressRef.current = false;
      return;
    }

    navigation.navigate("addItemDeliveryScreen");
  };

  const onLongPressCard = async () => {
    if (disabled) return;

    const w = cardWidthRef.current || 0;
    const x = pressXRef.current || 0;
    if (!w) return;

    const leftLimit = w * 0.4;
    const rightLimit = w * 0.6;

    ignoreNextPressRef.current = true;

    if (x < leftLimit) {
      await changeEntrega(-1);
    } else if (x > rightLimit) {
      await changeEntrega(+1);
    }

    setTimeout(() => {
      ignoreNextPressRef.current = false;
    }, 160);
  };

  const onLayoutCard = (e: LayoutChangeEvent) => {
    cardWidthRef.current = e.nativeEvent.layout.width;
  };

  return (
    <Animated.View
      style={[styles.card, { height: animatedHeight }, disabled && styles.disabledCard]}
      onLayout={onLayoutCard}
    >
      <Pressable
        style={{ flex: 1 }}
        disabled={disabled}
        onPress={onPressCard}
        onLongPress={onLongPressCard}
        delayLongPress={260}
        onPressIn={(e) => {
          pressXRef.current = e.nativeEvent.locationX;
        }}
      >
        <ImageBackground
          source={require("../../assets/images/last_mile_delivery.png")}
          style={styles.backgroundImage}
          imageStyle={{ opacity: 0.2, borderRadius: 16 }}
        >
          <LinearGradient
            colors={["rgba(66,66,66,0.82)", "rgba(66,66,66,0.45)"]}
            style={styles.overlay}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Last Mile</Text>

              <TouchableOpacity onPress={toggleExpand} disabled={disabled}>
                <MaterialIcons
                  name={expanded ? "expand-less" : "expand-more"}
                  size={26}
                  color="white"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.actionRow} pointerEvents="none">
              <View style={[styles.actionZone, styles.leftZone]}>
                <Text style={styles.actionSmall}>SEGURAR</Text>
                <Text style={styles.actionBig}>−1</Text>
              </View>

              <View style={styles.centerZone}>
                <Text style={styles.centerLabel}>ENTREGAS</Text>
                <Text style={styles.centerValue}>{data.Entregas}</Text>
              </View>

              <View style={[styles.actionZone, styles.rightZone]}>
                <Text style={styles.actionSmall}>SEGURAR</Text>
                <Text style={styles.actionBig}>+1</Text>
              </View>
            </View>

            {/* ✅ Recolhas sempre visível */}
            <View style={styles.recolhasRow} pointerEvents="none">
              <Text style={styles.recolhasLabel}>RECOLHAS</Text>
              <Text style={styles.recolhasValue}>{data.Recolhas}</Text>
            </View>

            {expanded && (
              <View style={styles.table}>
                <View style={styles.row}>
                  <Text style={styles.cell}>Entregas</Text>
                  <Text style={styles.value}>{data.Entregas}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.cell}>Recolhas</Text>
                  <Text style={styles.value}>{data.Recolhas}</Text>
                </View>
              </View>
            )}
          </LinearGradient>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    backgroundColor: "rgba(66,66,66,0.8)",
  },
  disabledCard: { opacity: 0.5 },
  backgroundImage: { width: "100%", height: "100%" },
  overlay: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-start",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#FFF" },

  actionRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  actionZone: {
    width: "40%",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  leftZone: {
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.12)",
  },
  rightZone: {
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.12)",
  },
  actionSmall: {
    fontSize: 11,
    color: "rgba(255,255,255,0.78)",
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  actionBig: {
    marginTop: 2,
    fontSize: 18,
    color: "#fff",
    fontWeight: "900",
  },

  centerZone: {
    width: "20%",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  centerLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  centerValue: {
    marginTop: 2,
    fontSize: 22,
    color: "#fbbf24",
    fontWeight: "900",
  },

  recolhasRow: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recolhasLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.4,
  },
  recolhasValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
  },

  table: { marginTop: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.18)",
  },
  cell: { fontSize: 16, color: "#FFF" },
  value: { fontSize: 16, fontWeight: "bold", color: "#FFF" },
});

export default DeliveryCard;