// scripts/GetDeliveryLastsShifts.ts

export type DeliveryMonthShiftItem = {
  date: string;
  city: string;
  entregas: number;
  saida: number;
  incidencias: number;
  durationSeconds: number;
};

export type DeliveryMonthShiftsResponse = {
  monthLabel: string;
  history: DeliveryMonthShiftItem[];
};

const BASE_URL =
  "https://script.google.com/macros/s/AKfycbx8gkRzKjOe3amww6-xUF0IC7ZWQD88KYOIk4xubbulK9GVjrbPW6kNfucaFW26Xyt1/exec";

const safeJsonParse = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: "JSON parse failed", raw: text };
  }
};

export const fetchDeliveryMonthShifts = async (
  username: string,
  monthOffset: number = 0
): Promise<DeliveryMonthShiftsResponse> => {
  try {
    const url =
      `${BASE_URL}?action=getDeliveryMonthShifts` +
      `&username=${encodeURIComponent(username)}` +
      `&monthOffset=${encodeURIComponent(String(monthOffset))}`;

    const res = await fetch(url);
    const text = await res.text();

    console.log("📥 Resposta bruta da API (getDeliveryMonthShifts):", text);

    if (!res.ok) throw new Error(`Erro HTTP: ${res.status} - ${res.statusText}`);

    const result = safeJsonParse(text);

    if (!result || !result.ok || !Array.isArray(result.history)) {
      console.log("❌ Estrutura inválida (month shifts). Parsed:", result);
      return { monthLabel: "—", history: [] };
    }

    return {
      monthLabel: String(result.monthLabel || "—"),
      history: result.history,
    };
  } catch (err) {
    console.error("❌ Erro ao buscar month shifts:", err);
    return { monthLabel: "—", history: [] };
  }
};