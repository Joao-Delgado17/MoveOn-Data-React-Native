import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  Dimensions 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchLastShiftData } from '../scripts/LastShiftData';
import { fetchMonthlyShiftData } from '../scripts/MonthlyShiftData';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_PADDING = 16;
const CARD_MARGIN = 8;

const COLORS = {
  primary: '#0F1A2F',
  secondary: '#3B82F6',
  accent: '#60A5FA',
  background: '#1E293B',
  text: '#F8FAFC',
  muted: '#64748B',
  success: '#4ADE80',
  error: '#F75555'
};

const TurnoCards: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [turnData, setTurnData] = useState({
    kmPercorridos: 0,
    totalTasks: 0,
    avgKmPerTask: 0.0,
    avgTasksPerHour: 0.0,
  });
  const [monthlyData, setMonthlyData] = useState({
    kmPercorridos: 0,
    totalTasks: 0,
    avgKmPerTask: 0.0,
    avgTasksPerHour: 0.0,
  });

  useEffect(() => {
    const loadShiftData = async () => {
      try {
        const username = await AsyncStorage.getItem('USERNAME');
        if (username) {
          const [lastShift, monthly] = await Promise.all([
            fetchLastShiftData(username),
            fetchMonthlyShiftData()
          ]);
          
          setTurnData(lastShift);
          setMonthlyData(monthly);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    loadShiftData();
  }, []);

  const getComparisonColor = (lastTurnValue: number, monthlyAvg: number) => {
    if (lastTurnValue > monthlyAvg) return COLORS.success;
    if (lastTurnValue < monthlyAvg) return COLORS.error;
    return COLORS.text;
  };

  // Calcula as diferenças para o resumo mensal
  const getMonthlyComparisons = () => ({
    kmDiff: turnData.kmPercorridos,
    tasksDiff: turnData.totalTasks,
    avgTasksDiff: turnData.avgTasksPerHour - monthlyData.avgTasksPerHour,
    avgKmDiff: turnData.avgKmPerTask - monthlyData.avgKmPerTask
  });

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Card Resumo Mensal */}
      <LinearGradient 
        colors={[COLORS.primary, COLORS.background]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.card, styles.cardElevated]}
      >
        <View style={styles.sectionHeader}>
          <MaterialIcons name="assessment" size={22} color={COLORS.secondary} />
          <View style={styles.titleContainer}>
            <Text style={styles.sectionMainTitle}>RESUMO MENSAL</Text>
            <Text style={styles.sectionSubtitle}>Comparação com seu turno</Text>
          </View>
        </View>
        <View style={styles.divider} />

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.secondary} />
        ) : (
          <View style={styles.grid}>
            {[
              { 
                icon: 'directions-car', 
                label: 'KM Percorridos', 
                value: monthlyData.kmPercorridos,
                variation: getMonthlyComparisons().kmDiff
              },
              { 
                icon: 'assignment', 
                label: 'Tarefas Feitas', 
                value: monthlyData.totalTasks,
                variation: getMonthlyComparisons().tasksDiff
              },
              { 
                icon: 'insert-chart', 
                label: 'Média Task/Hora', 
                value: monthlyData.avgTasksPerHour.toFixed(2),
                diff: getMonthlyComparisons().avgTasksDiff
              },
              { 
                icon: 'local-shipping', 
                label: 'Média KM/Task', 
                value: monthlyData.avgKmPerTask.toFixed(2),
                diff: getMonthlyComparisons().avgKmDiff
              },
            ].map((item, index) => (
              <View key={index} style={styles.statItem}>
                <MaterialIcons 
                  name={item.icon as keyof typeof MaterialIcons.glyphMap} 
                  size={26} 
                  color={COLORS.accent} 
                  style={styles.statIcon}
                />
                <Text style={styles.statLabel}>{item.label}</Text>
                <Text style={styles.statValue}>
                  {item.value}
                  {item.label.includes('KM') && ' km'}
                </Text>
                
                {item.variation !== undefined ? (
                  <Text style={[styles.variationBadge, { 
                    // Sempre mostra +/- para KM e Tarefas
                    color: COLORS.success // Verde padrão para valores positivos
                  }]}>
                    {item.variation >= 0 ? `+${item.variation}` : `${item.variation}`}
                  </Text>
                ) : (
                  <Text style={[styles.variationBadge, { 
                    // Lógica invertida para KM/Task
                    color: item.label === 'Média KM/Task' 
                      ? (item.diff <= 0 ? COLORS.success : COLORS.error)
                      : (item.diff >= 0 ? COLORS.success : COLORS.error)
                  }]}>
                    {item.label === 'Média KM/Task' ? (
                      item.diff <= 0 ? `↓ ${Math.abs(item.diff).toFixed(2)}` : `↑ ${item.diff.toFixed(2)}`
                    ) : (
                      item.diff >= 0 ? `↑ ${item.diff.toFixed(2)}` : `↓ ${Math.abs(item.diff).toFixed(2)}`
                    )}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </LinearGradient>

      {/* Card Último Turno */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.background]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.card, styles.cardElevated]}
      >
        <View style={styles.sectionHeader}>
          <MaterialIcons name="history" size={22} color={COLORS.secondary} />
          <View style={styles.titleContainer}>
            <Text style={styles.sectionMainTitle}>ÚLTIMO TURNO</Text>
            <Text style={styles.sectionSubtitle}>Seu desempenho recente</Text>
          </View>
        </View>
        <View style={styles.divider} />

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.secondary} />
        ) : (
          <View style={styles.grid}>
            {[
              { icon: 'directions-car', label: 'KM Percorridos', value: turnData.kmPercorridos },
              { icon: 'assignment', label: 'Tarefas Feitas', value: turnData.totalTasks },
              { icon: 'insert-chart', label: 'Média Task/Hora', value: turnData.avgTasksPerHour.toFixed(2) },
              { icon: 'local-shipping', label: 'Média KM/Task', value: turnData.avgKmPerTask.toFixed(2) },
            ].map((item, index) => (
              <View key={index} style={styles.statItem}>
                <MaterialIcons 
                  name={item.icon as keyof typeof MaterialIcons.glyphMap} 
                  size={26} 
                  color={COLORS.accent} 
                  style={styles.statIcon}
                />
                <Text style={styles.statLabel}>{item.label}</Text>
                <Text style={styles.statValue}>
                  {item.value}
                  {item.label.includes('KM') && ' km'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </LinearGradient>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: CARD_PADDING,
    paddingVertical: 16,
    gap: 20,
    alignItems: 'center',
  },
  card: {
    borderRadius: 18,
    padding: 20,
    width: width - (CARD_PADDING * 2) - (CARD_MARGIN * 2),
    backgroundColor: COLORS.background,
    marginHorizontal: CARD_MARGIN,
  },
  cardElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    marginLeft: 12,
  },
  sectionMainTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '500',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.muted,
    opacity: 0.25,
    marginVertical: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 26, 47, 0.5)',
    position: 'relative',
    minHeight: 120,
  },
  statIcon: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  variationBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});

export default TurnoCards;