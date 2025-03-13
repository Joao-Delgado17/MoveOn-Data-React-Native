import React, { useEffect, useState, useLayoutEffect } from "react";
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
  Platform,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import exportToGoogleSheets from "../scripts/ExportShiftFinal";
import exportDeliveriesToGoogleSheets from "../scripts/ExportShiftFinalDelivery";
import exportMechanicToGoogleSheets from "../scripts/ExportShiftFinalMechanic";
import uploadToFirebase from "../scripts/uploadImagesToGoogleDrive";
import { exportWarehouseLog } from "../scripts/ExportWarehouseButtonLog";
import { exportShiftLog } from "../scripts/ExportShiftButtonLog";

// Components
import LimeCard from "../components/operation_cards/LimeCard";
import RidemoviCard from "../components/operation_cards/RidemoviCard";
import BirdCard from "../components/operation_cards/BirdCard";
import BoltCard from "../components/operation_cards/BoltCard";
import LinkCard from "../components/operation_cards/LinkCard";
import DeliveryCard from "../components/operation_cards/DeliveryCard";
import MechanicCard from "@/components/operation_cards/MechanicCard";

const { width } = Dimensions.get('window');

const colors = {
  primary: '#0F1A2F',    // Azul escuro
  secondary: '#3B82F6',  // Azul principal
  background: '#1E293B', // Fundo escuro
  text: '#F8FAFC'        // Texto branco
};

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
  const [city, setCity] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [modalVisible, setModalVisible] = useState(false);
  const [kmFinal, setKmFinal] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<(string | null)[]>([null, null, null, null]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPhotoStep, setCurrentPhotoStep] = useState(0);
  const navigation = useNavigation();
  const [kmInicial, setKmInicial] = useState<number | null>(null);
  const [kmPercorridos, setKmPercorridos] = useState<number | null>(null);
  const [isLoadingWarehouse, setIsLoadingWarehouse] = useState(false);
  const [isKmFocused, setIsKmFocused] = useState(false);
  const [isNotesFocused, setIsNotesFocused] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => true;
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [])
  );

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const savedCity = await AsyncStorage.getItem("CITY");
        const userType = await AsyncStorage.getItem("USER_TYPE");
        
        setCity(savedCity || "Desconhecida"); // Valor padrão caso não exista
        setUserType(userType || "driver"); // Valor padrão caso não exista
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        Alert.alert("Erro", "Falha ao carregar dados do utilizador");
      } finally {
        setLoading(false);
      }
    };
  
    loadUserData();
  }, []);

  useEffect(() => {
    const loadState = async () => {
      const userType = (await AsyncStorage.getItem("USER_TYPE")) || "driver";
  
      if (userType === "mechanic") {
        setIsWarehouseActive(true); // Define como ativo para evitar bloqueios
      } else {
        const status = await AsyncStorage.getItem("isWarehouseActive");
        setIsWarehouseActive(status === "true");
      }
  
      // 🔥 Atualiza o Timer independentemente do tipo de usuário
      const startTimeStr = await AsyncStorage.getItem("startTime");
      if (startTimeStr) {
        const startTime = parseInt(startTimeStr, 10);
        if (!isNaN(startTime)) {
          const interval = setInterval(() => {
            const now = Date.now();
            const diff = now - startTime;
            setElapsedTime(formatTime(diff));
          }, 1000);
  
          return () => clearInterval(interval); // Garante que o intervalo seja limpo corretamente
        }
      }
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
    try {
      setIsLoadingWarehouse(true); // 🚀 Ativar loading
  
      const tipoRegistro = isWarehouseActive ? "Chegada" : "Saída";
      await exportWarehouseLog(tipoRegistro); // 🚀 Chamar a função do script
  
      // 🚀 Atualiza o estado no AsyncStorage
      if (!isWarehouseActive) {
        await AsyncStorage.setItem("warehouseStartTime", Date.now().toString());
        await AsyncStorage.setItem("isWarehouseActive", "true");
        setIsWarehouseActive(true);
      } else {
        const warehouseStartTime = parseInt((await AsyncStorage.getItem("warehouseStartTime")) || "0");
        const elapsed = Date.now() - warehouseStartTime;
        await AsyncStorage.multiSet([
          ["warehouseEndTime", Date.now().toString()],
          ["warehouseElapsedTime", elapsed.toString()],
          ["isWarehouseActive", "false"],
        ]);
        setIsWarehouseActive(false);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível registrar a ação.");
    } finally {
      setIsLoadingWarehouse(false); // 🚀 Desativar loading
    }
  };

  const handleFinalizarTurno = () => {
    if (userType !== "mechanic" && isWarehouseActive) {
      Alert.alert("Ação Necessária", "Registe primeiro a chegada ao armazém!");
      return;
    }
    setModalVisible(true);
  };

  const capturePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") throw new Error("Permissão da câmera negada");
  
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });
  
      if (!result.canceled && result.assets?.[0]?.uri) {
        setImages(prev => {
          const newImages = [...prev];
          newImages[currentPhotoStep] = result.assets[0].uri;
          
          // 🔍 Procura a PRÓXIMA posição vazia a partir do INÍCIO
          const nextEmptyIndex = newImages.findIndex(img => img === null);
          setCurrentPhotoStep(nextEmptyIndex !== -1 ? nextEmptyIndex : 3);
          
          return newImages;
        });
  
        // Encontra a próxima posição vazia
        const nextEmptyIndex = images.findIndex((img, idx) => idx > currentPhotoStep && img === null);
        setCurrentPhotoStep(nextEmptyIndex !== -1 ? nextEmptyIndex : currentPhotoStep + 1);
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao capturar foto");
    }
  };
  
  const confirmarFinalizarTurno = async () => {
  if (!validateForm()) return;

  setIsLoading(true);
  setModalVisible(false);
  await new Promise(resolve => setTimeout(resolve, 50));

  try {
    const userType = (await AsyncStorage.getItem("USER_TYPE")) || "driver"; // Padrão para driver
    const imageLinks = (await Promise.all(
      images
        .filter((img): img is string => img !== null) // 🔹 Remove nulls e tipa como string[]
        .map(uploadToFirebase)
    )).filter((link): link is string => link !== null);

    if (userType !== "mechanic" && images.length !== 4) {
      Alert.alert("Erro", "O upload de algumas imagens falhou");
      return;
    }
  
    await AsyncStorage.multiSet([
      ["kmFinal", kmFinal],
      ["notes", notes],
      ["imageDriveLinks", JSON.stringify(imageLinks)]
    ]);

    if (userType === "driver") {
      await exportToGoogleSheets(imageLinks, JSON.parse(await AsyncStorage.getItem("TASKS") || "{}"));
    } else if (userType === "delivery") {
      await exportDeliveriesToGoogleSheets(imageLinks);
    } else if (userType === "mechanic") {
      await exportMechanicToGoogleSheets();
    }

    // 🔥 Regista o fim do turno com o novo tipo de registo
    await exportShiftLog("Fim Turno");

    await AsyncStorage.multiRemove([
      "isTurnActive", "startTime", "kmInicial",
      "kmFinal", "notes", "TASKS", "imageDriveLinks"
    ]);

    setModalVisible(false);
    setTimeout(() => navigation.reset({ 
      index: 0, 
      routes: [{ name: "index" as never }] // Corrige a navegação
    }), 1000);
  } catch (error) {
    Alert.alert("Erro", "Falha ao finalizar turno.");
  } finally {
    setIsLoading(false);
  }
};

