import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchLastShiftData } from '../scripts/LastShiftData';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Ícones do Material

const TurnoCards: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [turnData, setTurnData] = useState({
    kmPercorridos: 0,
    totalTasks: 0,
    avgKmPerTask: 0.0,
    avgTasksPerHour: 0.0,
    kmVariation: 0,
    tasksVariation: 0,
    avgKmPerTaskDiff: 0.0,
    avgTasksPerHourDiff: 0.0,
  });

  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadShiftData = async () => {
      const username = await AsyncStorage.getItem('USERNAME');
      if (username) {
        const data = await fetchLastShiftData(username);

        // Calcula a variação comparando com os dados anteriores
        setTurnData(prevState => ({
          ...prevState,
          ...data,
          kmVariation: data.kmPercorridos - prevState.kmPercorridos,
          tasksVariation: data.totalTasks - prevState.totalTasks,
          avgKmPerTaskDiff: data.avgKmPerTask - prevState.avgKmPerTask,
          avgTasksPerHourDiff: data.avgTasksPerHour - prevState.avgTasksPerHour,
        }));
      }
      setLoading(false);
    };

    loadShiftData();
  }, []);
  
  useEffect(() => {
    // 🔥 **Nova animação SUPER SUAVE** 🔥
    Animated.sequence([
      Animated.timing(scrollX, {
        toValue: 50, // Move sutilmente para frente
        duration: 1000, // 🔥 Aumenta a duração para ficar mais fluido
        easing: Easing.inOut(Easing.quad), // 🔥 Deixa o movimento mais natural
        useNativeDriver: false,
      }),
      Animated.timing(scrollX, {
        toValue: 0, // Retorna ao início suavemente
        duration: 1000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  // Define a cor da estatística com base na comparação entre Último Turno e Resumo Mensal
  const getComparisonColor = (lastTurnValue: number, monthlyAvg: number) => {
    if (lastTurnValue > monthlyAvg) return '#4CAF50'; // Verde (melhor)
    if (lastTurnValue < monthlyAvg) return '#F44336'; // Vermelho (pior)
    return '#4CAF50'; // Branco (igual)
  };

  return (
    <Animated.ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.scrollView, { transform: [{ translateX: scrollX }] }]} // Aplica a animação
    >
      {/* Card Resumo Mensal */}
      <LinearGradient colors={['#2A2A2A', '#1A1A1A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <Text style={styles.cardTitle}>Resumo Mensal</Text>
        <View style={styles.divider} />

        {loading ? (
          <ActivityIndicator size="large" color="#FFF" />
        ) : (
          <View style={styles.grid}>
            <View style={styles.statItem}>
              <Icon name="directions-car" size={24} color="#FFF" />
              <Text style={styles.statLabel}>KM Percorridos</Text>
              <Text style={styles.statValue}>{turnData.kmPercorridos} km</Text>
              <Text style={[styles.variationRight, { color: turnData.kmVariation >= 0 ? '#4CAF50' : '#F44336' }]}>
                {turnData.kmVariation >= 0 ? `+${turnData.kmVariation} km` : `${turnData.kmVariation} km`}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Icon name="assignment" size={24} color="#FFF" />
              <Text style={styles.statLabel}>Tarefas Feitas</Text>
              <Text style={styles.statValue}>{turnData.totalTasks}</Text>
              <Text style={[styles.variationRight, { color: turnData.tasksVariation >= 0 ? '#4CAF50' : '#F44336' }]}>
                {turnData.tasksVariation >= 0 ? `+${turnData.tasksVariation}` : `${turnData.tasksVariation}`}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Icon name="insert-chart" size={24} color="#FFF" />
              <Text style={styles.statLabel}>Média Task/Hora</Text>
              <Text style={styles.statValue}>{turnData.avgTasksPerHour.toFixed(2)}</Text>
              <Text
                style={[
                  styles.variationRight,
                  { color: getComparisonColor(turnData.avgTasksPerHour, turnData.avgTasksPerHourDiff) },
                ]}
              >
                {turnData.avgTasksPerHourDiff >= 0 ? `${turnData.avgTasksPerHourDiff.toFixed(2)}` : `${turnData.avgTasksPerHourDiff.toFixed(2)}`}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Icon name="local-shipping" size={24} color="#FFF" />
              <Text style={styles.statLabel}>Média KM/Task</Text>
              <Text style={styles.statValue}>{turnData.avgKmPerTask.toFixed(2)} km</Text>
              <Text
                style={[
                  styles.variationRight,
                  { color: getComparisonColor(turnData.avgKmPerTask, turnData.avgKmPerTaskDiff) },
                ]}
              >
                {turnData.avgKmPerTaskDiff >= 0 ? `${turnData.avgKmPerTaskDiff.toFixed(2)}` : `${turnData.avgKmPerTaskDiff.toFixed(2)}`}
              </Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Card Último Turno */}
      <LinearGradient
        colors={['#2A2A2A', '#1A1A1A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.cardTitle}>Último Turno</Text>
        <View style={styles.divider} />

        {loading ? (
          <ActivityIndicator size="large" color="#FFF" />
        ) : (
          <View style={styles.grid}>
            <View style={styles.statItem}>
              <Icon name="directions-car" size={24} color="#FFF" />
              <Text style={styles.statLabel}>KM Percorridos</Text>
              <Text style={styles.statValue}>{turnData.kmPercorridos} km</Text>
            </View>

            <View style={styles.statItem}>
              <Icon name="assignment" size={24} color="#FFF" />
              <Text style={styles.statLabel}>Tarefas Feitas</Text>
              <Text style={styles.statValue}>{turnData.totalTasks}</Text>
            </View>

            <View style={styles.statItem}>
              <Icon name="insert-chart" size={24} color="#FFF" />
              <Text style={styles.statLabel}>Média Task/Hora</Text>
              <Text style={styles.statValue}>{turnData.avgTasksPerHour.toFixed(2)}</Text>
            </View>

            <View style={styles.statItem}>
              <Icon name="local-shipping" size={24} color="#FFF" />
              <Text style={styles.statLabel}>Média KM/Task</Text>
              <Text style={styles.statValue}>{turnData.avgKmPerTask.toFixed(2)} km</Text>
            </View>
          </View>
        )}
      </LinearGradient>
    </Animated.ScrollView>
  );
};

// 🎨 **Estilos Atualizados**
const styles = StyleSheet.create({
  scrollView: {
    paddingVertical: 10,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    width: 320,
    marginRight: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    alignSelf: 'flex-start',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#444',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginBottom: 20,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#BBB',
    marginTop: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  variationRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default TurnoCards;
