import React, { useState } from 'react';
import { 
  View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, 
  Keyboard, TouchableWithoutFeedback, Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons'; // 🔥 Ícones Material Design

const StartShiftScreen: React.FC = () => {
  const [kmInicial, setKmInicial] = useState('');
  const [carrinha, setCarrinha] = useState('BA-69-PM');
  const router = useRouter();

  // 🔥 Fecha o teclado ao clicar fora
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleConfirm = async () => {
    if (!kmInicial || isNaN(parseInt(kmInicial))) {
      Alert.alert("Erro", "Por favor, insira um número válido para os KM iniciais.");
      return;
    }
  
    try {
      const startTime = Date.now(); // ⏳ Armazena o tempo de início em milissegundos
      await AsyncStorage.multiSet([
        ["kmInicial", kmInicial],
        ["carrinha", carrinha],
        ["startTime", startTime.toString()], // 🔥 Salva como string no AsyncStorage
        ["isTurnActive", "true"],
      ]);
  
      console.log("Turno iniciado:", { kmInicial, carrinha, startTime });
  
      router.push("/turnoHomeScreen"); // Redireciona para a tela do turno
    } catch (error) {
      console.error("Erro ao salvar os dados do turno:", error);
      Alert.alert("Erro", "Não foi possível iniciar o turno.");
    }
  };
  

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <Text style={styles.title}>🚛 Iniciar Turno</Text>

        {/* Campo KM Inicial */}
        <Text style={styles.label}>KM Inicial:</Text>
        <View style={styles.inputContainer}>
          <MaterialIcons name="local-shipping" size={24} color="#BBB" style={styles.icon} />
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Digite os KM iniciais"
            placeholderTextColor="#888"
            value={kmInicial}
            onChangeText={setKmInicial}
            returnKeyType="done"
            onSubmitEditing={dismissKeyboard} // Fecha o teclado ao pressionar "Enter"
          />
        </View>

        {/* Picker da Carrinha */}
        <Text style={styles.label}>Carrinha:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={carrinha}
            onValueChange={(itemValue: string) => setCarrinha(itemValue)}
            style={styles.picker}
            mode="dropdown" // 🔥 Para Android, evita o modo de tela cheia
          >
            <Picker.Item label="BA-69-PM" value="BA-69-PM" />
            <Picker.Item label="BB-89-UF" value="BB-89-UF" />
            <Picker.Item label="Master" value="Master" />
            <Picker.Item label="Alugada" value="Alugada" />
          </Picker>
        </View>

        {/* Botão grande e arredondado */}
        <TouchableOpacity style={styles.button} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Iniciar Turno</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

// 🎨 **Estilos Melhorados**
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E', // 🔥 Fundo escuro para combinar com os cards
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#FFF',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    color: '#BBB',
    alignSelf: 'flex-start',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#2A2A2A', // 🔥 Fundo escuro do input
    marginTop: 5,
    width: '100%',
    height: 50, // 🔥 Ajustei a altura para um tamanho mais padronizado
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#FFF', // 🔥 Texto branco
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    marginTop: 5,
    backgroundColor: '#2A2A2A', // 🔥 Fundo escuro para o Picker
    overflow: 'hidden',
    width: '100%',
  },
  picker: {
    color: '#FFF', // 🔥 Texto branco no picker
  },
  button: {
    backgroundColor: '#444', // 🔥 Botão escuro
    borderRadius: 50, // 🔥 Arredondado para um look moderno
    paddingVertical: 18,
    paddingHorizontal: 50,
    marginTop: 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default StartShiftScreen;