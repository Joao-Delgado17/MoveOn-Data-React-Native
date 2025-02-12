import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart } from 'react-native-chart-kit'; // 📊 Biblioteca de gráficos
import { fetchLastShiftTasksHourData } from '../scripts/LastShiftDataGraphic'; // Importa os fetchs
import { fetchWarehouseAverageTasksData } from '../scripts/WarehouseShiftDataGraphic'; // 📌 Função correta

const screenWidth = Dimensions.get('window').width; // Largura da tela

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

          const avgData = await fetchWarehouseAverageTasksData(); // 📌 Função correta

          // 🛠️ Verifica se avgData tem os campos corretos
          if (avgData && avgData.labels && avgData.values) {
            console.log('Médias do armazém carregadas:', avgData);
            setAverageData(avgData);
          } else {
            console.error('Formato inválido de avgData:', avgData);
            setAverageData({
              labels: ['Eu', 'Manhã', 'Tarde', 'Noite'],
              values: [0, 0, 0, 0],
            });
          }
        }
      } catch (error) {
        console.error('Erro ao carregar os dados do turno:', error);
      } finally {
        setLoading(false);
      }
    };

    loadShiftData();
  }, []);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      
      {/* 📊 Gráfico - Tarefas por Hora no Último Turno */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Tarefas por Hora - Último Turno</Text>
        <View style={styles.divider} />

        {loading ? (
          <ActivityIndicator size="large" color="#FFF" />
        ) : (
          <BarChart
            data={{
              labels: chartData.labels,
              datasets: [{ data: chartData.values }],
            }}
            width={screenWidth * 0.8}
            height={220} // Ajustado para melhor visualização
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            style={styles.chart}
            fromZero
            withInnerLines={false}
            withHorizontalLabels={true}
            showBarTops={false}
            verticalLabelRotation={0}
            showValuesOnTopOfBars // Mostra os valores sobre as barras
          />
        )}
      </View>

      {/* 📊 Gráfico - Médias do Armazém */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Médias de Tarefas por Hora - Armazém</Text>
        <View style={styles.divider} />

        {loading ? (
          <ActivityIndicator size="large" color="#FFF" />
        ) : (
          <BarChart
            data={{
              labels: averageData.labels,
              datasets: [{ data: averageData.values.map(value => parseFloat(value.toFixed(1))) }], // Formata os valores com 1 casa decimal
            }}
            width={screenWidth * 0.8}
            height={220} // Ajustado para melhor visualização
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            style={styles.chart}
            fromZero
            withInnerLines={false}
            withHorizontalLabels={true}
            showBarTops={false}
            verticalLabelRotation={0}
            showValuesOnTopOfBars // Mostra os valores sobre as barras
          />
        )}
      </View>

    </ScrollView>
  );
};

// 🎨 Estilos Modernos
const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  chartCard: {
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 16,
    marginRight: 10,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#444',
    marginVertical: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
});

// Configuração dos gráficos 📊
const chartConfig = {
  backgroundGradientFrom: '#2A2A2A',
  backgroundGradientTo: '#2A2A2A',
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // Cor dos rótulos
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // Cor dos rótulos
  barPercentage: 0.55, // 🔥 Reduz um pouco a largura das barras para espaçamento leve
  fillShadowGradient: '#FFA726', // 🔥 Cor das barras (gradiente laranja)
  fillShadowGradientOpacity: 1,
  decimalPlaces: 1, // 🔥 Garante 1 casa decimal
  propsForLabels: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  propsForBackgroundLines: {
    strokeWidth: 0, // 🔥 Remove as linhas de fundo para um visual mais clean
  },
  showValuesOnTopOfBars: true, // 🔥 Mostra os valores sobre as barras
  barRadius: 5, // 🔥 Deixa as barras com bordas superiores arredondadas
  formatYLabel: (value: string) => ` ${value} `, // 🔥 Adiciona um espaço para afastar os valores das barras
};


export default LastShiftTasksHourGraphic;