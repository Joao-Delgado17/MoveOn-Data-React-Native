import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, ScrollView, Platform, TouchableOpacity, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import TurnoCards from '../../components/LastTurnCard';
import LastShiftTasksHourGraphic from '../../components/LastShiftTasksHourGraphic';

const COLORS = {
  primary: '#0F1A2F',     // Azul escuro
  secondary: '#3B82F6',   // Azul vibrante
  accent: '#60A5FA',      // Azul claro
  background: '#1E293B',  // Fundo escuro
  text: '#F8FAFC',        // Texto branco
  muted: '#64748B'        // Texto secundário
};

const StartScreen: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'activity' | 'history'>('activity');
  const router = useRouter();

  useEffect(() => {
    const loadUserData = async () => {
      const savedUsername = await AsyncStorage.getItem('USERNAME');
      const savedCity = await AsyncStorage.getItem('CITY');
      const savedUserType = await AsyncStorage.getItem('USER_TYPE');

      if (savedUsername) {
        setUsername(savedUsername);
        setCity(savedCity);
        setUserType(capitalizeFirstLetter(savedUserType));
      } else {
        router.replace('/loginScreen');
      }
    };

    loadUserData();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Terminar Sessão', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sim',
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace('/loginScreen');
        },
      },
    ]);
  };

  const capitalizeFirstLetter = (text: string | null) => {
    if (!text) return 'N/A';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#0F1A2F', '#1E293B']}
        style={styles.gradientOverlay}
      >
        {/* Área Fixa - Header e Tabs */}
        <View style={styles.fixedHeader}>
          <View style={styles.header}>
            <View style={styles.profileContainer}>
              <Icon name="person" size={26} color={COLORS.text} style={styles.profileIcon} />
              <View>
                <Text 
                  style={[
                    styles.title,
                    
                  ]} 
                  numberOfLines={1} 
                  ellipsizeMode="tail"
                >
                  {username || 'Usuário'}
                </Text>
                <View style={styles.locationContainer}>
                  <Icon name="location-on" size={16} color={COLORS.muted} />
                  <Text style={styles.subtitle}>{city || 'Localização desconhecida'}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Icon name="logout" size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
              onPress={() => setActiveTab('activity')}
            >
              <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>Atividade</Text>
              {activeTab === 'activity' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tab, activeTab === 'history' && styles.activeTab]}
              onPress={() => setActiveTab('history')}
            >
              <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Histórico</Text>
              {activeTab === 'history' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Área Rolável */}
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'activity' ? (
            <View style={styles.tabContent}>
              <LastShiftTasksHourGraphic />
            </View>
          ) : (
            <View style={styles.tabContent}>
              <TurnoCards />
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  backgroundImage: {
    flex: 1,
    opacity: 0.15,
  },
  gradientOverlay: {
    flex: 1,
  },
  fixedHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  scrollPage: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 100,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileContainer: {
    flex: 1, // 🔄 Ocupa espaço disponível
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '60%', // ✅ Garante espaço mínimo para o texto
  },
  profileIcon: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginLeft: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  logoutText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  activeTab: {},
  tabText: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.secondary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '100%',
    backgroundColor: COLORS.secondary,
  },
  tabContent: {
    flex: 1,
    minHeight: 500, // Garante espaço mínimo para scroll
  },
  section: {
    marginBottom: 32,
  },
});

export default StartScreen;