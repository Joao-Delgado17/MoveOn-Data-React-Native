import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/useColorScheme";

// Impede a splash screen de fechar automaticamente antes do carregamento
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Login e Navegação Principal */}
            <Stack.Screen name="loginScreen" options={{ title: "Login" }} />
            <Stack.Screen name="(tabs)" />

            {/* Bloqueia voltar no TurnoHomeScreen */}
            <Stack.Screen
              name="TurnoHomeScreen"
              options={{ title: "Turno Ativo", gestureEnabled: false }}
            />

            {/* Permite voltar nos AddItemXScreen */}
            <Stack.Screen name="addItemLimeScreen" options={{ title: "Adicionar Lime", gestureEnabled: true }} />
            <Stack.Screen name="addItemRidemoviScreen" options={{ title: "Adicionar Ridemovi", gestureEnabled: true }} />
            <Stack.Screen name="addItemBirdScreen" options={{ title: "Adicionar Bird", gestureEnabled: true }} />
            <Stack.Screen name="addItemBoltScreen" options={{ title: "Adicionar Bolt", gestureEnabled: true }} />
            <Stack.Screen name="addItemLinkScreen" options={{ title: "Adicionar Link", gestureEnabled: true }} />
            <Stack.Screen name="addItemDeliveryScreen" options={{ title: "Adicionar Entrega", gestureEnabled: true }} />
            <Stack.Screen name="addItemMechanicScreen" options={{ title: "Adicionar Reparação", gestureEnabled: true }} />

            {/* Página de erro */}
            <Stack.Screen name="404Screen" />
          </Stack>

          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
