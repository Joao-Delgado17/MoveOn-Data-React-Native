import AsyncStorage from "@react-native-async-storage/async-storage";

const exportDeliveriesToGoogleSheets = async (imageDriveLinks: string[]) => {
  try {
    console.log("🚀 Iniciando exportação de entregas para o Google Sheets...");

    // 📌 Obtém os dados do turno do AsyncStorage
    const username = (await AsyncStorage.getItem("USERNAME")) || "Desconhecido";
    const city = (await AsyncStorage.getItem("CITY")) || "N/A";
    const kmInicial = (await AsyncStorage.getItem("kmInicial")) || "0";
    const kmFinal = (await AsyncStorage.getItem("kmFinal")) || "0";
    const notes = (await AsyncStorage.getItem("notes")) || "Sem notas";
    const startTimeStr = (await AsyncStorage.getItem("startTime")) || "";
    const endTimeStr = Date.now().toString();
    const carrinha = (await AsyncStorage.getItem("carrinha")) || "N/A";

    const warehouseStartTimeStr = (await AsyncStorage.getItem("warehouseStartTime")) || "0";
    const warehouseEndTimeStr = (await AsyncStorage.getItem("warehouseEndTime")) || "0";

    // 📌 Formatação correta da data e hora
    const formatDate = (timestamp: string) => {
      if (!timestamp || timestamp === "0") return "N/A";
      const date = new Date(parseInt(timestamp, 10));
      return date.toLocaleDateString("pt-PT");
    };

    const formatTime = (timestamp: string) => {
      if (!timestamp || timestamp === "0") return "N/A";
      const date = new Date(parseInt(timestamp, 10));
      return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    };

    // 📌 Separar corretamente Data e Hora
    const dataInicio = formatDate(startTimeStr);
    const dataFim = formatDate(endTimeStr);
    const horaInicio = formatTime(startTimeStr);
    const horaFim = formatTime(endTimeStr);
    const warehouseStart = formatTime(warehouseStartTimeStr);
    const warehouseEnd = formatTime(warehouseEndTimeStr);

    // 📌 Calcula a duração do turno
    const durationMillis = parseInt(endTimeStr, 10) - parseInt(startTimeStr, 10);
    const duration = new Date(durationMillis).toISOString().substr(11, 8);

    // 📌 Calcula o tempo fora do armazém
    const warehouseStartTime = parseInt(warehouseStartTimeStr, 10);
    const warehouseEndTime = parseInt(warehouseEndTimeStr, 10);

    let warehouseElapsedTime = "N/A";
    if (warehouseStartTime > 0 && warehouseEndTime > warehouseStartTime) {
      const elapsedMillis = warehouseEndTime - warehouseStartTime;
      warehouseElapsedTime = new Date(elapsedMillis).toISOString().substr(11, 8);
    }

    // 📌 Links das imagens
    const imageLinksString = imageDriveLinks.length > 0 ? imageDriveLinks.join("\n") : "Sem imagens";

    // 📌 Recuperar o total de entregas feitas
    const storedTasks = await AsyncStorage.getItem("TASKS");
    const savedTasks = storedTasks ? JSON.parse(storedTasks) : {};
    const totalEntregas = savedTasks["delivery_entregas"] ?? 0; // 🔥 Única tarefa para entregadores

    // 🛠️ **DADOS FORMATADOS PARA ENVIO**
    const deliveryPayload = {
      username,
      city,
      dataInicio,
      horaInicio,
      horaFim,
      dataFim,
      duration,
      carrinha,
      kmInicial,
      kmFinal,
      notes,
      warehouseStart,
      warehouseEnd,
      warehouseElapsedTime,
      imageDriveLinks: imageLinksString,
      totalEntregas,
    };

    console.log("📡 Enviando dados de entregas:", JSON.stringify(deliveryPayload, null, 2));

    // 📌 Envia os dados para a API do Google Sheets
    const response = await fetch("https://script.google.com/macros/s/AKfycbweiump41kd2QHCd7LKwHDcg3OtC9l58Q5KWOE7D93TtmDQvs3N9NwEhwjr0-rNPiaN/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deliveryPayload),
    });

    const data = await response.json();
    console.log("📥 Resposta da API para Entregas:", data);

    if (response.ok && data.success) {
      console.log("✅ Entregas exportadas com sucesso!");
    } else {
      console.error("❌ Erro ao exportar entregas:", data.error);
    }
  } catch (error: any) {
    console.error("❌ Erro ao enviar dados de entregas:", error.message);
  }
};

export default exportDeliveriesToGoogleSheets;
