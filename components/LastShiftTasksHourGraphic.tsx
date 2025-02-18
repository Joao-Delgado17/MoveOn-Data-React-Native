import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  Dimensions 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchLastShiftTasksHourData } from '../scripts/LastShiftDataGraphic';
import { fetchWarehouseAverageTasksData } from '../scripts/WarehouseShiftDataGraphic';

const screenWidth = Dimensions.get('window').width;

const COLORS = {
  primary: '#0F1A2F',
  secondary: '#3B82F6',
  accent: '#60A5FA',
  background: '#1E293B',
  text: '#F8FAFC',
  muted: '#64748B'
};

const LastShiftTasksHourGraphic: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    labels: ['00h', '04h', '08h', '12h', '16h', '20h'],
    values: [0, 0, 0, 0, 0, 0],
  });

  const [averageData, setAverageData] = useState({
    labels: ['Eu', 'Manhã', 'Tarde', 'Noite'],
    values: [0, 0, 0, 0],
  });

  useEffect(() => {
    const loadShiftData = async () => {
      try {
        const username = await AsyncStorage.getItem('USERNAME');
        if (username) {
          const data = await fetchLastShiftTasksHourData(username);
          setChartData(data);

          const avgData = await fetchWarehouseAverageTasksData();
          
          if (avgData?.labels && avgData?.values) {
            setAverageData(avgData);
          } else {
            setAverageData({
              labels: ['Eu', 'Manhã', 'Tarde', 'Noite'],
              values: [0, 0, 0, 0],
            });
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadShiftData();
  }, []);

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 🔥 Gráfico - Tarefas por Hora */}
      <View style={styles.chartCard}>
        <View style={styles.sectionHeader1}>
          <View style={styles.titlePill}>
            <MaterialIcons name="insights" size={20} color={COLORS.text} />
            <View style={styles.titleContainer}>
              <Text style={styles.sectionMainTitle}>DESEMPENHO DO TURNO</Text>
              <Text style={styles.sectionSubtitle}>Tarefa realizada por hora</Text>
            </View>
          </View>
        </View>
        <View style={styles.divider} />

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.secondary} />
        ) : (
          <BarChart
            data={{
              labels: chartData.labels,
              datasets: [{ data: chartData.values }],
            }}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            style={styles.chart}
            fromZero
            withInnerLines={false}
            showBarTops={false}
            verticalLabelRotation={0}
            showValuesOnTopOfBars
          />
        )}
      </View>

      {/* 🔥 Gráfico - Médias do Armazém */}
      <View style={styles.chartCard}>
        <View style={styles.sectionHeader1}>
          <View style={styles.titlePill}>
            <MaterialIcons name="compare" size={20} color={COLORS.text} />
            <View style={styles.titleContainer}>
              <Text style={styles.sectionMainTitle}>BENCHMARKING</Text>
              <Text style={styles.sectionSubtitle}>Comparação com outros turnos</Text>
            </View>
          </View>
        </View>
        <View style={styles.divider} />

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.secondary} />
        ) : (
          <BarChart
            data={{
              labels: averageData.labels,
              datasets: [{ 
                data: averageData.values.map(value => parseFloat(value.toFixed(1))) 
              }]
            }}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            style={styles.chart}
            fromZero
            showBarTops={false}
            verticalLabelRotation={0}
            showValuesOnTopOfBars
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  chartCard: {
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    width: screenWidth - 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.secondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 8,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.muted,
    marginVertical: 12,
    opacity: 0.3,
  },
  chart: {
    marginVertical: 8,
    marginLeft: -15,
    borderRadius: 12,
  },
  sectionHeader1: {
    marginBottom: 16,
  },
  titlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignSelf: 'flex-start',
  },
  titleContainer: {
    marginLeft: 10,
  },
  sectionMainTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '500',
    marginTop: 2,
  },
});

const chartConfig = {
  backgroundGradientFrom: COLORS.background,
  backgroundGradientTo: COLORS.background,
  fillShadowGradient: COLORS.secondary,
  fillShadowGradientOpacity: 1,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  barPercentage: 0.7,
  decimalPlaces: 1,
  propsForLabels: {
    fontSize: 10,
    fontWeight: '500',
  },
  propsForBackgroundLines: {
    strokeWidth: 0,
  },
  propsForValues: {
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#FFF',
  },
  barRadius: 4,
  formatYLabel: (value: string) => `${value} `, // Formata os valores
  style: {
    borderRadius: 12,
  },
  useShadowColorFromDataset: false,
  showValuesOnTopOfBars: true, // 🔥 Mostra valores no topo das barras
};

export default LastShiftTasksHourGraphic;
