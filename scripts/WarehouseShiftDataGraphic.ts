const API_KEY = 'AIzaSyCwljm0hqbJtkQN6uFjPAeVxtX6CuI2fPQ'; // 🔥 Substitui pela tua API Key
const SPREADSHEET_ID = '1_17ujg_-bt3LdYR4Ie9tQgR_sdV9154XOFKCgjL__rU'; // 🔥 Substitui pelo teu ID da planilha
const RANGE = 'Drivers!A2:AT'; // 🔥 Atualiza o intervalo da planilha

// 📌 Função para buscar os dados do último turno do armazém do usuário
export const fetchLastWarehouseShiftData = async (username: string) => {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    const response = await fetch(url);
    const json = await response.json();

    const rows = json.values || [];

    let lastTurn = null;

    // 🔍 Encontra a última linha do usuário
    for (const row of rows) {
      if (row[0] === username) {
        lastTurn = row;
      }
    }

    if (!lastTurn) {
      return { totalTasks: 0, avgTasksPerHour: 0.0, avgKmPerTask: 0.0 };
    }

    const totalTasks = parseInt(lastTurn[5]) || 0; // Coluna das tarefas totais
    const avgTasksPerHour = parseFloat(lastTurn[6]) || 0.0; // Coluna Média de Tarefas/Hora
    const avgKmPerTask = parseFloat(lastTurn[7]) || 0.0; // Coluna Média KM/Tarefa

    return { totalTasks, avgTasksPerHour, avgKmPerTask };
  } catch (error) {
    console.error('Erro ao buscar os dados do turno do armazém:', error);
    return { totalTasks: 0, avgTasksPerHour: 0.0, avgKmPerTask: 0.0 };
  }
};

// 📌 Função para buscar as médias de tarefas por hora no armazém
export const fetchWarehouseAverageTasksData = async () => {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    const response = await fetch(url);
    const json = await response.json();

    const rows: string[][] = json.values || [];

    let totalManha = 0, totalTarde = 0, totalNoite = 0, totalMes = 0;
    let countManha = 0, countTarde = 0, countNoite = 0, countTotal = 0;

    rows.forEach((row) => {
      const horaInicio = parseInt(row[3]?.split(':')[0] || '0', 10); // 🔥 Garante que pega a hora certa

      // 🔥 Calcula o total de tarefas do turno
      const totalTarefas = row
        .slice(15, 46)
        .reduce((acc: number, val: string) => acc + (parseInt(val) || 0), 0);

      if (horaInicio >= 4 && horaInicio < 12) {
        totalManha += totalTarefas;
        countManha++;
      } else if (horaInicio >= 12 && horaInicio < 19) {
        totalTarde += totalTarefas;
        countTarde++;
      } else {
        totalNoite += totalTarefas;
        countNoite++;
      }
    });

    totalMes = totalManha + totalTarde + totalNoite;
    countTotal = countManha + countTarde + countNoite;

    return {
      labels: ['Eu', 'Manhã', 'Tarde', 'Noite'],
      values: [
        countTotal > 0 ? totalMes / (countTotal * 8) : 0, // 🔥 Média mensal
        countManha > 0 ? totalManha / (countManha * 8) : 0, // 🔥 Média manhã
        countTarde > 0 ? totalTarde / (countTarde * 8) : 0, // 🔥 Média tarde
        countNoite > 0 ? totalNoite / (countNoite * 8) : 0, // 🔥 Média noite
      ],
    };
  } catch (error) {
    console.error('Erro ao buscar médias do armazém:', error);
    return { labels: ['Eu', 'Manhã', 'Tarde', 'Noite'], values: [0, 0, 0, 0] };
  }
};

