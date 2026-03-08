import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  fetchLastDeliveryRoute,
  type DeliveryRoutePoint,
  type DeliveryRouteStats,
  type LastDeliveryRouteResponse,
} from "../scripts/GetLastDeliveryRoute";

// ✅ Se ainda não quiseres usar .env, mete a key aqui diretamente
const GOOGLE_MAPS_STATIC_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_STATIC_KEY || "";

const COLORS = {
  card: "#111C33",
  text: "#F8FAFC",
  muted: "#94A3B8",
  border: "#22304A",
  chip: "#0B142B",
  secondary: "#3B82F6",
  warning: "#FBBF24",
  success: "#10B981",
};

type ApiResponse = LastDeliveryRouteResponse;

const EMPTY: ApiResponse = {
  success: false,
  error: "Sem dados",
  points: [],
  stats: { stops: 0, kmEstimated: 0, entregas: 0, recolhas: 0 },
};

// Polyline encoder (Google)
function encodePolyline(points: { lat: number; lng: number }[]) {
  let lastLat = 0;
  let lastLng = 0;
  let result = "";

  const encode = (v: number) => {
    v = v < 0 ? ~(v << 1) : v << 1;
    let encoded = "";
    while (v >= 0x20) {
      encoded += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    encoded += String.fromCharCode(v + 63);
    return encoded;
  };

  for (const p of points) {
    const lat = Math.round(p.lat * 1e5);
    const lng = Math.round(p.lng * 1e5);
    result += encode(lat - lastLat);
    result += encode(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  }

  return result;
}

export default function LastShiftDeliveriesHourGraphic() {
  const [data, setData] = useState<ApiResponse>(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);

    try {
      const response = await fetchLastDeliveryRoute();
      setData(response);
    } catch (e: any) {
      setData({ ...EMPTY, error: e?.message || "Erro ao carregar dados" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const mapUrl = useMemo(() => {
    if (!GOOGLE_MAPS_STATIC_KEY) return null;
    if (!data?.points || data.points.length < 2) return null;

    const pathPoints = data.points.map((p) => ({ lat: p.lat, lng: p.lng }));
    const enc = encodePolyline(pathPoints);

    const start = data.points[0];
    const end = data.points[data.points.length - 1];

    return (
      "https://maps.googleapis.com/maps/api/staticmap" +
      `?size=900x450&scale=2&maptype=roadmap` +
      `&markers=color:green|label:S|${start.lat},${start.lng}` +
      `&markers=color:red|label:F|${end.lat},${end.lng}` +
      `&path=weight:5|color:0x3B82F6FF|enc:${enc}` +
      `&key=${GOOGLE_MAPS_STATIC_KEY}`
    );
  }, [data]);

  if (loading) {
    return (
      <View style={styles.stateCard}>
        <ActivityIndicator color={COLORS.secondary} />
        <Text style={styles.stateText}>A carregar atividade...</Text>
      </View>
    );
  }

  if (!data.success) {
    return (
      <View style={styles.stateCard}>
        <View style={styles.errorTop}>
          <View style={[styles.iconBadge, { borderColor: COLORS.warning }]}>
            <Icon name="error-outline" size={18} color={COLORS.warning} />
          </View>
          <Text style={styles.stateTitle}>Sem dados de rota</Text>
        </View>

        <Text style={styles.stateText}>{data.error}</Text>

        <TouchableOpacity
          style={styles.retryBtn}
          onPress={load}
          activeOpacity={0.85}
        >
          <Icon name="refresh" size={18} color={COLORS.text} />
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>

        <Text style={[styles.stateText, { marginTop: 10 }]}>
          Confirma no Sheets:
          {"\n"}• existe um turno do teu email na aba{" "}
          <Text style={styles.bold}>Delivery</Text>
          {"\n"}• existem logs com{" "}
          <Text style={styles.bold}>Latitude/Longitude</Text> na aba{" "}
          <Text style={styles.bold}>Logs de Tasks</Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <View style={[styles.iconBadge, { borderColor: COLORS.secondary }]}>
            <Icon name="route" size={18} color={COLORS.secondary} />
          </View>
          <Text style={styles.title}>Atividade do último turno</Text>
        </View>

        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={load}
          activeOpacity={0.85}
        >
          <Text style={styles.detailsTxt}>Atualizar</Text>
          <Icon name="refresh" size={16} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {mapUrl ? (
        <Image
          source={{ uri: mapUrl }}
          style={styles.mapImg}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.mapPlaceholder}>
          <Icon name="map" size={26} color={COLORS.muted} />
          <Text style={styles.placeholderText}>
            {data.points.length < 2
              ? "Ainda sem pontos suficientes para desenhar rota."
              : "Sem API key do mapa (Static Maps)."}
          </Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.chip}>
          <Icon name="place" size={16} color={COLORS.text} />
          <Text style={styles.chipText}>{data.stats.stops} paragens</Text>
        </View>

        <View style={styles.chip}>
          <Icon name="straighten" size={16} color={COLORS.text} />
          <Text style={styles.chipText}>
            {data.stats.kmEstimated} km (est.)
          </Text>
        </View>

        <View style={[styles.chip, { borderColor: "#2B3C5E" }]}>
          <Icon name="local-shipping" size={16} color={COLORS.text} />
          <Text style={styles.chipText}>{data.stats.entregas} entregas</Text>
        </View>

        <View style={[styles.chip, { borderColor: "#2B3C5E" }]}>
          <Icon name="move-to-inbox" size={16} color={COLORS.text} />
          <Text style={styles.chipText}>{data.stats.recolhas} recolhas</Text>
        </View>
      </View>

      <Text style={styles.hint}>
        Rota estimada a partir dos pontos onde registaste entregas/recolhas.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stateCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  errorTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stateTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  stateText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: "#1E293B",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#24324C",
  },
  retryText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  bold: {
    color: COLORS.text,
    fontWeight: "900",
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.chip,
  },
  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  detailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1E293B",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#24324C",
  },
  detailsTxt: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  mapImg: {
    width: "100%",
    height: 170,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#24324C",
    backgroundColor: "#0B142B",
  },
  mapPlaceholder: {
    width: "100%",
    height: 170,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#24324C",
    backgroundColor: "#0B142B",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
  },
  placeholderText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: COLORS.chip,
    borderWidth: 1,
    borderColor: "#22304A",
  },
  chipText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
  },
  hint: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
});