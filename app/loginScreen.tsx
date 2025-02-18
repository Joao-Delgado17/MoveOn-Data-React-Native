import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  ActivityIndicator,
  Keyboard 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

// URL DA API DO GOOGLE APPS SCRIPT 🔥
const API_URL = "https://script.google.com/macros/s/AKfycbxWTPItyu3yPm-mQgIJpNT25cYK-wZAdytOVVtchlITuO7E9O4IcjgfphNGPuGyIGso/exec"; // Substitui pelo ID correto

// Definir o tipo para os usuários
type User = {
  password: string;
  city: string;
  type: string;
};

const COLORS = {
  primary: '#0F1A2F',
  secondary: '#3B82F6',
  accent: '#60A5FA',
  background: '#1E293B',
  text: '#F8FAFC',
  muted: '#64748B'
};

const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const router = useRouter();

  // 🚀 Buscar utilizadores da API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Erro ao buscar utilizadores:", error);
        Alert.alert("Erro", "Falha ao obter lista de utilizadores.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // 🚀 Verifica se há um utilizador já logado
  useEffect(() => {
    const checkUserSession = async () => {
      const savedUsername = await AsyncStorage.getItem('USERNAME');
      const savedCity = await AsyncStorage.getItem('CITY');
      const savedUserType = await AsyncStorage.getItem('USER_TYPE');

      if (savedUsername && savedCity && savedUserType) {
        router.replace(
          `/(tabs)?username=${encodeURIComponent(savedUsername)}&city=${encodeURIComponent(savedCity)}&userType=${encodeURIComponent(savedUserType)}`
        );
      }
    };

    checkUserSession();
  }, []);

  // 🚀 Validação de login
  const handleLogin = async () => {
    if (loading) return;
    
    const userKey = username.trim().toLowerCase();
    const user = users[userKey];

    if (user && user.password === password) {
      await AsyncStorage.setItem('USERNAME', username);
      await AsyncStorage.setItem('CITY', user.city);
      await AsyncStorage.setItem('USER_TYPE', user.type);

      router.replace(
        `/(tabs)?username=${encodeURIComponent(username)}&city=${encodeURIComponent(user.city)}&userType=${encodeURIComponent(user.type)}`
      );
    } else {
      Alert.alert('Erro', 'Login inválido. Verifique as credenciais.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bem-vindo</Text>
        <Text style={styles.subtitle}>MoveOn Logistics</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Input de Username */}
        <View style={[styles.inputContainer, { borderColor: usernameFocused ? COLORS.secondary : COLORS.muted }]}>
          <MaterialIcons 
            name="person" 
            size={20} 
            color={usernameFocused ? COLORS.secondary : COLORS.muted} 
            style={styles.icon} 
          />
          <TextInput
            style={styles.input}
            placeholder="Nome de utilizador"
            placeholderTextColor={COLORS.muted}
            value={username}
            onChangeText={setUsername}
            onFocus={() => setUsernameFocused(true)}
            onBlur={() => setUsernameFocused(false)}
            autoCapitalize="none"
          />
        </View>

        {/* Input de Password */}
        <View style={[styles.inputContainer, { borderColor: passwordFocused ? COLORS.secondary : COLORS.muted }]}>
          <MaterialIcons 
            name="lock" 
            size={20} 
            color={passwordFocused ? COLORS.secondary : COLORS.muted} 
            style={styles.icon} 
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={COLORS.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.secondary} />
        ) : (
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.muted,
  },
  formContainer: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 56,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    height: '100%',
  },
  loginButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;
