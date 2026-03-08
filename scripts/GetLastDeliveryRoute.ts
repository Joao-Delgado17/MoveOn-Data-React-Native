import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ URL OFICIAL deste endpoint
const BASE_URL =
  "https://script.google.com/macros/s/AKfycbziem5zaxTAA4397rIPzkyjjHhUAgmZzF44fdZR9HvncsDV66JCknO-MuOy_4rTC-m7/exec";

export type DeliveryRoutePoint = {
  date: string;
  time: string;
  city: string;
  operator: string;
  task: string;
  qty: number;
  lat: number;
  lng: number;
};

export type DeliveryRouteStats = {
  stops: number;
  kmEstimated: number;
  entregas: number;
  recolhas: number;
};

export type LastDeliveryRouteResponse = {
  success: boolean;
  error?: string;
  points: DeliveryRoutePoint[];
  stats: DeliveryRouteStats;
  lastShift?: {
    username: string;
    city: string;
    dataInicio: string;
    horaInicio: string;
    horaFim: string;
    dataFim: string;
  };
};

const EMPTY: LastDeliveryRouteResponse = {
  success: false,
  error: "Sem dados",
  points: [],
  stats: { stops: 0, kmEstimated: 0, entregas: 0, recolhas: 0 },
};

export async function fetchLastDeliveryRoute(): Promise<LastDeliveryRouteResponse> {
  try {
    const username = ((await AsyncStorage.getItem("USERNAME")) || "")
      .trim()
      .toLowerCase();

    if (!username) {
      return { ...EMPTY, error: "USERNAME não encontrado (login?)" };
    }

    if (!BASE_URL) {
      return { ...EMPTY, error: "BASE_URL não configurado" };
    }

    const url = `${BASE_URL}?action=getLastDeliveryRoute&user=${encodeURIComponent(
      username
    )}`;

    const res = await fetch(url);
    const text = await res.text();

    let json: LastDeliveryRouteResponse;
    try {
      json = JSON.parse(text);
    } catch {
      return { ...EMPTY, error: "Resposta inválida da API (JSON)" };
    }

    if (!res.ok || !json.success) {
      return { ...EMPTY, error: json.error || `HTTP ${res.status}` };
    }

    return json;
  } catch (e: any) {
    return { ...EMPTY, error: e?.message || "Erro ao carregar rota" };
  }
}