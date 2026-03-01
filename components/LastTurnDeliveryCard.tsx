// components/LastTurnDeliveryCard.tsx
// ✅ Header novo: "Turnos do mês" (sem "Entregas")
// ✅ Setas: esquerda à esquerda, mês no meio, direita à direita
// ✅ Info ao lado direito do título (clean)
// ✅ NOVO: não mostrar turnos do próprio dia (só aparecem no dia seguinte)

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  fetchDeliveryMonthShifts,
  DeliveryMonthShiftItem,
} from "../scripts/GetDeliveryLastsShifts";

const COLORS = {
  card: "#111C33",
  text: "#F8FAFC",
  muted: "#94A3B8",
  border: "#22304A",
  chip: "#0B142B",
  secondary: "#3B82F6",
  warning: "#FBBF24",
  success: "#10B981",
  danger: "#EF4444",
  bg: "#0E1A33",
  soft: "#0C1630",
};

type Props = { username: string };

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const colorIncidNumber = (inc: number) => {
  if (inc >= 6) return COLORS.danger;
  if (inc >= 3) return COLORS.warning;
  return COLORS.success;
};

const colorEphNumber = (eph: number) => {
  if (eph < 6.1) return COLORS.danger;
  if (eph < 7.0) return COLORS.warning;
  return COLORS.success;
};

const calcDeliveriesPerHour = (entregas: number, durationSeconds: number) => {
  const hours = durationSeconds > 0 ? durationSeconds / 3600 : 0;
  if (hours <= 0) return 0;
  return entregas / hours;
};

