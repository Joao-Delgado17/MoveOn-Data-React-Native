import AsyncStorage from '@react-native-async-storage/async-storage';

export const fetchMonthlyShiftData = async () => {
  try {
    const username = await AsyncStorage.getItem('USERNAME');
    if (!username) {
      throw new Error("❌ Username não encontrado no AsyncStorage");
    }

    const url = `https://script.google.com/macros/s/AKfycbxVUw-oaub27fEhk3OVdot6GZXW2PrdRkfvuKcKPGqwFPbQyyYyPiV4LENX_zy8eC9O/exec?username=${encodeURIComponent(username)}`;
    console.log("📡 URL da API:", url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`❌ Erro na resposta da API: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("📥 Resposta da API:", result);

    // Se houver error na resposta da API
    if (result.error) {
      // Verifica se o erro é especificamente "Nenhum dado encontrado..."
      if (result.error.includes("Nenhum dado encontrado")) {
        // Se quiser apenas retornar valores zerados, sem logar erro:
        console.log("ℹ️ Nenhum dado encontrado. Retornando dados zerados.");
        return {
          kmPercorridos: 0,
          totalTasks: 0,
          avgKmPerTask: 0,
          avgTasksPerHour: 0,
        };
      }

      // Se for outro tipo de erro, lança normalmente
      throw new Error(`❌ Erro na API: ${result.error}`);
    }

    // Se chegou até aqui, não houve erros. Retorna os dados.
    return {
      kmPercorridos: result.totalKmPercorridos ?? 0,
      totalTasks: result.totalTarefas ?? 0,
      avgKmPerTask: result.mediaKmPorTarefa ?? 0,
      avgTasksPerHour: result.mediaTarefasPorHora ?? 0,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Se quiser totalmente omitir o log de erro:
    // console.error('❌ Erro ao buscar dados mensais:', errorMessage);

    // Retorna dados zerados para evitar falha completa:
    return {
      kmPercorridos: 0,
      totalTasks: 0,
      avgKmPerTask: 0,
      avgTasksPerHour: 0,
    };
  }
};
