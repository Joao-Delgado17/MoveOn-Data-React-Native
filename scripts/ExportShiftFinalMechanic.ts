import AsyncStorage from "@react-native-async-storage/async-storage";

const exportMechanicToGoogleSheets = async () => {
  try {
    console.log("🚀 Iniciando exportação do mecânico para o Google Sheets...");

    // 📌 Obtém os dados do turno do AsyncStorage
    const username = (await AsyncStorage.getItem("USERNAME")) || "Desconhecido";
    const city = (await AsyncStorage.getItem("CITY")) || "N/A";
    const startTimeStr = (await AsyncStorage.getItem("startTime")) || "";
    const endTimeStr = Date.now().toString();
    const notes = (await AsyncStorage.getItem("notes")) || "Sem notas";

    // 📌 Formatação correta da data e hora
    const formatTime = (timestamp: string) => {
      if (!timestamp || timestamp === "0") return "N/A";
      const date = new Date(parseInt(timestamp, 10));
      return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    };

    const horaInicio = formatTime(startTimeStr);
    const horaFim = formatTime(endTimeStr);

    // 📌 Calcula a duração do turno
    const durationMillis = parseInt(endTimeStr, 10) - parseInt(startTimeStr, 10);
    const duration = new Date(durationMillis).toISOString().substr(11, 8);

    // 📌 Recuperar as tarefas do mecânico
    const storedTasks = await AsyncStorage.getItem("TASKS");
    const savedTasks = storedTasks ? JSON.parse(storedTasks) : {};
    const trotineteReparadas = savedTasks["mechanic_trotinetesReparadas"] ?? 0;
    const bicicletasReparadas = savedTasks["mechanic_bicicletasReparadas"] ?? 0;

    // 🛠️ **DADOS FORMATADOS PARA ENVIO**
    const mechanicPayload = {
      username,
      city,
      horaInicio,
      horaFim,
      duration,
      notes,
      trotineteReparadas,
      bicicletasReparadas,
    };

    console.log("📡 Enviando dados do mecânico:", JSON.stringify(mechanicPayload, null, 2));

    // 📌 Envia os dados para a API do Google Sheets
    const response = await fetch("https://script.google.com/macros/s/AKfycbxxwHdqYeRQW0EtUtRg1WguX-uSg30JbY9nbp-zgEylxTSI6to-oqGrpCpeiNeUWY4/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mechanicPayload),
    });

    const data = await response.json();
    console.log("📥 Resposta da API para Mecânico:", data);

    if (response.ok && data.success) {
      console.log("✅ Reparações exportadas com sucesso!");
    } else {
      console.error("❌ Erro ao exportar reparações:", data.error);
    }
  } catch (error: any) {
    console.error("❌ Erro ao enviar dados do mecânico:", error.message);
  }
};

export default exportMechanicToGoogleSheets;
