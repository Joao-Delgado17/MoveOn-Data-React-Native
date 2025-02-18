import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, 
  Keyboard, TouchableWithoutFeedback, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { fetchVehicles } from '../../scripts/GetCarrinhas';

const StartShiftScreen: React.FC = () => {
  const [kmInicial, setKmInicial] = useState('');
  const [carrinha, setCarrinha] = useState('');
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  // Paleta de cores
  const colors = {
    primary: '#0F1A2F',    // Azul escuro
    secondary: '#3B82F6',  // Azul principal
    background: '#1E293B', // Fundo escuro
    text: '#F8FAFC'        // Texto branco
  };

  useEffect(() => {
    const loadVehicles = async () => {
      const vehicleList = await fetchVehicles();
      if (vehicleList.length > 0) {
        setVehicles(vehicleList);
        setCarrinha(vehicleList[0]); // 🔹 Define o primeiro veículo como padrão
      }
      setLoading(false);
    };

    loadVehicles();
  }, []);

  const handleConfirm = async () => {
    if (!kmInicial || isNaN(parseInt(kmInicial))) {
      Alert.alert("Erro", "Por favor, insira um número válido para os KM iniciais.");
      return;
    }

    try {
      const startTime = Date.now();
      await AsyncStorage.multiSet([
        ["kmInicial", kmInicial],
        ["carrinha", carrinha],
        ["startTime", startTime.toString()],
        ["isTurnActive", "true"],
      ]);
      router.push("/turnoHomeScreen");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível iniciar o turno.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={[styles.container, { backgroundColor: colors.primary }]}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <MaterialCommunityIcons 
            name="human-scooter" 
            size={40} 
            color={colors.secondary} 
          />
          <Text style={styles.title}>Iniciar Turno</Text>
        </View>

        {/* Campo KM Inicial */}
        <View style={[styles.inputContainer, { borderColor: isFocused ? colors.secondary : colors.background }]}>
          <MaterialCommunityIcons 
            name="speedometer" 
            size={24} 
            color={isFocused ? colors.secondary : colors.text} 
            style={styles.icon} 
          />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Quilometragem inicial"
            placeholderTextColor="#64748B"
            keyboardType="numeric"
            value={kmInicial}
            onChangeText={setKmInicial}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </View>

        {/* Seletor de Carrinha */}
        <View style={styles.pickerWrapper}>
          <View style={styles.pickerLabelContainer}>
            <FontAwesome5 name="truck" size={16} color="#F8FAFC" />
            <Text style={styles.pickerLabel}>Veículo:</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#3B82F6" />
          ) : (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={carrinha}
                onValueChange={(itemValue) => setCarrinha(itemValue)}
                dropdownIconColor="#F8FAFC"
                mode="dropdown"
                style={styles.picker}
              >
                {vehicles.map((item) => (
                  <Picker.Item key={item} label={item} value={item} color="#F8FAFC" />
                ))}
              </Picker>
            </View>
          )}
        </View>

        {/* Botão de Confirmação */}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.secondary }]}
          onPress={handleConfirm}
        >
          <Text style={styles.buttonText}>Iniciar Turno</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    marginVertical: 8,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  pickerWrapper: {
    marginVertical: 16,
  },
  pickerLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginLeft: 8,
  },
  pickerLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  pickerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  picker: {
    color: '#F8FAFC',
    fontSize: 16,
  },
  dropdownIcon: {
    position: 'absolute',
    right: 16,
    top: '30%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 32,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default StartShiftScreen;