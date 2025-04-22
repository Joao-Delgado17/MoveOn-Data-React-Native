import { GOOGLE_SHEETS_API_URL } from "../api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const exportToGoogleSheets = async (imageDriveLinks: string[], tasks: Record<string, number>) => {
  console.log("Antes do try exportShiftFinal");
  try {
    console.log("🚀 Iniciando exportação para o Google Sheets...");

    // 📌 Obtém os dados do turno do AsyncStorage
    const username = (await AsyncStorage.getItem("USERNAME")) || "Desconhecido";
    const city = (await AsyncStorage.getItem("CITY")) || "N/A";
    const kmInicial = (await AsyncStorage.getItem("kmInicial")) || "0";
    const kmFinal = (await AsyncStorage.getItem("kmFinal")) || "0";  // 🔥 CORRIGIDO
    const notes = (await AsyncStorage.getItem("notes")) || "Sem notas";  // 🔥 CORRIGIDO
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

    // 📌 Recuperar as tasks corretamente
    const storedTasks = await AsyncStorage.getItem("TASKS");
    const savedTasks = storedTasks ? JSON.parse(storedTasks) : {};

    // 📌 Garantir que todas as tasks tenham valores numéricos válidos
    const getTaskValue = (task: string) => savedTasks[task] ?? 0;

    // 🛠️ **DADOS FORMATADOS PARA ENVIO**
    const turnoPayload = {
      username,
      city,
      dataInicio,
      horaInicio,
      horaFim,
      dataFim,
      duration,
      carrinha,
      kmInicial,
      kmFinal,  // 🔥 AGORA CORRETO
      notes,  // 🔥 AGORA CORRETO
      warehouseStart,
      warehouseEnd,
      warehouseElapsedTime,
      imageDriveLinks: imageLinksString,

      // 📌 Lime Tasks
      "Collect Lime": getTaskValue("lime_collectTroti"),
      "Rebalance Lime": getTaskValue("lime_rebalanceTroti"),
      "Missing Lime": getTaskValue("lime_missingTroti"),
      "Collect Bike Lime": getTaskValue("lime_collectBike"),
      "Rebalance Bike Lime": getTaskValue("lime_rebalanceBike"),
      "Missing Bike Lime": getTaskValue("lime_missingBike"),

      // 📌 Ridemovi Tasks
      "Deploy Ridemovi": getTaskValue("ridemovi_deploy"),
      "Collect Ridemovi": getTaskValue("ridemovi_collect"),
      "Rebalance Ridemovi": getTaskValue("ridemovi_rebalance"),
      "Swap Ridemovi": getTaskValue("ridemovi_swap"),
      "Swap Rebalance Ridemovi": getTaskValue("ridemovi_swapRebalance"),
      "Reparking Ridemovi": getTaskValue("ridemovi_reparking"),
      "Special Recovery Ridemovi": getTaskValue("ridemovi_specialRecovery"),
      "Outside Fixed Ridemovi": getTaskValue("ridemovi_outsideFixed"),
      "Outside Fixed Swap Ridemovi": getTaskValue("ridemovi_outsideFixedSwap"),
      "Outside Fixed Swap Rebalance Ridemovi": getTaskValue("ridemovi_outsideFixedSwapRebalance"),
      "Missing Ridemovi": getTaskValue("ridemovi_missing"),

      // 📌 Bird Tasks
      "Deploy Bird": getTaskValue("bird_deploy"),
      "Collect Bird": getTaskValue("bird_collect"),
      "Rebalance Bird": getTaskValue("bird_rebalance"),
      "Rebalance Virtual Bird": getTaskValue("bird_rebalanceVirtual"),
      "Missing Bird": getTaskValue("bird_missing"),

      // 📌 Link Tasks
      "Deploy Link": getTaskValue("link_deploy"),
      "Collect Link": getTaskValue("link_collect"),
      "Rebalance Link": getTaskValue("link_rebalance"),
      "Missing Link": getTaskValue("link_missing"),

      // 📌 Bolt Tasks
      "Deploy Bolt": getTaskValue("bolt_deploy"),
      "Collect Bolt": getTaskValue("bolt_collect"),
      "Rebalance Bolt": getTaskValue("bolt_rebalance"),
      "Swap Bolt": getTaskValue("bolt_swap"),
      "Missing Bolt": getTaskValue("bolt_missing"),

      "Collect Bird EBike": getTaskValue("bird_collectEBike"),
      "Rebalance Bird EBike": getTaskValue("bird_rebalanceEBike"),
      "Swap Bird EBike": getTaskValue("bird_swapEBike"),
      "Missing Bird EBike": getTaskValue("bird_missingEBike"),

      "Swap Lime": getTaskValue("lime_swapTroti"),
      "Outside Fix Lime": getTaskValue("lime_outsideFixTroti"),
      "Swap Bike Lime": getTaskValue("lime_swapBike"),
      "Outside Fix Bike Lime": getTaskValue("lime_outsideFixBike"),
      "Deploy Lime": getTaskValue("lime_deployTroti"),
      "Deploy Bike Lime": getTaskValue("lime_deployBike"),
    };

    console.log("📡 Enviando dados do turno:", JSON.stringify(turnoPayload, null, 2));

    // 📌 Envia os dados para a API do Google Sheets
    const turnoResponse = await fetch(GOOGLE_SHEETS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(turnoPayload),
    });

    console.log("Será que vai executar isto?");

    const turnoData = await turnoResponse.json();
    console.log("📥 Resposta da API para Turno:", turnoData);

    if (turnoResponse.ok && turnoData.success) {
      console.log("✅ Turno exportado com sucesso!");
    } else {
      console.error("❌ Erro ao exportar turno:", turnoData.error);
    }
  } catch (error: any) {
    console.error("❌ Erro ao enviar dados:", error.message);
  }
};

export default exportToGoogleSheets;