const validateForm = () => {
  if (userType === "mechanic") {
      if (!notes.trim()) {
          Alert.alert("❌ Campo Obrigatório", "Preencha o campo de notas.");
          return false;
      }
      return true; // Permite finalizar turno com apenas notas
  }

  // Validação normal para outros usuários
  const kmFinalNumber = parseInt(kmFinal, 10);
  
  if (!kmFinal.trim() || isNaN(kmFinalNumber)) {
      Alert.alert("❌ Campo Obrigatório", "Preencha o campo de Kms.");
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

  const allPhotosTaken = images.every(img => img !== null);
    if (!allPhotosTaken) {
      Alert.alert("⚠️ Fotos Incompletas", "Capture todas as 4 fotos obrigatórias.");
      return false;
    }

  return true;
};

const removeImage = (index: number) => {
  setImages(prev => {
    const newImages = [...prev];
    newImages[index] = null;
    
    // 🔍 Encontra a PRIMEIRA posição vazia com o estado ATUALIZADO
    const nextEmptyIndex = newImages.findIndex(img => img === null);
    setCurrentPhotoStep(nextEmptyIndex !== -1 ? nextEmptyIndex : 3);
    
    return newImages;
  });
};

const PhotoGrid = () => (
  <View style={styles.photoGrid}>
    {PHOTO_ANGLES.map((angle, index) => (
      <View key={angle.key} style={styles.photoCell}>
        {images[index] ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: images[index]! }} style={styles.photo} />
            <TouchableOpacity 
              style={styles.removeButton} 
              onPress={() => removeImage(index)}
            >
              <MaterialIcons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.photoPlaceholder, angle.style]}>
            <FontAwesome5 name={angle.icon} size={28} color="#64748b" />
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Turno Ativo</Text>
        <Text style={styles.timer}>{elapsedTime}</Text>
      </View>

      {userType !== "mechanic" && (
        <TouchableOpacity
          style={[styles.warehouseButton, isWarehouseActive && styles.warehouseActive]}
          onPress={handleWarehouseAction}
          disabled={isLoadingWarehouse} // 🔥 Desativa botão enquanto carrega
        >
          {isLoadingWarehouse ? (
            <ActivityIndicator size="small" color="black" /> // 🔥 Mostra loading
          ) : (
            <>
              <MaterialIcons 
                name={isWarehouseActive ? "location-on" : "location-off"} 
                size={24} 
                color="black" 
              />
              <Text style={styles.buttonText}>
                {isWarehouseActive ? "Chegada ao armazém" : "Saída do Armazém"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {city === "Canarias" ? (
          <LinkCard disabled={!isWarehouseActive} />
        ) : userType === "delivery" ? (
          <DeliveryCard disabled={!isWarehouseActive} />
        ) : userType === "mechanic" ? (
          <MechanicCard disabled={!isWarehouseActive} />
        ) : city === "Lisboa" ? (
          <>
            <LimeCard disabled={!isWarehouseActive} />
            <RidemoviCard disabled={!isWarehouseActive} />
            <BirdCard disabled={!isWarehouseActive} />
            <BoltCard disabled={!isWarehouseActive} />
          </>
        ) : city === "Coimbra" ? (
          <>
            <BirdCard disabled={!isWarehouseActive} />
            <BoltCard disabled={!isWarehouseActive} />
          </>
        ) : city === "Figueira_da_Foz" ? (
          <>
            <BirdCard disabled={!isWarehouseActive} />
          </>
        ) : city === "Santarem_TorresVedras" ? (
          <>
            <BoltCard disabled={!isWarehouseActive} />
          </>
        ) : null}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleFinalizarTurno}>
        <MaterialIcons name="done-all" size={32} color="white" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Finalizar Turno</Text>

              {userType !== "mechanic" && (
                <View style={[styles.inputContainer, { 
                  borderColor: isKmFocused ? colors.secondary : '#334155' // Alteração aqui
                }]}>
                  <MaterialCommunityIcons 
                    name="speedometer" 
                    size={24} 
                    color={isKmFocused  ? colors.secondary : colors.text} 
                    style={styles.icon} 
                  />
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputLabel, isKmFocused  && { color: colors.secondary }]}>Quilómetros Finais</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Ex: 150 km"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      value={kmFinal}
                      onChangeText={handleKmFinalChange}
                      onFocus={() => setIsKmFocused(true)}
                      onBlur={() => setIsKmFocused(false)}
                      returnKeyType="done"
                    />
                    {kmInicial !== null && (
                      <View style={styles.kmInfoContainer}>
                        <Text style={styles.kmInicial}>Inicial: {kmInicial} km</Text>
                        {kmPercorridos !== null && <Text style={styles.kmPercorridos}> | Percorridos: {kmPercorridos} km</Text>}
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Campo Observações */}
              <View style={[styles.inputContainer, { 
                borderColor: isNotesFocused ? colors.secondary : '#334155' // Alteração aqui
              }]}>
                <MaterialCommunityIcons 
                  name="text-box-outline" 
                  size={24} 
                  color={isNotesFocused  ? colors.secondary : colors.text} 
                  style={styles.icon} 
                />
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, isNotesFocused  && { color: colors.secondary }]}>Observações</Text>
                  <TextInput
                    style={[styles.input, styles.notesInput, { color: colors.text }]}
                    placeholder="Notas importantes..."
                    placeholderTextColor="#64748B"
                    multiline
                    value={notes}
                    onChangeText={setNotes}
                    onFocus={() => setIsNotesFocused(true)}
                    onBlur={() => setIsNotesFocused(false)}
                    returnKeyType="done"
                  />
                </View>
              </View>

              {userType !== "mechanic" && <PhotoGrid />}

              <View style={styles.buttonGroup}>

                {userType !== "mechanic" && (
                  <TouchableOpacity 
                  style={[styles.actionButton, styles.cameraButton]}
                  onPress={capturePhoto}
                  disabled={images.filter(img => img !== null).length === 4} // ✅ Nova condição
                >
                  <MaterialIcons 
                    name="photo-camera" 
                    size={24} 
                    color={images.filter(img => img !== null).length === 4 ? "#94a3b8" : "white"} 
                  />
                  <Text style={[
                    styles.buttonText, 
                    images.filter(img => img !== null).length === 4 && styles.disabledText
                  ]}>
                    {images.filter(img => img !== null).length === 4 ? 'Completo' : 'Capturar Foto'}
                  </Text>
                </TouchableOpacity>
                )}

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
                    disabled={userType !== "mechanic" && images.length !== 4}
                  >
                    {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Confirmar</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal 
        visible={isLoading} 
        transparent
        animationType="fade"
        statusBarTranslucent // Fundamental para iOS
      >
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Platform.OS === 'ios' ? '#000' : '#3b82f6'} />
            <Text style={styles.loadingText}>A processar...</Text>
            <Text style={styles.loadingSubtext}>Por favor aguarde</Text>
          </View>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    marginVertical: 12,
  },

  inputWrapper: {
    flex: 1,
  },

  inputLabel: {
    position: 'absolute',
    top: -10,
    left: 8,
    fontSize: 12,
    color: '#94A3B8',
    backgroundColor: colors.background,
    paddingHorizontal: 4,
    zIndex: 1,
  },

  input: {
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 28,
    color: colors.text,
  },

  icon: {
    marginRight: 12,
  },

  notesInput: {
    textAlignVertical: 'top',
    minHeight: 80,
    paddingTop: 12,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginVertical: 10,
  },
  photoCell: {
    width: (width * 0.9 - 48 - 20) / 2,
    height: 100,
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
  photoContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 4,
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
    fontSize: 13, // 🔥 Um pouco maior para se destacar
    color: "#fbbf24", // 🔥 Amarelo para chamar atenção
    fontWeight: "600", // 🔥 Negrito para destaque
  },
  
  // Loading Styles
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backgroundColor: Platform.select({
      ios: 'rgba(0,0,0,0.6)', // Aumente a opacidade
      android: 'rgba(15,23,42,0.9)'
    }),
    ...Platform.select({
      ios: {
        paddingTop: 44, // Compensar pela status bar
        paddingBottom: 34 // Compensar pelo home indicator
      }
    })
  },
  loadingCard: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        marginHorizontal: 20, // Evitar que toque nas bordas
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
        width: width * 0.8
      }
    })
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F1A2F",
  },
});

export default TurnoHomeScreen;