import AsyncStorage from '@react-native-async-storage/async-storage';

export const fetchMonthlyShiftData = async () => {
  try {
    // 🔹 Obtém o username do AsyncStorage
    const username = await AsyncStorage.getItem('USERNAME');

    if (!username) {
      throw new Error("❌ Username não encontrado no AsyncStorage");
    }

    // 🔹 Faz a requisição à API com o username como parâmetro
    const url = `https://script.google.com/macros/s/AKfycbxtbAzKNP9y31jllkjssZEwUx3s9JKJnMe8lrTdTEVFCm-YMsSCIOAxK1VWk07rQK7E/exec?username=${encodeURIComponent(username)}`;
    
    console.log("📡 URL da API:", url); // 🔥 Log da URL da requisição

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`❌ Erro na resposta da API: ${response.statusText}`);
    }

    const result = await response.json();

    console.log("📥 Resposta da API:", result); // 🔥 Log da resposta bruta da API

    if (result.error) {
      throw new Error(`❌ Erro na API: ${result.error}`);
    }

    return {
      kmPercorridos: result.totalKmPercorridos ?? 0,
      totalTasks: result.totalTarefas ?? 0,
      avgKmPerTask: result.mediaKmPorTarefa ?? 0,
      avgTasksPerHour: result.mediaTarefasPorHora ?? 0,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao buscar dados mensais:', errorMessage);

    return {
      kmPercorridos: 0,
      totalTasks: 0,
      avgKmPerTask: 0,
      avgTasksPerHour: 0,
    };
  }
};
