export const fetchVehicles = async (): Promise<string[]> => {
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbwuXU3XSCNkBxlTri0B7s4IzNTJwEWjrq9PXB1pDljp_SKJMqyxkLeAMhRGcBm0Y6wf/exec?action=getVehicles');
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      }

      const text = await response.text();
      console.log("📥 Resposta bruta da API:", text); // 🔥 Debugging

      const result = JSON.parse(text);

      if (!result || !Array.isArray(result.vehicles)) {
        throw new Error('❌ Estrutura inválida na resposta da API');
      }

      console.log("✅ Veículos recebidos:", result.vehicles);
      return result.vehicles;
    } catch (error) {
      console.error('❌ Erro ao buscar veículos:', error);
      return [];
    }
};
