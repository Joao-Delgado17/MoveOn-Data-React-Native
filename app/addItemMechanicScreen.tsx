import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";

const GOOGLE_SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbwoyiWWxn95qvS1xF2PLsZGzWywL-z0Qh0F5m8LCKRd-qmXR8KtxZ8TqwrclYbAj0IV/exec";

const AddItemMechanicScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const [currentValues, setCurrentValues] = useState({
    trotinetesReparadas: 0,
    bicicletasReparadas: 0,
  });

  const [adjustedCounts, setAdjustedCounts] = useState({
    trotinetesReparadas: 0,
    bicicletasReparadas: 0,
  });

  // 🔹 Carregar valores do AsyncStorage ao iniciar
  const loadCurrentValues = async () => {
    const storedTasks = await AsyncStorage.getItem("TASKS");
    const tasks = storedTasks ? JSON.parse(storedTasks) : {};
  
    const updatedValues = {
      trotinetesReparadas: tasks["mechanic_trotinetesReparadas"] ?? 0,  // 🔥 Corrigido para minúsculas
      bicicletasReparadas: tasks["mechanic_bicicletasReparadas"] ?? 0,  // 🔥 Corrigido para minúsculas
    };
  
    console.log("📥 Valores reais carregados no AddItemMechanicScreen:", updatedValues);
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
    setAdjustedCounts((prev) => ({ ...prev, [field]: value })); // Permite valores negativos
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
    } catch (error) {
      console.error("Erro ao obter localização:", error);
      Alert.alert("Erro", "Falha ao obter localização.");
      return null;
    }
  };

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
      Object.entries(updatedValues).map(([key, value]) => AsyncStorage.setItem(`mechanic_${key}`, value.toString()))
    );

    // Salvar tasks no objeto único
    const storedTasks = await AsyncStorage.getItem("TASKS");
    const tasks = storedTasks ? JSON.parse(storedTasks) : {};

    Object.entries(updatedValues).forEach(([key, value]) => {
      tasks[`mechanic_${key}`] = value; // Valor garantido >= 0
    });

    await AsyncStorage.setItem("TASKS", JSON.stringify(tasks));

    const currentLocation = await getCurrentLocation();
    if (!currentLocation) {
      Alert.alert("Erro", "Não foi possível obter a localização.");
      setIsLoading(false);
      return;
    }

    const logs = {
      logs: Object.entries(adjustedCounts)
        .filter(([_, value]) => value !== 0)
        .map(([key, value]) => ({
          Utilizador: username,
          Data: dateString,       // 📅 Nova coluna Data
          Hora: timeString,       // ⏰ Nova coluna Hora
          Cidade: userCity,
          Operador: "Mecânico",
          Tarefa: formatLabel(key),
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
        Alert.alert("Erro", "A API rejeitou os dados.");
      }
    } catch (error) {
      console.error("Erro ao enviar para Google Sheets:", error);
      Alert.alert("Erro", "Não foi possível registrar a tarefa.");
    }

    setIsLoading(false);
  };

  return (
    <LinearGradient colors={["#1A1A1A", "#2A2A2A"]} style={styles.container}>
      <Text style={styles.title}>Tarefas Mecânico</Text>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {Object.entries(adjustedCounts).map(([key, value]) => (
          <View key={key} style={styles.card}>
            <Text style={styles.label}>{formatLabel(key)}</Text>
            <Text style={styles.note}>Número atual no cartão: {currentValues[key as keyof typeof currentValues]}</Text>
            <View style={styles.counterContainer}>
              <TouchableOpacity style={styles.button} onPress={() => updateCount(key as keyof typeof adjustedCounts, value - 1)}>
                <Text style={styles.buttonText}>-</Text>
              </TouchableOpacity>
              <TextInput 
                style={styles.input} 
                value={String(value)} 
                keyboardType="numeric" 
                editable={false}
              />
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

  const spaced = key.replace(/([A-Z])/g, ' $1'); // Passo 1
  const words = spaced.split(' ');
  const pascalCased = words.map(
    w => w.charAt(0).toUpperCase() + w.slice(1)
  );
  return pascalCased.join(' ').trim(); // "Rebalance Virtual"
};

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
    backgroundColor: "#424242",
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
    backgroundColor: "#FFA500",
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

export default AddItemMechanicScreen;