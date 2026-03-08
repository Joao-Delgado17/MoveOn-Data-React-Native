function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      console.log("❌ Nenhum dado recebido ou postData.contents está vazio!");
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: "Nenhum dado recebido" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    console.log("📥 Dados recebidos (brutos):", e.postData.contents);

    var data;
    try {
      data = JSON.parse(e.postData.contents);
      console.log("✅ JSON processado corretamente:", JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("❌ Erro ao processar JSON:", error.message);
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: "Erro ao processar JSON: " + error.message })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (typeof data !== "object" || data === null) {
      console.error("❌ O JSON não é um objeto válido:", data);
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: "O JSON não é um objeto válido" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!sheet) {
      console.error("❌ Erro ao acessar a planilha");
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: "Erro ao acessar a planilha" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    return processExportShift(sheet, data);

  } catch (error) {
    console.error("❌ Erro geral no doPost:", error.message);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function processExportShift(sheet, data) {
  try {
    if (!data || typeof data !== "object") {
      console.log("❌ Dados inválidos: não é um objeto JSON válido!");
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: "Dados inválidos: data está indefinido ou não é um objeto válido" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var sheetTurnos = sheet.getSheetByName("Delivery");
    if (!sheetTurnos) {
      console.error("❌ A aba 'Delivery' não existe no Google Sheets.");
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: "A aba 'Delivery' não existe" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    console.log("📥 Dados do turno recebidos:", JSON.stringify(data, null, 2));

    // ✅ Verifica se os campos obrigatórios existem
    const requiredFields = ["username", "city", "dataInicio", "horaInicio", "horaFim"];
    for (let field of requiredFields) {
      if (!data[field] || data[field].trim() === "") {
        console.error(`❌ Campo obrigatório faltando: ${field}`);
        return ContentService.createTextOutput(
          JSON.stringify({ success: false, error: `Campo obrigatório faltando: ${field}` })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 📌 Insere os dados na próxima linha vazia
    sheetTurnos.appendRow([
      data.username || "Desconhecido",               // Usuário
      data.city || "N/A",                            // Cidade
      data.dataInicio || "N/A",                      // Data Inicio
      data.horaInicio || "N/A",                      // Hora de Início
      data.horaFim || "N/A",                         // Hora de Fim
      data.dataFim || "N/A",                         // Data Fim
      data.duration || "00:00:00",                   // Duração
      data.carrinha || "N/A",                        // Carrinha
      data.kmInicial || "N/A",                       // KM Inicial
      data.kmFinal || "N/A",                         // KM Final
      data.notes || "Sem notas",                     // Notas
      data.warehouseStart || "N/A",                  // Saida do armazém
      data.warehouseEnd || "N/A",                    // Chegada ao armazém
      data.warehouseElapsedTime || "N/A",            // Tempo fora do armazém
      data.imageDriveLinks || "N/A",                 // Imagens Carrinha
      data.totalEntregas ?? 0,                       // Total de Entregas
      data.totalRecolhas ?? 0,                       // ✅ Recolhas (NOVA COLUNA)
      data["numEncomendasInicial"] ?? 0,             // Encomendas reportadas que saíram do armazém
      data["numEncomendasFinal"] ?? 0,               // Encomendas reportadas que chegaram ao armazém
      data["numEncomendasEntregues"] ?? 0            // Diferença no número de encomendas reportadas
    ]);

    console.log("✅ Turno exportado com sucesso!");
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, type: "turno" })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error("❌ Erro ao exportar turno:", error.message);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}