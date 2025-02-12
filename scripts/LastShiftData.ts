const GOOGLE_SHEETS_API_KEY = 'AIzaSyCwljm0hqbJtkQN6uFjPAeVxtX6CuI2fPQ'; // API key do Google Sheets
const SHEET_ID = '1_17ujg_-bt3LdYR4Ie9tQgR_sdV9154XOFKCgjL__rU';
const RANGE = 'Drivers!A2:AT'; // Define o intervalo de dados

export const fetchLastShiftData = async (username: string) => {
  try {
    // URL da API do Google Sheets
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${GOOGLE_SHEETS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.values) {
      console.error('Nenhum dado encontrado.');
      return getDefaultShiftData();
    }

    // Procurar o último turno do usuário
    const rows = data.values;
    const lastShift = [...rows].reverse().find(row => row[0] === username);

    if (lastShift) {
      const kmInicial = parseInt(lastShift[8]) || 0;
      const kmFinal = parseInt(lastShift[9]) || 0;
      const totalTasks = lastShift.slice(15, 46).reduce((sum: number, value: string) => sum + (parseInt(value) || 0), 0);

      return {
        kmPercorridos: kmFinal - kmInicial,
        totalTasks,
        avgKmPerTask: totalTasks > 0 ? (kmFinal - kmInicial) / totalTasks : 0,
        avgTasksPerHour: totalTasks / 8,
        kmVariation: 0, // 🔹 Valor padrão
        tasksVariation: 0,
        avgKmPerTaskDiff: 0.0,
        avgTasksPerHourDiff: 0.0,
      };
    } else {
      console.warn(`Nenhum turno encontrado para ${username}`);
      return getDefaultShiftData();
    }
  } catch (error) {
    console.error('Erro ao buscar dados do Google Sheets:', error);
    return getDefaultShiftData();
  }
};

// Função para retornar valores padrão caso a API falhe ou não encontre dados
const getDefaultShiftData = () => ({
  kmPercorridos: 0,
  totalTasks: 0,
  avgKmPerTask: 0.0,
  avgTasksPerHour: 0.0,
  kmVariation: 0,
  tasksVariation: 0,
  avgKmPerTaskDiff: 0.0,
  avgTasksPerHourDiff: 0.0,
});
