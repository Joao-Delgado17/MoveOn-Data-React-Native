import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";

export type DeliveryLogItem = {
  id: string;
  ts: number;
  time: string; // "HH:mm:ss"
  task?: string; // "Entregas" | "Recolhas" (compat com logs antigos)
  delta: number; // +x / -x
};

const LOG_KEY = "DELIVERY_TURN_LOG";

const formatTime = (d: Date) =>
  d.toLocaleTimeString("pt-PT", { hour12: false });

export const appendDeliveryTurnLog = async (task: string, delta: number) => {
  if (!delta) return;

  const now = new Date();
  const item: DeliveryLogItem = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    ts: Date.now(),
    time: formatTime(now),
    task,
    delta,
  };

  const raw = await AsyncStorage.getItem(LOG_KEY);
  const arr: DeliveryLogItem[] = raw ? JSON.parse(raw) : [];

  arr.unshift(item);
  await AsyncStorage.setItem(LOG_KEY, JSON.stringify(arr.slice(0, 200)));

  return item;
};

export const clearDeliveryTurnLog = async () => {
  await AsyncStorage.removeItem(LOG_KEY);
};

const DeliveryTurnLog: React.FC = () => {
  const [items, setItems] = useState<DeliveryLogItem[]>([]);

  // ✅ “tempo real” enquanto o ecrã estiver focado
  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const run = async () => {
        try {
          const raw = await AsyncStorage.getItem(LOG_KEY);
          const arr: DeliveryLogItem[] = raw ? JSON.parse(raw) : [];
          if (mounted) setItems(arr);
        } catch {
          if (mounted) setItems([]);
        }
      };

      run();
      const id = setInterval(run, 450);

      return () => {
        mounted = false;
        clearInterval(id);
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Histórico</Text>
        <Text style={styles.subTitle}>deste turno</Text>
      </View>

      <View style={styles.spacer} />

      {!items.length ? (
        <Text style={styles.emptyText}>Ainda sem registos.</Text>
      ) : (
        <View style={styles.listWrap}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {items.map((it, idx) => {
              const isUp = it.delta > 0;
              const taskName = it.task || "Entregas"; // compat logs antigos

              return (
                <View
                  key={it.id}
                  style={[styles.row, idx !== 0 && styles.rowDivider]}
                >
                  <View
                    style={[styles.chip, isUp ? styles.chipUp : styles.chipDown]}
                  >
                    <MaterialIcons
                      name={isUp ? "north-east" : "south-east"}
                      size={14}
                      color="#fff"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.chipText}>
                      {isUp ? `+${it.delta}` : `${it.delta}`}
                    </Text>
                  </View>

                  <Text style={styles.desc} numberOfLines={1}>
                    {taskName}
                  </Text>

                  <Text style={styles.time} numberOfLines={1}>
                    {it.time}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.14)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: "rgba(255,255,255,0.92)",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.2,
  },
  subTitle: {
    color: "rgba(255,255,255,0.55)",
    fontWeight: "700",
    fontSize: 12,
  },

  spacer: { height: 12 },

  emptyText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "700",
    paddingVertical: 6,
  },

  listWrap: {
    maxHeight: 220,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  scrollContent: {
    paddingVertical: 8,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  chipUp: {
    backgroundColor: "rgba(34,197,94,0.22)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.42)",
  },
  chipDown: {
    backgroundColor: "rgba(239,68,68,0.22)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.42)",
  },
  chipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },

  desc: {
    flex: 1,
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    fontWeight: "800",
  },

  time: {
    width: 82,
    textAlign: "right",
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});

export default DeliveryTurnLog;