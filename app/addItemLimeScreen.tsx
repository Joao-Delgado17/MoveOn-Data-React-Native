import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient"; // Gradiente de fundo

// 🔗 URL da API do Google Sheets
const GOOGLE_SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbwoyiWWxn95qvS1xF2PLsZGzWywL-z0Qh0F5m8LCKRd-qmXR8KtxZ8TqwrclYbAj0IV/exec";

const AddItemLimeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const [currentValues, setCurrentValues] = useState({
    collectTroti: 0,
    rebalanceTroti: 0,
    missingTroti: 0,
    collectBike: 0,
    rebalanceBike: 0,
    missingBike: 0,
  });

  const [adjustedCounts, setAdjustedCounts] = useState({
    collectTroti: 0,
    rebalanceTroti: 0,
    missingTroti: 0,
    collectBike: 0,
    rebalanceBike: 0,
    missingBike: 0,
  });

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const loadCurrentValues = async () => {
    const storedTasks = await AsyncStorage.getItem("TASKS");
    const tasks = storedTasks ? JSON.parse(storedTasks) : {};

    const updatedValues = {
      collectTroti: tasks["lime_collectTroti"] ?? 0,
      rebalanceTroti: tasks["lime_rebalanceTroti"] ?? 0,
      missingTroti: tasks["lime_missingTroti"] ?? 0,
      collectBike: tasks["lime_collectBike"] ?? 0,
      rebalanceBike: tasks["lime_rebalanceBike"] ?? 0,
      missingBike: tasks["lime_missingBike"] ?? 0,
    };

    console.log("📥 Valores reais carregados no AddItemLime:", updatedValues);
    setCurrentValues(updatedValues);
  };

  useEffect(() => {
    loadCurrentValues();

    // 🔹 Atualiza os valores sempre que a tela for focada novamente
    const unsubscribe = navigation.addListener("focus", loadCurrentValues);
    return unsubscribe;
  }, [navigation]);

  // 🔹 Atualizar estado dos inputs
  const updateCount = (field: keyof typeof adjustedCounts, value: number) => {
    setAdjustedCounts((prev) => ({ ...prev, [field]: Math.max(0, value) }));
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
      Object.entries(updatedValues).map(([key, value]) => AsyncStorage.setItem(`lime_${key}`, value.toString()))
    );
  
    // 🔹 Salvar todas as tasks em um único objeto no AsyncStorage
    const storedTasks = await AsyncStorage.getItem("TASKS");
    const tasks = storedTasks ? JSON.parse(storedTasks) : {};
  
    Object.entries(adjustedCounts).forEach(([key, value]) => {
      if (value !== 0) {
        tasks[`lime_${key}`] = (tasks[`lime_${key}`] || 0) + value; // Incrementa os valores corretamente
      }
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
          Operador: "Lime",
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
        Alert.alert("Sucesso", "Tarefa registrada com sucesso!");
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
      <Text style={styles.title}>Tarefas Lime</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
    collectTroti: "Collect Troti",
    rebalanceTroti: "Rebalance Troti",
    missingTroti: "Missing Troti",
    collectBike: "Collect Bike",
    rebalanceBike: "Rebalance Bike",
    missingBike: "Missing Bike",
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
    backgroundColor: "#32CD32",
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

export default AddItemLimeScreen;