const GOOGLE_SHEETS_API_KEY = 'AIzaSyCwljm0hqbJtkQN6uFjPAeVxtX6CuI2fPQ';
const SHEET_ID = '1_17ujg_-bt3LdYR4Ie9tQgR_sdV9154XOFKCgjL__rU';
const RANGE_TASKS = 'Logs de Tasks!A2:H';
const RANGE_SHIFT = 'Drivers!A2:F';

// Interface para tipagem dos dados
interface ChartData {
  labels: string[];
  values: number[];
}

export const fetchLastShiftTasksHourData = async (username: string): Promise<ChartData> => {
  try {
    // Busca dados paralelamente
    const [tasksResponse, shiftResponse] = await Promise.all([
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE_TASKS}?key=${GOOGLE_SHEETS_API_KEY}`),
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE_SHIFT}?key=${GOOGLE_SHEETS_API_KEY}`)
    ]);

    const [tasksData, shiftData] = await Promise.all([
      tasksResponse.json(),
      shiftResponse.json()
    ]);

    // Verificação robusta de dados
    if (!tasksData?.values || !shiftData?.values) {
      console.error('Estrutura de dados inválida');
      return getDefaultChartData();
    }

    // Encontra o último turno
    const lastShift = [...shiftData.values].reverse()
      .find((row: string[]) => row[0] === username);

    if (!lastShift) {
      console.warn(`Usuário ${username} sem turnos registrados`);
      return getDefaultChartData();
    }

    // Processamento das horas do turno
    const startHour = parseInt(lastShift[3]?.split(':')[0]) || 0;
    const endHour = parseInt(lastShift[4]?.split(':')[0]) || 23;
    const isOvernight = startHour > endHour;

    // Gera todas as horas do turno
    const shiftHours = isOvernight 
      ? [...Array(24 - startHour + endHour + 1).keys()].map(h => (h + startHour) % 24)
      : Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

    // Inicializa o objeto de tarefas
    const tasksPerHour = Object.fromEntries(
      shiftHours.map(hour => [hour, 0])
    );

    // Processa cada tarefa
    tasksData.values.forEach((row: string[]) => {
      try {
        if (row[0] === username) {
          const taskHour = parseInt(row[2]?.split(':')[0]);
          const taskCount = parseInt(row[6]) || 0;

          if (isOvernight) {
            if (taskHour >= startHour || taskHour <= endHour) {
              tasksPerHour[taskHour] += taskCount;
            }
          } else if (taskHour >= startHour && taskHour <= endHour) {
            tasksPerHour[taskHour] += taskCount;
          }
        }
      } catch (error) {
        console.warn('Erro ao processar linha:', row, error);
      }
    });

    // Formata os dados para o gráfico
    return {
      labels: shiftHours.map(h => `${h.toString().padStart(2, '0')}h`),
      values: shiftHours.map(h => tasksPerHour[h])
    };

  } catch (error) {
    console.error('Erro na requisição:', error);
    return getDefaultChartData();
  }
};

// Gera dados padrão com todas as horas do turno
const getDefaultChartData = (): ChartData => ({
  labels: [],
  values: []
});