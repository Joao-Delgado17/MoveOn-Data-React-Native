import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient"; // Gradiente de fundo

// 🔗 URL da API do Google Sheets
const GOOGLE_SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbwoyiWWxn95qvS1xF2PLsZGzWywL-z0Qh0F5m8LCKRd-qmXR8KtxZ8TqwrclYbAj0IV/exec";

const AddItemRidemoviScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const [currentValues, setCurrentValues] = useState({
    deploy: 0,
    collect: 0,
    rebalance: 0,
    swap: 0,
    swapRebalance: 0,
    reparking: 0,
    specialRecovery: 0,
    outsideFixed: 0,
    outsideFixedSwap: 0,
    outsideFixedSwapRebalance: 0,
    missing: 0,
  });

  const [adjustedCounts, setAdjustedCounts] = useState({
    deploy: 0,
    collect: 0,
    rebalance: 0,
    swap: 0,
    swapRebalance: 0,
    reparking: 0,
    specialRecovery: 0,
    outsideFixed: 0,
    outsideFixedSwap: 0,
    outsideFixedSwapRebalance: 0,
    missing: 0,
  });

  const loadCurrentValues = async () => {
    const storedTasks = await AsyncStorage.getItem("TASKS");
    const tasks = storedTasks ? JSON.parse(storedTasks) : {};

    const updatedValues = {
      deploy: tasks["ridemovi_deploy"] ?? 0,
      collect: tasks["ridemovi_collect"] ?? 0,
      rebalance: tasks["ridemovi_rebalance"] ?? 0,
      swap: tasks["ridemovi_swap"] ?? 0,
      swapRebalance: tasks["ridemovi_swapRebalance"] ?? 0,
      reparking: tasks["ridemovi_reparking"] ?? 0,
      specialRecovery: tasks["ridemovi_specialRecovery"] ?? 0,
      outsideFixed: tasks["ridemovi_outsideFixed"] ?? 0,
      outsideFixedSwap: tasks["ridemovi_outsideFixedSwap"] ?? 0,
      outsideFixedSwapRebalance: tasks["ridemovi_outsideFixedSwapRebalance"] ?? 0,
      missing: tasks["ridemovi_missing"] ?? 0,
    };

    console.log("📥 Dados carregados no RidemoviCard:", updatedValues); // 🔥 Log para depuração
    setCurrentValues(updatedValues);
  };

  useEffect(() => {
    loadCurrentValues();

    // 🔹 Atualiza os valores sempre que a tela for focada novamente
    const unsubscribe = navigation.addListener("focus", loadCurrentValues);
    return unsubscribe;
  }, [navigation]);

  const updateCount = (field: keyof typeof adjustedCounts, value: number) => {
    setAdjustedCounts((prev) => ({ ...prev, [field]: value })); // Permite valores negativos
  };

  // 🔹 Capturar a localização do usuário
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
    } catch (error) {
      console.error("Erro ao obter localização:", error);
      Alert.alert("Erro", "Falha ao obter localização.");
      return null;
    }
  };

  // 🔹 Salvar os valores ajustados e registrar no Google Sheets
  const handleConfirm = async () => {
    if (isLoading) return;
    setIsLoading(true);

    const now = new Date();
    const dateString = now.toLocaleDateString("pt-PT"); // 📅 "05/01/2025"
    const timeString = now.toLocaleTimeString("pt-PT"); // ⏰ "06:05:13"

    const username = (await AsyncStorage.getItem("USERNAME")) || "Desconhecido";
    const userCity = (await AsyncStorage.getItem("CITY")) || "Desconhecido";

    const updatedValues = { ...currentValues };
    Object.entries(adjustedCounts).forEach(([key, value]) => {
      const newValue = updatedValues[key as keyof typeof updatedValues] + value;
      updatedValues[key as keyof typeof updatedValues] = Math.max(0, newValue);
    });

    await Promise.all(
      Object.entries(updatedValues).map(([key, value]) => AsyncStorage.setItem(`ridemovi_${key}`, value.toString()))
    );

    // 🔹 Salvar todas as tasks em um único objeto no AsyncStorage
    const storedTasks = await AsyncStorage.getItem("TASKS");
    const tasks = storedTasks ? JSON.parse(storedTasks) : {};

    Object.entries(updatedValues).forEach(([key, value]) => {
      tasks[`ridemovi_${key}`] = value; // Valor garantido >= 0
    });

    await AsyncStorage.setItem("TASKS", JSON.stringify(tasks));

    // 🔹 Obter localização antes de enviar para o Google Sheets
    const currentLocation = await getCurrentLocation();
    if (!currentLocation) {
      Alert.alert("Erro", "Não foi possível obter a localização.");
      setIsLoading(false);
      return;
    }

    // Criar logs para envio
    const logs = {
      logs: Object.entries(adjustedCounts)
        .filter(([_, value]) => value !== 0)
        .map(([key, value]) => ({
          Utilizador: username,
          Data: dateString,       // 📅 Nova coluna Data
          Hora: timeString,       // ⏰ Nova coluna Hora
          Cidade: userCity,
          Operador: "Ridemovi",
          Tarefa: formatLabel(key),
          Quantidade: value,
          Latitude: currentLocation.latitude,
          Longitude: currentLocation.longitude,
        })),
    };

    const body = JSON.stringify(logs);

    try {
      console.log("📤 Enviando logs corrigidos:", body);

      const response = await fetch(GOOGLE_SHEETS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
      });

      const result = await response.json();
      console.log("📥 Resposta da API:", result);

      if (result.success) {
        navigation.goBack();
      } else {
        Alert.alert("Erro", "A API rejeitou os dados. Verifica os logs.");
      }
    } catch (error) {
      console.error("Erro ao enviar para Google Sheets:", error);
      Alert.alert("Erro", "Não foi possível registrar a tarefa.");
    }

    setIsLoading(false);
  };

  return (
    <LinearGradient colors={["#1A1A1A", "#2A2A2A"]} style={styles.container}>
      <Text style={styles.title}>Tarefas Ridemovi</Text>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {Object.entries(adjustedCounts).map(([key, value]) => (
          <View key={key} style={styles.card}>
            <Text style={styles.label}>{formatLabel(key)}</Text>
            <Text style={styles.note}>Número atual no cartão: {currentValues[key as keyof typeof currentValues]}</Text>
            <View style={styles.counterContainer}>
              <TouchableOpacity style={styles.button} onPress={() => updateCount(key as keyof typeof adjustedCounts, value - 1)}>
                <Text style={styles.buttonText}>-</Text>
              </TouchableOpacity>
              <TextInput style={styles.input} value={String(value)} keyboardType="numeric" editable={false} />
              <TouchableOpacity style={styles.button} onPress={() => updateCount(key as keyof typeof adjustedCounts, value + 1)}>
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
  );
};

const formatLabel = (key: string) => {
  const labels: Record<string, string> = {
    deploy: "Deploy",
    collect: "Collect",
    rebalance: "Rebalance",
    swap: "Swap",
    swapRebalance: "Swap + Rebalance",
    reparking: "Reparking",
    specialRecovery: "Special Recovery",
    outsideFixed: "Outside Fixed",
    outsideFixedSwap: "Outside Fixed + Swap",
    outsideFixedSwapRebalance: "Outside Fixed + Swap + Rebalance",
    missing: "Missing",
  };
  return labels[key] || key;
};
// **Estilos**
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 70,
  },
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
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
  label: {
    fontSize: 18,
    color: "#FFF",
    fontWeight: "bold",
    marginBottom: 8,
  },
  note: {
    fontSize: 14,
    color: "#B0BEC5",
    marginBottom: 12,
  },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: "#FF4500",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 3,
  },
  buttonText: {
    fontSize: 20,
    color: "#FFF",
    fontWeight: "bold",
  },
  input: {
    fontSize: 18,
    color: "#FFF",
    textAlign: "center",
    minWidth: 60,
    backgroundColor: "#424242",
    paddingVertical: 8,
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
  confirmButtonText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default AddItemRidemoviScreen;