// ✅ parse "dd/MM/yyyy" (pt-PT)
const parsePtDate = (s?: string) => {
  if (!s) return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  const d = new Date(yyyy, mm - 1, dd);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// ✅ regra: só mostrar turnos com data < hoje (nunca do próprio dia)
const hideTodayShifts = (arr: DeliveryMonthShiftItem[]) => {
  const today0 = startOfToday().getTime();

  return arr.filter((it: any) => {
    const ds: string =
      it?.date ??
      it?.data ??
      it?.Data ??
      it?.dataInicio ??
      it?.DataInicio ??
      it?.["Data Inicio"] ??
      "";

    const d = parsePtDate(ds);
    if (!d) return true; // se vier formato estranho, não bloqueia
    return d.getTime() < today0;
  });
};

const StatPill = ({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: string;
}) => (
  <View style={[styles.pill, { borderColor: color }]}>
    <Text style={styles.pillLabel} numberOfLines={1}>
      {label}
    </Text>

    <View style={styles.pillBottomRow}>
      <View style={[styles.pillIconBadge, { borderColor: color }]}>
        <Icon name={icon} size={16} color={color} />
      </View>

      <Text style={[styles.pillValue, { color }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  </View>
);

const LastTurnDeliveryCard: React.FC<Props> = ({ username }) => {
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);
  const [monthLabel, setMonthLabel] = useState("—");
  const [items, setItems] = useState<DeliveryMonthShiftItem[]>([]);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setItems([]);
    setMonthLabel("—");

    (async () => {
      const res = await fetchDeliveryMonthShifts(username, monthOffset);
      if (!mounted) return;

      const history = Array.isArray(res.history) ? res.history : [];

      // ✅ AQUI: filtra para não mostrar o turno do próprio dia
      const filtered = hideTodayShifts(history);

      setMonthLabel(res.monthLabel || "—");
      setItems(filtered);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [username, monthOffset]);

  const monthTotals = useMemo(() => {
    const totalEntregas = items.reduce(
      (acc, it: any) => acc + (Number(it.entregas) || 0),
      0
    );
    const totalIncid = items.reduce(
      (acc, it: any) => acc + (Number(it.incidencias) || 0),
      0
    );
    const totalSeconds = items.reduce(
      (acc, it: any) => acc + (Number(it.durationSeconds) || 0),
      0
    );

    const eph = calcDeliveriesPerHour(totalEntregas, totalSeconds);
    return { totalEntregas, totalIncid, eph };
  }, [items]);

  const openInfo = () => {
    Alert.alert(
      "Regras de cor",
      [
        "Entregas/h:",
        "• Vermelho: < 6.1",
        "• Amarelo: 6.1 – 6.9",
        "• Verde: ≥ 7.0",
        "",
        "Incidências:",
        "• Verde: 0 – 2",
        "• Amarelo: 3 – 5",
        "• Vermelho: ≥ 6",
        "",
        "Validação:",
        "• Turnos do próprio dia não aparecem.",
        "• Só ficam visíveis no dia seguinte.",
      ].join("\n")
    );
  };

  return (
    <View style={styles.wrapper}>
      {/* ✅ Header novo */}
      <View style={styles.headerWrap}>
        {/* Título + info */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Turnos do mês</Text>

          <TouchableOpacity
            onPress={openInfo}
            style={styles.infoBtn}
            activeOpacity={0.85}
          >
            <Icon name="info-outline" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator
              style={{ marginLeft: 6 }}
              size="small"
              color={COLORS.muted}
            />
          ) : null}
        </View>

        {/* Nav central */}
        <View style={styles.monthNav}>
          <TouchableOpacity
            onPress={() => setMonthOffset((v) => clamp(v + 1, 0, 48))}
            style={styles.navBtn}
            activeOpacity={0.85}
          >
            <Icon name="chevron-left" size={20} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.monthChip}>
            <Icon name="calendar-month" size={15} color={COLORS.muted} />
            <Text style={styles.monthText} numberOfLines={1}>
              {monthLabel}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setMonthOffset((v) => Math.max(0, v - 1))}
            style={[styles.navBtn, monthOffset === 0 && { opacity: 0.4 }]}
            activeOpacity={0.85}
            disabled={monthOffset === 0}
          >
            <Icon name="chevron-right" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading */}
      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="small" color={COLORS.muted} />
          <Text style={styles.loadingText}>A carregar turnos…</Text>
        </View>
      ) : null}

      {/* Empty */}
      {!loading && items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="info" size={18} color={COLORS.muted} />
          <Text style={styles.emptyText}>Sem turnos neste mês.</Text>
        </View>
      ) : null}

      {/* Resumo do mês */}
      {!loading && items.length > 0 ? (
        <View style={styles.summaryCard}>
          <View style={styles.summaryTitleRow}>
            <View style={[styles.iconBadge, { borderColor: COLORS.secondary }]}>
              <Icon name="insights" size={18} color={COLORS.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>Resumo do mês</Text>
              <Text style={styles.summaryHint}>Totais e médias do período</Text>
            </View>
          </View>

          <View style={styles.pillsRow}>
            <StatPill
              label="Total entregas"
              value={String(monthTotals.totalEntregas)}
              color={COLORS.secondary}
              icon="local-shipping"
            />
            <StatPill
              label="Entregas/h"
              value={monthTotals.eph ? monthTotals.eph.toFixed(1) : "0.0"}
              color={COLORS.success}
              icon="speed"
            />
            <StatPill
              label="Incidências"
              value={String(monthTotals.totalIncid)}
              color={COLORS.danger}
              icon="report-problem"
            />
          </View>
        </View>
      ) : null}

      {/* separador */}
      {!loading && items.length > 0 ? (
        <View style={styles.sectionDivider}>
          <View style={styles.divLine} />
          <View style={styles.divChip}>
            <Icon name="format-list-bulleted" size={14} color={COLORS.muted} />
            <Text style={styles.divText}>Turnos</Text>
          </View>
          <View style={styles.divLine} />
        </View>
      ) : null}

      {/* Lista do mês */}
      {!loading &&
        items.map((s: any, idx) => {
          const entregas = Number(s.entregas) || 0;
          const incid = Number(s.incidencias) || 0;
          const durSec = Number(s.durationSeconds) || 0;
          const eph = calcDeliveriesPerHour(entregas, durSec);

          return (
            <View key={`${s.date}-${idx}`} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.metrics}>
                  <View style={styles.metricRow}>
                    <View
                      style={[styles.badge, { borderColor: COLORS.secondary }]}
                    >
                      <Icon
                        name="local-shipping"
                        size={16}
                        color={COLORS.secondary}
                      />
                    </View>
                    <Text style={styles.metricLabel}>Entregas</Text>
                    <Text style={styles.metricValuePrimary}>
                      {String(entregas)}
                    </Text>
                  </View>

                  <View style={styles.metricRow}>
                    <View style={[styles.badge, { borderColor: COLORS.success }]}>
                      <Icon name="speed" size={16} color={COLORS.success} />
                    </View>
                    <Text style={styles.metricLabel}>Entregas/h</Text>
                    <Text
                      style={[
                        styles.metricValue,
                        { color: colorEphNumber(eph) },
                      ]}
                    >
                      {eph ? eph.toFixed(1) : "0.0"}
                    </Text>
                  </View>

                  <View style={styles.metricRow}>
                    <View style={[styles.badge, { borderColor: COLORS.danger }]}>
                      <Icon
                        name="report-problem"
                        size={16}
                        color={COLORS.danger}
                      />
                    </View>
                    <Text style={styles.metricLabel}>Incidências</Text>
                    <Text
                      style={[
                        styles.metricValue,
                        { color: colorIncidNumber(incid) },
                      ]}
                    >
                      {String(incid)}
                    </Text>
                  </View>
                </View>

                <View style={styles.rightBlock}>
                  <Text style={styles.date}>{s.date}</Text>
                  <Text style={styles.city}>{s.city}</Text>
                </View>
              </View>
            </View>
          );
        })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { gap: 12 },

  headerWrap: { gap: 10 },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: { color: COLORS.text, fontSize: 16, fontWeight: "900" },

  infoBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#24324C",
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },

  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  navBtn: {
    width: 44,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#24324C",
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  monthChip: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: COLORS.soft,
    borderWidth: 1,
    borderColor: "#22304A",
  },
  monthText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  loadingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: { color: COLORS.muted, fontSize: 13, fontWeight: "800" },

  summaryCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#29406B",
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.22,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 5 },
    }),
  },
  summaryTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  summaryTitle: { color: COLORS.text, fontSize: 14, fontWeight: "900" },
  summaryHint: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },

  pillsRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },

  pill: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flex: 1,
    minWidth: 0,
    height: 84,
    justifyContent: "space-between",
  },
  pillLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "900" },
  pillBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 2,
  },
  pillIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: COLORS.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  pillValue: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.2,
    fontVariant: ["tabular-nums"],
  },

  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
    marginBottom: 2,
  },
  divLine: { height: 1, flex: 1, backgroundColor: "#1D2A45", opacity: 0.9 },
  divChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: COLORS.soft,
    borderWidth: 1,
    borderColor: "#22304A",
  },
  divText: { color: COLORS.muted, fontSize: 12, fontWeight: "900" },

  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emptyText: { color: COLORS.muted, fontSize: 13, fontWeight: "800" },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.14,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 2 },
    }),
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  metrics: { flex: 1, gap: 10 },

  metricRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metricLabel: { color: COLORS.muted, fontSize: 13, fontWeight: "900" },

  metricValuePrimary: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    marginLeft: 6,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    marginLeft: 6,
  },

  rightBlock: { alignItems: "flex-end", gap: 4, minWidth: 110 },
  date: { color: COLORS.text, fontSize: 14, fontWeight: "900" },
  city: { color: COLORS.muted, fontSize: 12, fontWeight: "800" },

  badge: {
    width: 30,
    height: 30,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.chip,
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
});

export default LastTurnDeliveryCard;