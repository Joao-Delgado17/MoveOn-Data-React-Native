import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Animated } from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons"; // Ícone da seta

type RootStackParamList = {
  addItemDeliveryScreen: undefined;
};

const DeliveryCard: React.FC<{ disabled?: boolean }> = ({ disabled = false }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();

  const [data, setData] = useState({ Entregas: 0 });
  const [expanded, setExpanded] = useState(false); // Começa colapsado
  const animatedHeight = new Animated.Value(expanded ? 110 : 80); // Altura animada

  useEffect(() => {
    const loadData = async () => {
      const storedTasks = await AsyncStorage.getItem("TASKS");
      const tasks = storedTasks ? JSON.parse(storedTasks) : {};
  
      const keys = Object.keys(data);
      const values = keys.map(key => tasks[`delivery_Entregas${key}`] ?? 0);
  
      const storedValues: any = {};
      keys.forEach((key, index) => {
        storedValues[key] = values[index];
      });
  
      console.log("📥 Dados carregados no DeliveryCard:", storedValues); // 🔥 Log para depuração
      setData(storedValues);
    };
  
    loadData();
  
    // 🔹 Atualiza sempre que o usuário volta para a tela
    const unsubscribe = navigation.addListener("focus", () => {
      loadData();
    });
  
    return unsubscribe;
  }, [navigation]);

  // Alterna expansão e colapso
  const toggleExpand = () => {
    setExpanded(!expanded);
    Animated.timing(animatedHeight, {
      toValue: expanded ? 80 : 110, // Alterna altura
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Animated.View style={[styles.card, { height: animatedHeight }, disabled && styles.disabledCard]}>
          <TouchableOpacity disabled={disabled} onPress={() => !disabled && navigation.navigate("addItemDeliveryScreen")}>
        <ImageBackground
          source={require("../../assets/images/last_mile_delivery.png")}
          style={styles.backgroundImage}
          imageStyle={{ opacity: 0.2, borderRadius: 12 }}
        >
          <LinearGradient colors={["rgba(66, 66, 66, 0.8)", "rgba(66, 66, 66, 0.4)"]} style={styles.overlay}>
            {/* Linha do título com botão de expandir */}
            <View style={styles.header}>
              <Text style={styles.title}>Last Mile</Text>
              <TouchableOpacity onPress={toggleExpand}>
                <MaterialIcons name={expanded ? "expand-less" : "expand-more"} size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Se colapsado, mostra só o total de tarefas */}
            {!expanded ? (
              <Text style={styles.totalText}>Total: {data.Entregas} entregas</Text>
            ) : (
              <View style={styles.table}>
                <View style={styles.row}>
                  <Text style={styles.cell}>Entregas</Text>
                  <Text style={styles.value}>{data.Entregas}</Text>
                </View>
              </View>
            )}
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    backgroundColor: "rgba(66, 66, 66, 0.8)", // Mantém a cor do gradiente no fundo
  },
  disabledCard: {
    opacity: 0.5, // Deixa o card visualmente "desativado"
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  table: {
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  cell: {
    fontSize: 16,
    color: "#FFF",
  },
  value: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
  },
  totalText: {
    marginTop: 8,
    fontSize: 18,
    color: "#FFF",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default DeliveryCard;
