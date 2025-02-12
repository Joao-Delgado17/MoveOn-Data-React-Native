import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  BackHandler,
  Modal,
  TextInput,
  Image,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Keyboard,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import exportToGoogleSheets from "../scripts/ExportShiftFinal";
import uploadToFirebase from "../scripts/uploadImagesToGoogleDrive";

// Components
import LimeCard from "../components/operation_cards/LimeCard";
import RidemoviCard from "../components/operation_cards/RidemoviCard";
import BirdCard from "../components/operation_cards/BirdCard";
import BoltCard from "../components/operation_cards/BoltCard";

const { width } = Dimensions.get('window');

const PHOTO_ANGLES = [
  { 
    title: "Lado Esquerdo",
    icon: "truck",
    key: "left",
    style: { 
      transform: [
        { rotateY: '0deg' }, // Espelhamento 
      ] 
    }
  },
  { 
    title: "Frente",
    icon: "truck",
    key: "front",
    style: { transform: [{ rotate: '0deg' }] } // Orientação padrão
  },
  { 
    title: "Lado Direito",
    icon: "truck",
    key: "right",
  },
  { 
    title: "Traseira",
    icon: "truck",
    key: "rear",
    style: { transform: [{ rotate: '0deg' }] } // Rotação 180° para trás
  },
];

