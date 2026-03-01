import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { appendDeliveryTurnLog } from "../components/operation_cards/DeliveryTurnLog"; // ✅ ajusta o path se necessário

const GOOGLE_SHEETS_API_URL =
  "https://script.google.com/macros/s/AKfycbwoyiWWxn95qvS1xF2PLsZGzWywL-z0Qh0F5m8LCKRd-qmXR8KtxZ8TqwrclYbAj0IV/exec";

const AddItemDeliveryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [isLoading, setIsLoading] = useState(false);

  const [currentValues, setCurrentValues] = useState({
    entregas: 0,
    recolhas: 0,
  });

  const [adjustedCounts, setAdjustedCounts] = useState({
    entregas: 0,
    recolhas: 0,
  });

  const loadCurrentValues = async () => {
    const storedTasks = await AsyncStorage.getItem("TASKS");
    const tasks = storedTasks ? JSON.parse(storedTasks) : {};

    setCurrentValues({
      entregas: tasks["delivery_entregas"] ?? 0,
      recolhas: tasks["delivery_recolhas"] ?? 0,
    });
  };

  useEffect(() => {
    loadCurrentValues();
    const unsubscribe = navigation.addListener("focus", loadCurrentValues);
    return unsubscribe;
  }, [navigation]);

  const updateCount = (field: keyof typeof adjustedCounts, value: number) => {
    setAdjustedCounts((prev) => ({ ...prev, [field]: value }));
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Erro", "Permissão de localização negada.");
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch {
      Alert.alert("Erro", "Falha ao obter localização.");
      return null;
    }
  };

  const handleConfirm = async () => {
    if (isLoading) return;

    const hasAnyDelta = Object.values(adjustedCounts).some((v) => v !== 0);
    if (!hasAnyDelta) {
      Alert.alert("Nada para registar", "Mete um valor em Entregas ou Recolhas.");
      return;
    }

    setIsLoading(true);

    const now = new Date();
    const dateString = now.toLocaleDateString("pt-PT");
    const timeString = now.toLocaleTimeString("pt-PT");

    const username = (await AsyncStorage.getItem("USERNAME")) || "Desconhecido";
    const userCity = (await AsyncStorage.getItem("CITY")) || "Desconhecido";

    const updatedValues = { ...currentValues };

    Object.entries(adjustedCounts).forEach(([key, value]) => {
      const field = key as keyof typeof updatedValues;
      updatedValues[field] = Math.max(0, updatedValues[field] + value);
    });

    // guardar no TASKS
    const storedTasks = await AsyncStorage.getItem("TASKS");
    const tasks = storedTasks ? JSON.parse(storedTasks) : {};
    tasks.delivery_entregas = updatedValues.entregas;
    tasks.delivery_recolhas = updatedValues.recolhas;
    await AsyncStorage.setItem("TASKS", JSON.stringify(tasks));

    // ✅ NOVO: também entra no histórico deste turno (mesmo que metas +10, fica registado)
    for (const [key, value] of Object.entries(adjustedCounts)) {
      if (!value) continue;

      const taskName = key === "recolhas" ? "Recolhas" : "Entregas";
      await appendDeliveryTurnLog(taskName, value);
    }

    // logs remotos (GPS)
    const currentLocation = await getCurrentLocation();
    if (!currentLocation) {
      setIsLoading(false);
      return;
    }

    const logs = {
      logs: Object.entries(adjustedCounts)
        .filter(([_, value]) => value !== 0)
        .map(([key, value]) => ({
          Utilizador: username,
          Data: dateString,
          Hora: timeString,
          Cidade: userCity,
          Operador: "Delivery",
          Tarefa: key === "recolhas" ? "Recolhas" : "Entregas",
          Quantidade: value,
          Latitude: currentLocation.latitude,
          Longitude: currentLocation.longitude,
        })),
    };

    try {
      const response = await fetch(GOOGLE_SHEETS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logs),
      });

      const result = await response.json();

      if (result.success) {
        navigation.goBack();
      } else {
        Alert.alert("Erro", "A API rejeitou os dados. Verifica os logs.");
      }
    } catch {
      Alert.alert("Erro", "Não foi possível registrar a tarefa.");
    }

    setIsLoading(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient colors={["#1A1A1A", "#2A2A2A"]} style={styles.container}>
        <Text style={styles.title}>Tarefas Delivery</Text>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {Object.entries(adjustedCounts).map(([key, value]) => (
            <View key={key} style={styles.card}>
              <Text style={styles.label}>{key === "recolhas" ? "Recolhas" : "Entregas"}</Text>
              <Text style={styles.note}>
                Número atual no cartão: {currentValues[key as keyof typeof currentValues]}
              </Text>

              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => updateCount(key as keyof typeof adjustedCounts, value - 1)}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>-</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.input}
                  value={String(value)}
                  keyboardType="numeric"
                  editable={!isLoading}
                  onChangeText={(txt) => {
                    if (txt.trim() === "") {
                      updateCount(key as keyof typeof adjustedCounts, 0);
                      return;
                    }
                    const cleaned = txt.replace(/[^0-9-]/g, "");
                    const n = parseInt(cleaned, 10);
                    updateCount(key as keyof typeof adjustedCounts, isNaN(n) ? 0 : n);
                  }}
                />

                <TouchableOpacity
                  style={styles.button}
                  onPress={() => updateCount(key as keyof typeof adjustedCounts, value + 1)}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmButtonText}>Confirmar</Text>}
        </TouchableOpacity>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 70 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 25,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scrollContent: { flexGrow: 1, paddingBottom: 90 },
  card: {
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  label: { fontSize: 18, color: "#FFF", fontWeight: "bold", marginBottom: 8 },
  note: { fontSize: 14, color: "#B0BEC5", marginBottom: 12 },
  counterContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  button: {
    backgroundColor: "#424242",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 3,
  },
  buttonText: { fontSize: 20, color: "#FFF", fontWeight: "bold" },
  input: {
    fontSize: 18,
    color: "#FFF",
    textAlign: "center",
    minWidth: 90,
    backgroundColor: "#424242",
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  confirmButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#7032CD",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 5,
  },
  confirmButtonText: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
});

export default AddItemDeliveryScreen;