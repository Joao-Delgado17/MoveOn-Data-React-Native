import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Animated } from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons"; // Ícone da seta

type RootStackParamList = {
  addItemLinkScreen: undefined;
};

const LinkCard: React.FC<{ disabled?: boolean }> = ({ disabled = false }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();

  const [data, setData] = useState({
    Deploy: 0,
    Collect: 0,
    Rebalance: 0,
    Missing: 0,
  });

  const [expanded, setExpanded] = useState(false); // Começa colapsado
  const animatedHeight = new Animated.Value(expanded ? 220 : 80); // Altura animada

  useEffect(() => {
    const loadData = async () => {
      const storedTasks = await AsyncStorage.getItem("TASKS");
      const tasks = storedTasks ? JSON.parse(storedTasks) : {};
  
      const keys = Object.keys(data);
      const values = keys.map(key => tasks[`link_${key}`] ?? 0);
  
      const storedValues: any = {};
      keys.forEach((key, index) => {
        storedValues[key] = values[index];
      });
  
      console.log("📥 Dados carregados no LinkCard:", storedValues); // 🔥 Log para depuração
      setData(storedValues);
    };
  
    loadData();
  
    // 🔹 Atualiza sempre que o usuário volta para a tela
    const unsubscribe = navigation.addListener("focus", () => {
      loadData();
    });
  
    return unsubscribe;
  }, [navigation]);

  // Calcula o total de tarefas
  const totalTarefas = Object.values(data).reduce((acc, curr) => acc + curr, 0);

  // Alterna expansão e colapso
  const toggleExpand = () => {
    setExpanded(!expanded);
    Animated.timing(animatedHeight, {
      toValue: expanded ? 80 : 220, // Alterna altura
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Animated.View style={[styles.card, { height: animatedHeight }, disabled && styles.disabledCard]}>
          <TouchableOpacity disabled={disabled} onPress={() => !disabled && navigation.navigate("addItemLinkScreen")}>
        <ImageBackground
          source={require("../../assets/images/link.png")}
          style={styles.backgroundImage}
          imageStyle={{ opacity: 0.2, borderRadius: 12 }}
        >
          <LinearGradient colors={["rgba(217, 255, 0, 0.6)", "rgba(217, 255, 0, 0.3)"]} style={styles.overlay}>
            {/* Linha do título com botão de expandir */}
            <View style={styles.header}>
              <Text style={styles.title}>Link</Text>
              <TouchableOpacity onPress={toggleExpand}>
                <MaterialIcons
                  name={expanded ? "expand-less" : "expand-more"}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
            </View>

            {/* Se colapsado, mostra só o total de tarefas */}
            {!expanded ? (
              <Text style={styles.totalText}>Total: {totalTarefas} tarefas</Text>
            ) : (
              <View style={styles.table}>
                {Object.entries(data).map(([key, value]) => (
                  <View key={key} style={styles.row}>
                    <Text style={styles.cell}>{formatLabel(key)}</Text>
                    <Text style={styles.value}>{String(value)}</Text>
                  </View>
                ))}
              </View>
            )}
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
};

const formatLabel = (key: string) => {
  const labels: Record<string, string> = {
    Deploy: "Deploy",
    Collect: "Collect",
    Rebalance: "Rebalance",
    Missing: "Missing",
  };
  return labels[key] || key;
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
    backgroundColor: "rgba(217, 255, 0, 0.6)", // Cor de fundo para manter a consistência
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
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
    fontWeight: "500",
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

export default LinkCard;
