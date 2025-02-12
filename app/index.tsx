import { Redirect } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isTurnActive, setIsTurnActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const userLoggedIn = await AsyncStorage.getItem("isLoggedIn");
        const turnActive = await AsyncStorage.getItem("isTurnActive");

        setIsLoggedIn(userLoggedIn === "true");
        setIsTurnActive(turnActive === "true");
      } catch (error) {
        console.error("Erro ao acessar AsyncStorage:", error);
      } finally {
        setLoading(false); // 🔥 Indica que os dados foram carregados
      }
    };

    checkStatus();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1E1E1E" }}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={{ color: "#FFF", marginTop: 10 }}>Carregando...</Text>
      </View>
    );
  }

  if (isTurnActive) {
    return <Redirect href="/turnoHomeScreen" />; // 🔥 Se o turno estiver ativo, redireciona para TurnoHomeScreen SEMPRE
  }

  if (!isLoggedIn) {
    return <Redirect href="/loginScreen" />; // 🔥 Se não estiver logado, manda para login
  }

  return <Redirect href="/(tabs)" />; // 🔥 Se estiver logado e sem turno ativo, manda para o dashboard
}
