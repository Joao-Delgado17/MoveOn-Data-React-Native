import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const COLORS = {
  primary: "#0F1A2F",
  secondary: "#3B82F6",
  background: "#1E293B",
  card: "#111C33",
  text: "#F8FAFC",
  muted: "#94A3B8",
  warning: "#FBBF24",
  success: "#10B981",
};

type Props = {
  totalEntregas?: number;
  encomendasInicial?: number;
  encomendasFinal?: number;
  tempoForaArmazem?: string; // "HH:mm:ss"
  onPressDetalhes?: () => void;
};

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  accentColor,
  footerRight,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  accentColor: string;
  footerRight?: React.ReactNode;
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardTitleRow}>
          <View style={[styles.iconBadge, { borderColor: accentColor }]}>
            <Icon name={icon} size={18} color={accentColor} />
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        {footerRight}
      </View>

      <Text style={styles.cardValue}>{value}</Text>
      {!!subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}

      <View style={styles.cardDivider} />
      <View style={styles.cardBottomRow}>
        <Text style={styles.cardHint}>Atualiza ao finalizar o turno</Text>
        <Icon name="chevron-right" size={18} color={COLORS.muted} />
      </View>
    </View>
  );
};

const DeliveryDashboardCards: React.FC<Props> = ({
  totalEntregas = 0,
  encomendasInicial = 0,
  encomendasFinal = 0,
  tempoForaArmazem = "00:00:00",
  onPressDetalhes,
}) => {
  const entreguesCalc = encomendasInicial - encomendasFinal;
  const entregues =
    entreguesCalc >= 0 ? entreguesCalc : undefined;

  return (
    <View style={styles.wrapper}>
      {/* Header mini */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Resumo de Entregas</Text>
        <TouchableOpacity
          onPress={onPressDetalhes}
          style={styles.detailsButton}
          activeOpacity={0.85}
        >
          <Text style={styles.detailsText}>Detalhes</Text>
          <Icon name="open-in-new" size={16} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Cards */}
      <View style={styles.grid}>
        <StatCard
          title="Entregas"
          value={String(totalEntregas)}
          subtitle="Total registado no turno"
          icon="local-shipping"
          accentColor={COLORS.secondary}
        />

        <StatCard
          title="Encomendas"
          value={`${encomendasInicial} → ${encomendasFinal}`}
          subtitle={
            entregues !== undefined
              ? `Diferença: ${entregues} entregues`
              : "Diferença: N/A"
          }
          icon="inventory"
          accentColor={COLORS.warning}
        />

        <StatCard
          title="Fora do Armazém"
          value={tempoForaArmazem}
          subtitle="Tempo entre saída e chegada"
          icon="timer"
          accentColor={COLORS.success}
        />
      </View>

      {/* Card extra: sugestões rápidas */}
      <View style={[styles.card, styles.tipCard]}>
        <View style={styles.tipRow}>
          <View style={[styles.iconBadge, { borderColor: COLORS.secondary }]}>
            <Icon name="tips-and-updates" size={18} color={COLORS.secondary} />
          </View>
          <Text style={styles.tipTitle}>Dica</Text>
        </View>

        <Text style={styles.tipText}>
          Se os números não baterem, confirma se registaste{" "}
          <Text style={styles.bold}>Saída</Text> e{" "}
          <Text style={styles.bold}>Chegada</Text> ao armazém.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 6,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.background,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#24324C",
  },
  detailsText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  grid: {
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#22304A",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B142B",
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  cardValue: {
    marginTop: 12,
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "500",
  },
  cardDivider: {
    marginTop: 14,
    height: 1,
    backgroundColor: "#1D2A45",
  },
  cardBottomRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHint: {
    color: "#7C8AA6",
    fontSize: 12,
    fontWeight: "600",
  },
  tipCard: {
    backgroundColor: "#0E1A33",
    borderColor: "#29406B",
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tipTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  tipText: {
    marginTop: 10,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  bold: {
    color: COLORS.text,
    fontWeight: "800",
  },
});

export default DeliveryDashboardCards;
