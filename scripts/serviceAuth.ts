import * as FileSystem from "expo-file-system";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const credentials = require("../scripts/credentials.json"); // Garante que tens o credentials.json no projeto

export const getAccessToken = async (): Promise<string | null> => {
  try {
    const formattedPrivateKey = credentials.private_key.replace(/\\n/g, "\n");

    // 🔹 Envia a requisição diretamente para obter o Access Token
    const requestBody = {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: formattedPrivateKey, // 🔥 O Expo não suporta JWT, então passamos a chave diretamente
    };

    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!data.access_token) {
      throw new Error(`❌ Erro ao obter Access Token: ${JSON.stringify(data)}`);
    }

    console.log("✅ Access Token obtido:", data.access_token);
    return data.access_token;
  } catch (error) {
    console.error("❌ Erro na autenticação:", error);
    return null;
  }
};
