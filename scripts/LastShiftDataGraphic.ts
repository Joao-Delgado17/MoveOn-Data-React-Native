const GOOGLE_SHEETS_API_KEY = 'AIzaSyCwljm0hqbJtkQN6uFjPAeVxtX6CuI2fPQ';
const SHEET_ID = '1_17ujg_-bt3LdYR4Ie9tQgR_sdV9154XOFKCgjL__rU';
const RANGE_TASKS = 'Logs de Tasks!A2:F'; // Dados de tarefas
const RANGE_SHIFT = 'Drivers!A2:F'; // Dados do último turno

export const fetchLastShiftTasksHourData = async (username: string) => {
  try {
    const urlTasks = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE_TASKS}?key=${GOOGLE_SHEETS_API_KEY}`;
    const urlShift = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE_SHIFT}?key=${GOOGLE_SHEETS_API_KEY}`;

    const responseTasks = await fetch(urlTasks);
    const dataTasks = await responseTasks.json();

    const responseShift = await fetch(urlShift);
    const dataShift = await responseShift.json();

    if (!dataTasks.values || !dataShift.values) {
      console.error('Nenhum dado encontrado.');
      return getDefaultChartData();
    }

    const rowsTasks: string[][] = dataTasks.values;
    const rowsShift: string[][] = dataShift.values;

    // 🔹 Encontrar o último turno do usuário
    const lastShift = [...rowsShift].reverse().find((row: string[]) => row[0] === username);
    if (!lastShift) {
      console.warn(`Nenhum turno encontrado para ${username}`);
      return getDefaultChartData();
    }

    const startHour = parseInt(lastShift[3].split(':')[0]); // Hora inicial do turno
    const endHour = parseInt(lastShift[4].split(':')[0]); // Hora final do turno

    // 🔹 Criar um objeto para armazenar tarefas por hora do último turno
    const tasksPerHour: Record<number, number> = {};

    for (let i = startHour; i <= endHour; i++) {
      tasksPerHour[i] = 0; // Inicializa todas as horas do turno com 0 tarefas
    }

    // 🔹 Filtrar as tarefas feitas pelo usuário durante o último turno e agrupá-las por hora
    rowsTasks.forEach((row: string[]) => {
      if (row[0] === username) {
        const taskHour = parseInt(row[1].split(' ')[1].split(':')[0]); // 🔹 Extrai a hora (formato 00-23)
        const taskCount = parseInt(row[5]) || 0; // 🔹 Quantidade de tarefas

        if (taskHour >= startHour && taskHour <= endHour) {
          tasksPerHour[taskHour] += taskCount; // Soma as tarefas feitas na respectiva hora
        }
      }
    });

    // 🔹 Criar os arrays do gráfico a partir dos dados filtrados
    const filteredHours = Object.keys(tasksPerHour)
      .map(hour => `${hour}h`);

    const filteredValues = Object.values(tasksPerHour);

    return {
      labels: filteredHours,
      values: filteredValues,
    };
  } catch (error) {
    console.error('Erro ao buscar dados do Google Sheets:', error);
    return getDefaultChartData();
  }
};

// 🔹 Função para valores padrão caso a API falhe ou o usuário não tenha tarefas no último turno
const getDefaultChartData = () => ({
  labels: [],
  values: [],
});
