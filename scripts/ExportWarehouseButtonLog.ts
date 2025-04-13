import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

// 🔗 URL da API do Google Sheets (substitui pela tua)
const GOOGLE_SHEETS_API_URL = "https://script.google.com/macros/s/AKfycby9ql6h3BU9Vd0ZMNTcKLl7GnoextWRJOKgeRXYJC7uecV-Me33S7TRHXIK23oE7dMI/exec";

export const exportWarehouseLog = async (tipoRegistro: "Saída" | "Chegada") => {
  try {
    // 🚀 1. Obter o usuário
    const username = (await AsyncStorage.getItem("USERNAME")) || "Desconhecido";

    // 🚀 2. Obter data e hora atual
    const currentTime = new Date();
    const formattedDate = `${currentTime.getDate().toString().padStart(2, "0")}/${(currentTime.getMonth() + 1).toString().padStart(2, "0")}/${currentTime.getFullYear()}`;
    const formattedTime = `${currentTime.getHours().toString().padStart(2, "0")}:${currentTime.getMinutes().toString().padStart(2, "0")}:${currentTime.getSeconds().toString().padStart(2, "0")}`;

    // 🚀 3. Obter localização
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Permissão de localização negada.");
    }

    const location = await Location.getCurrentPositionAsync({});
    const latitude = location.coords.latitude.toFixed(6);
    const longitude = location.coords.longitude.toFixed(6);

    // 🚀 4. Criar o log para envio ao Google Sheets
    const logData = {
      logs: [
        {
          Utilizador: username,
          Data: formattedDate,
          Hora: formattedTime,
          "Tipo de Registo": tipoRegistro,
          Latitude: latitude,
          Longitude: longitude,
        },
      ],
    };

    // 🚀 5. Enviar para o Google Sheets
    const response = await fetch(GOOGLE_SHEETS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logData),
    });

    const result = await response.json();
    console.log("📥 Resposta da API:", result);

    if (!result.success) {
      throw new Error("Erro ao enviar log para o Google Sheets.");
    }

    console.log(`✅ ${tipoRegistro} registrada com sucesso.`);
  } catch (error) {
    console.error("❌ Erro ao registrar entrada/saída:", error);
    throw error;
  }
};
