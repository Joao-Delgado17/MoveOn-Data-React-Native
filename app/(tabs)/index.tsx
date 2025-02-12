import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, ScrollView, Platform, TouchableOpacity, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import TurnoCards from '../../components/LastTurnCard';
import LastShiftTasksHourGraphic from '../../components/LastShiftTasksHourGraphic';

const StartScreen: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
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
          await AsyncStorage.removeItem('USERNAME');
          await AsyncStorage.removeItem('CITY');
          await AsyncStorage.removeItem('USER_TYPE');
          router.replace('/loginScreen');
        },
      },
    ]);
  };

  const capitalizeFirstLetter = (text: string | null) => {
    if (!text) return 'N/A';
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  return (
    <ImageBackground
      source={require('../../assets/images/move-on-logo.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <LinearGradient colors={['rgba(18, 18, 18, 0.9)', 'rgba(26, 26, 26, 0.95)']} style={styles.container}>

        <ScrollView contentContainerStyle={styles.scrollPage}>

          {/* Cabeçalho */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Bem-vindo, {username || 'Usuário'}!</Text>
              <Text style={styles.subtitle}>Cidade: {city || 'Desconhecida'}</Text>
              <Text style={styles.subtitle}>{userType || 'N/A'}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Icon name="logout" size={20} color="#FFF" />
              <Text style={styles.logoutText}>Sair</Text>
            </TouchableOpacity>
          </View>

          {/* 📊 Scroll horizontal para os gráficos */}
          <View style={styles.scrollContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <LastShiftTasksHourGraphic />
            </ScrollView>
          </View>

          {/* 🔄 Scroll horizontal para os cards de turnos */}
          <View style={styles.scrollContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <TurnoCards />
            </ScrollView>
          </View>

        </ScrollView>
      </LinearGradient>
    </ImageBackground>
  );
};

// 🎨 **Estilos Atualizados**
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  scrollPage: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#BBB',
    marginTop: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
    marginBottom: 10, // 🔥 Espaçamento entre seções
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});

export default StartScreen;