const TurnoHomeScreen: React.FC = () => {
  const [isWarehouseActive, setIsWarehouseActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [modalVisible, setModalVisible] = useState(false);
  const [kmFinal, setKmFinal] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPhotoStep, setCurrentPhotoStep] = useState(0);
  const navigation = useNavigation();
  const [kmInicial, setKmInicial] = useState<number | null>(null);
  const [kmPercorridos, setKmPercorridos] = useState<number | null>(null);


  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => true;
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [])
  );

  useEffect(() => {
    const loadState = async () => {
      const status = await AsyncStorage.getItem("isWarehouseActive");
      setIsWarehouseActive(status === "true");
  
      const startTimeStr = await AsyncStorage.getItem("startTime");
      if (startTimeStr) {
        const startTime = parseInt(startTimeStr, 10);
        if (!isNaN(startTime)) {
          const interval = setInterval(() => {
            const now = Date.now();
            const diff = now - startTime;
  
            setElapsedTime(formatTime(diff));
          }, 1000);
          return () => clearInterval(interval);
        }
      }
  
      const storedTasks = await AsyncStorage.getItem("TASKS");
      console.log("Loaded tasks:", storedTasks || "{}");
    };
  
    loadState();
  }, []);

  useEffect(() => {
    if (modalVisible) {
      const loadKmInicial = async () => {
        const kmIni = await AsyncStorage.getItem("kmInicial");
        if (kmIni) {
          setKmInicial(parseInt(kmIni, 10));
        }
      };
      loadKmInicial();
    }
  }, [modalVisible]);

  const handleKmFinalChange = (text: string) => {
    setKmFinal(text);
    const kmFinalNumber = parseInt(text, 10);
    
    if (!isNaN(kmFinalNumber) && kmInicial !== null) {
      const diff = kmFinalNumber - kmInicial;
      setKmPercorridos(diff >= 0 ? diff : null);
    } else {
      setKmPercorridos(null);
    }
  };  

  const formatTime = (ms: number) => {
    if (ms < 0) return "00:00:00";
    const hours = Math.floor(ms / (1000 * 60 * 60)).toString().padStart(2, "0");
    const minutes = Math.floor((ms / (1000 * 60)) % 60).toString().padStart(2, "0");
    const seconds = Math.floor((ms / 1000) % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleWarehouseAction = async () => {
    const currentTime = Date.now();
    if (!isWarehouseActive) {
      await AsyncStorage.setItem("warehouseStartTime", currentTime.toString());
      await AsyncStorage.setItem("isWarehouseActive", "true");
      setIsWarehouseActive(true);
      Alert.alert("Saída Registrada", "Bom trabalho!");
    } else {
      const warehouseStartTime = parseInt(await AsyncStorage.getItem("warehouseStartTime") || "0");
      const elapsed = currentTime - warehouseStartTime;
      await AsyncStorage.multiSet([
        ["warehouseEndTime", currentTime.toString()],
        ["warehouseElapsedTime", elapsed.toString()],
        ["isWarehouseActive", "false"]
      ]);
      setIsWarehouseActive(false);
      Alert.alert("Chegada Registrada", "Bem-vindo de volta!");
    }
  };

  const handleFinalizarTurno = () => {
    if (isWarehouseActive) {
      Alert.alert("Ação Necessária", "Registe primeiro a chegada ao armazém!");
      return;
    }
    setModalVisible(true);
  };

  const capturePhoto = async () => {
    if (images.length >= 4) return;
  
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") throw new Error("Permissão da câmera negada");
  
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
  
      if (!result.canceled && result.assets?.[0]?.uri) {
        setImages(prev => [...prev, result.assets[0].uri]);
        setCurrentPhotoStep(prev => Math.min(prev + 1, 3));
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Falha ao capturar foto";
      Alert.alert("Erro", errorMessage);
    }
  };
  
  const confirmarFinalizarTurno = async () => {
    if (!validateForm()) return;
  
    setIsLoading(true);

    try {
      
      // Filtrar nulls e garantir array de strings
      const imageLinks = (await Promise.all(images.map(uploadToFirebase)))
        .filter((link): link is string => link !== null);
  
      if (imageLinks.length !== 4) {
        Alert.alert("Erro", "O upload de algumas imagens falhou");
        return;
      }
  
      await AsyncStorage.multiSet([
        ["kmFinal", kmFinal],
        ["notes", notes],
        ["imageDriveLinks", JSON.stringify(imageLinks)]
      ]);
  
      const tasks = JSON.parse(await AsyncStorage.getItem("TASKS") || "{}");
      await exportToGoogleSheets(imageLinks, tasks);
  
      await AsyncStorage.multiRemove([
        "isTurnActive", "startTime", "warehouseStartTime",
        "warehouseEndTime", "warehouseElapsedTime", "kmInicial",
        "kmFinal", "notes", "TASKS", "imageDriveLinks"
      ]);
  
      setModalVisible(false);
      setTimeout(() => navigation.reset({ 
        index: 0, 
        routes: [{ name: "index" as never }] // Correção do tipo da rota
      }), 1000);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Falha ao finalizar turno";
      Alert.alert("Erro", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const kmFinalNumber = parseInt(kmFinal, 10);
    
    if (!kmFinal.trim() || isNaN(kmFinalNumber)) {
      Alert.alert("❌ Valor Inválido", "Insira uma quilometragem válida.");
      return false;
    }
  
    if (kmInicial !== null) {
      const kmPercorridos = kmFinalNumber - kmInicial;
  
      if (kmPercorridos < 0) {
        Alert.alert("⚠️ Erro", "Os quilómetros finais não podem ser menores que os iniciais.");
        return false;
      }
  
      if (kmPercorridos > 250) {
        Alert.alert("⚠️ Erro", "O percurso não pode ser maior que 250km. Verifique os valores.");
        return false;
      }
    }
  
    if (images.length !== 4) {
      Alert.alert("⚠️ Fotos Incompletas", "Capture todas as 4 fotos obrigatórias.");
      return false;
    }
  
    return true;
  };

  const PhotoGrid = () => (
    <View style={styles.photoGrid}>
      {PHOTO_ANGLES.map((angle, index) => (
        <View key={angle.key} style={styles.photoCell}>
          {images[index] ? (
            <Image source={{ uri: images[index] }} style={styles.photo} />
          ) : (
            <View style={[styles.photoPlaceholder, angle.style]}>
              <FontAwesome5 name={angle.icon} size={32} color="#64748b" />
              <Text style={styles.photoLabel}>{angle.title}</Text>
              {index === currentPhotoStep && (
                <View style={styles.photoBadge}>
                  <Text style={styles.badgeText}>!</Text>
                </View>
              )}
            </View>
          )}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Turno Ativo</Text>
        <Text style={styles.timer}>{elapsedTime}</Text>
      </View>

      <TouchableOpacity 
        style={[styles.warehouseButton, isWarehouseActive && styles.warehouseActive]}
        onPress={handleWarehouseAction}
      >
        <MaterialIcons 
          name={isWarehouseActive ? "location-on" : "location-off"} 
          size={24} 
          color="black" 
        />
        <Text style={styles.buttonText}>
          {isWarehouseActive ? "Chegada ao armazém" : "Saida do Armazém"}
        </Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LimeCard disabled={!isWarehouseActive} />
        <RidemoviCard disabled={!isWarehouseActive} />
        <BirdCard disabled={!isWarehouseActive} />
        <BoltCard disabled={!isWarehouseActive} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleFinalizarTurno}>
        <MaterialIcons name="done-all" size={32} color="white" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Finalizar Turno</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Quilómetros Finais</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 150 km"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={kmFinal}
                  onChangeText={handleKmFinalChange}
                  returnKeyType="done"
                />
                {kmInicial !== null && (
                  <View style={styles.kmInfoContainer}>
                    <Text style={styles.kmInicial}>Inicial: {kmInicial} km</Text>
                    {kmPercorridos !== null && <Text style={styles.kmPercorridos}> | Percorridos: {kmPercorridos} km</Text>}
                  </View>
                )}
              </View>


              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Observações</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Notas importantes..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>

              <PhotoGrid />

              <View style={styles.buttonGroup}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cameraButton]}
                  onPress={capturePhoto}
                  disabled={images.length >= 4}
                >
                  <MaterialIcons 
                    name="photo-camera" 
                    size={24} 
                    color={images.length >= 4 ? "#94a3b8" : "white"} 
                  />
                  <Text style={[
                    styles.buttonText, 
                    images.length >= 4 && styles.disabledText
                  ]}>
                    {images.length >= 4 ? 'Completo' : 'Capturar Foto'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.confirmationGroup}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.confirmButton]}
                    onPress={confirmarFinalizarTurno}
                    disabled={images.length !== 4}
                  >
                    {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Confirmar</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={isLoading} transparent>
        <View  style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>A processar...</Text>
            <Text style={styles.loadingSubtext}>Por favor aguarde</Text>
          </View>
        </View >
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  timer: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fbbf24",
  },
  warehouseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fbbf24",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 25,
  },
  warehouseActive: {
    backgroundColor: "#fb923c",
  },
  buttonText: {
    color: "#1e293b",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 32,
    backgroundColor: "#3b82f6",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: width * 0.9,
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#334155",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#475569",
    color: "white",
  },
  notesInput: {
    height: 100,
    textAlignVertical: "top",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginVertical: 10,
  },
  photoCell: {
    width: (width * 0.9 - 48 - 20) / 2,
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#334155",
    borderWidth: 2,
    borderColor: "#475569",
    borderRadius: 12,
  },
  photoLabel: {
    marginTop: 8,
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
  photoBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#3b82f6",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontWeight: "bold",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  buttonGroup: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cameraButton: {
    backgroundColor: "#3b82f6",
    marginTop: 10,
  },
  confirmButton: {
    backgroundColor: "#10b981",
    flex: 1,
  },
  disabledText: {
    color: "#cbd5e1",
  },
  confirmationGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 7.5,
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#dc2626',
    flex: 1,
  },
  kmInfoContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 5,
  },
  kmInicial: {
    fontSize: 12, // 🔹 Menor e mais discreto
    color: "#94a3b8", // 🔹 Cinza claro para não chamar atenção
    fontWeight: "400", // 🔹 Fonte normal, sem destaque
  },
  kmPercorridos: {
    fontSize: 14, // 🔥 Um pouco maior para se destacar
    color: "#fbbf24", // 🔥 Amarelo para chamar atenção
    fontWeight: "600", // 🔥 Negrito para destaque
  },
  
  

  // Loading Styles
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.9)",
  },
  loadingCard: {
    backgroundColor: "white",
    padding: 32,
    borderRadius: 20,
    alignItems: "center",
    width: width * 0.7,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
  },
});

export default TurnoHomeScreen;