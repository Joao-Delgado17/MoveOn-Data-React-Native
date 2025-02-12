import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// Definir o tipo para os usuários
type User = {
  password: string;
  city: string;
  type: string;
};

// Mapa de utilizadores válidos
const validUsers: Record<string, User> = {
  "admin": { password: "1234", city: "Lisboa", type: "driver" },
  "user1": { password: "1234", city: "Coimbra", type: "driver" },
  "user canariano": { password: "1234", city: "Canarias", type: "driver" },
  "user lastmile": { password: "1234", city: "Lisboa", type: "delivery" },
  "klysmannvasconcelos@gmail.com": { password: "12345678", city: "Lisboa", type: "driver" },
  "osvaldolazaro1988@gmail.com": { password: "12345678", city: "Lisboa", type: "driver" },
  "anunciada@ua.pt": { password: "12345678", city: "Lisboa", type: "driver" },
  "rodrigofarial930@hotmail.com": { password: "12345678", city: "Lisboa", type: "driver" },
  "maxim0412@gmail.com": { password: "12345678", city: "Lisboa", type: "driver" },
  "brunobarradas3@gmail.com": { password: "12345678", city: "Lisboa", type: "driver" },
  "ph303211@gmail.com": { password: "12345678", city: "Lisboa", type: "driver" },
  "werig.alcantara@gmail.com": { password: "12345678", city: "Lisboa", type: "driver" },
  "francisco.fr8tas@gmail.com": { password: "12345678", city: "Lisboa", type: "driver" },
  "daniellobo1207@gmail.com": { password: "12345678", city: "Lisboa", type: "driver" },
  "vitao.henriq@gmail.com": { password: "12345678", city: "Lisboa", type: "driver" },
  "higorcardosobraga0@gmail.com": { password: "12345678", city: "Lisboa", type: "driver" },
  "souzaf147@gmail.com": { password: "12345678", city: "Lisboa", type: "driver" },
  "wildesmaquino@gmail.com": { password: "12345678", city: "Lisboa", type: "driver" },
  "henriqueeverssom33@gmail.com": { password: "12345678", city: "Lisboa", type: "driver" },
  "Andre": { password: "12345678", city: "Lisboa", type: "mechanic" },
  "User_sant_torres": { password: "12345678", city: "Santarem_TorresVedras", type: "driver" }
};

const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Verifica se há um utilizador já logado
    const checkUserSession = async () => {
      const savedUsername = await AsyncStorage.getItem('USERNAME');
      const savedCity = await AsyncStorage.getItem('CITY');
      const savedUserType = await AsyncStorage.getItem('USER_TYPE');

      if (savedUsername && savedCity && savedUserType) {
        router.replace(`/(tabs)?username=${encodeURIComponent(savedUsername)}&city=${encodeURIComponent(savedCity)}&userType=${encodeURIComponent(savedUserType)}`);
      }
    };

    checkUserSession();
  }, []);

  const handleLogin = async () => {
    const user = validUsers[username.trim().toLowerCase()];

    if (user && user.password === password) {
      // Salvar os dados do utilizador localmente
      await AsyncStorage.setItem('USERNAME', username);
      await AsyncStorage.setItem('CITY', user.city);
      await AsyncStorage.setItem('USER_TYPE', user.type);

      // Redirecionar para as abas principais com os dados corretos
      router.replace(`/(tabs)?username=${encodeURIComponent(username)}&city=${encodeURIComponent(user.city)}&userType=${encodeURIComponent(user.type)}`);
    } else {
      Alert.alert('Erro', 'Login inválido. Verifique as credenciais.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nome de Utilizador:</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
      />

      <Text style={styles.label}>Senha:</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        returnKeyType="done"
      />

      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

// Estilos para melhorar o layout
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
});

export default LoginScreen;
