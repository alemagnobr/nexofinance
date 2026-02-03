
import { GoogleGenAI, Type } from "@google/genai";
import { AppData, Investment, ChatMessage, RiskProfile } from '../types';

const CATEGORIES = ['Casa', 'Mobilidade', 'Alimentos', 'Lazer', 'Pets', 'Outros'];
const API_KEY_STORAGE = 'nexo_user_api_key';

// Helper functions for API Key Management
export const getApiKey = (): string | null => {
  // Only use the user's custom key stored in browser
  const storedKey = localStorage.getItem(API_KEY_STORAGE);
  if (storedKey) return storedKey;
  
  // No fallback to process.env.API_KEY anymore
  return null;
};

export const setApiKey = (key: string) => {
  localStorage.setItem(API_KEY_STORAGE, key);
};

export const removeApiKey = () => {
  localStorage.removeItem(API_KEY_STORAGE);
};

export const hasCustomApiKey = (): boolean => {
  return !!localStorage.getItem(API_KEY_STORAGE);
};

// Types for the Investment Advice response
export interface InvestmentAdviceResult {
  text: string;
  sources: { title: string; uri: string }[];
}

// New Interface for Structured Wealth Analysis
export interface WealthAnalysisResult {
    analysisText: string;
    currentAllocation: { name: string; value: number }[];
    suggestedAllocation: { name: string; value: number }[];
    actionItems: { title: string; type: 'buy' | 'sell' | 'hold'; description: string }[];
}


export const suggestCategory = async (description: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return 'Outros';

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Classifique "${description}" em: ${CATEGORIES.join(', ')}. Responda SÓ a categoria.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    const text = response.text?.trim() || 'Outros';
    return CATEGORIES.includes(text) ? text : 'Outros';
  } catch (error) {
    return 'Outros';
  }
};

export const analyzeReceipt = async (base64Image: string): Promise<any> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  // Prompt specifically for Gemini Vision
  const prompt = `
    Analise esta imagem de recibo/nota fiscal.
    Extraia:
    1. Nome do estabelecimento (description)
    2. Valor total (amount)
    3. Data (date) no formato YYYY-MM-DD
    4. Categoria provável (${CATEGORIES.join(', ')})

    Responda EXATAMENTE neste formato JSON, sem crase ou markdown:
    { "description": "...", "amount": 0.00, "date": "YYYY-MM-DD", "category": "..." }
  `;

  try {
    // Usando gemini-3-flash-preview para tarefas multimodais (texto + imagem)
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      }
    });

    let text = response.text?.trim();
    if (text?.startsWith('```json')) text = text.replace('```json', '').replace('```', '');
    
    return JSON.parse(text || '{}');
  } catch (error) {
    console.error("Receipt analysis error:", error);
    return null;
  }
};

export const getInvestmentAdvice = async (investments: Investment[]): Promise<InvestmentAdviceResult> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { 
      text: "Configure sua API Key nas preferências para receber recomendações de investimentos.", 
      sources: [] 
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  const portfolioSummary = investments.map(i => `${i.name} (${i.type}): R$ ${i.amount}`).join(', ');
  const totalValue = investments.reduce((acc, i) => acc + i.amount, 0);

  const prompt = `
    Você é um consultor de investimentos sênior especialista no mercado brasileiro.
    Carteira Atual: R$ ${totalValue} (${portfolioSummary || "Vazia"}).

    TAREFA:
    Encontre oportunidades REAIS e ATUAIS para diversificação.
    
    FORMATO OBRIGATÓRIO (Siga estritamente):
    
    ### 🛡️ Baixo Risco
    1. **[Nome]** - [Taxa/Preço] - [Motivo curto]
    2. **[Nome]** - [Taxa/Preço] - [Motivo curto]
    3. **[Nome]** - [Taxa/Preço] - [Motivo curto]

    ### ⚖️ Médio Risco
    (3 opções no mesmo formato)

    ### 🚀 Alto Risco
    (3 opções no mesmo formato)

    ---SECTION-BREAK---

    ### 🧠 Análise Técnica
    (Sua análise detalhada aqui sobre cenário macro, inflação e porquês)
  `;

  try {
    // Tentativa 1: Com Google Search (Grounding)
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const sources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach(chunk => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Fonte Web",
            uri: chunk.web.uri || "#"
          });
        }
      });
    }

    const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);

    return {
      text: response.text || "Não foi possível gerar recomendações no momento.",
      sources: uniqueSources
    };

  } catch (error: any) {
    console.warn("Google Search Grounding failed, retrying without search...", error);
    
    // Tentativa 2: Fallback sem Google Search (para evitar erro total)
    try {
        const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt + "\n\n(Nota: A pesquisa em tempo real falhou. Use seu conhecimento geral.)",
        });
        
        return {
            text: (fallbackResponse.text || "Sem resposta.") + "\n\n⚠️ *Nota: O acesso à pesquisa em tempo real falhou. As taxas mencionadas podem ser estimativas baseadas no conhecimento geral do modelo.*",
            sources: []
        };
    } catch (fallbackError: any) {
        console.error("Investment Advice Error (Fallback):", fallbackError);
        return { 
            text: `Erro ao consultar IA: ${fallbackError.message || "Erro desconhecido"}. Verifique sua chave API ou tente novamente mais tarde.`, 
            sources: [] 
        };
    }
  }
};

// NEW FUNCTION: Structured Analysis for Wealth Planner
export const analyzeWealthPortfolio = async (investments: Investment[], riskProfile: RiskProfile, age: number): Promise<WealthAnalysisResult | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });

    // Aggregate current allocation
    const allocationMap = new Map<string, number>();
    investments.forEach(inv => {
        allocationMap.set(inv.type, (allocationMap.get(inv.type) || 0) + inv.amount);
    });
    
    // Create clear summary for AI
    const portfolioSummary = Array.from(allocationMap.entries())
        .map(([type, amount]) => `${type}: R$ ${amount.toFixed(2)}`)
        .join(', ');

    const prompt = `
      Atue como um Gestor de Private Banking. O cliente tem ${age} anos e perfil de risco: ${riskProfile.toUpperCase()}.
      
      Carteira Atual Agregada: ${portfolioSummary || "R$ 0,00 (Vazia)"}

      Sua tarefa é analisar a alocação de ativos e sugerir o rebalanceamento ideal baseado nas melhores práticas de Wealth Management (como Bridgewater/Arta) adaptado ao Brasil.
      
      RETORNE APENAS JSON VÁLIDO. NÃO USE MARKDOWN. Siga este esquema:
      {
        "analysisText": "Parágrafo curto (max 300 chars) com sua visão macro sobre a carteira do cliente.",
        "currentAllocation": [ {"name": "Categoria", "value": %_atual (0-100)} ],
        "suggestedAllocation": [ {"name": "Categoria", "value": %_ideal (0-100)} ],
        "actionItems": [
           {"title": "Ação Tática", "type": "buy" | "sell" | "hold", "description": "Explicação curta"}
        ]
      }
      
      Regras:
      1. 'suggestedAllocation' deve somar 100.
      2. Categorias sugeridas podem ser: 'Renda Fixa Pós', 'Renda Fixa Pré/IPCA', 'Ações Brasil', 'Ações Global', 'FIIs', 'Cripto/Alternativos', 'Reserva'.
      3. Se a carteira estiver vazia, sugira a alocação ideal do zero.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' } // Enforcing JSON mode
        });

        const jsonStr = response.text?.trim() || "{}";
        return JSON.parse(jsonStr) as WealthAnalysisResult;

    } catch (error) {
        console.error("Wealth Analysis Error:", error);
        return null;
    }
};

// STREAMING Implementation
export async function* chatWithAdvisorStream(message: string, history: ChatMessage[], data: AppData) {
  const apiKey = getApiKey();
  if (!apiKey) {
    yield "Por favor, configure sua API Key nas preferências do menu.";
    return;
  }

  const ai = new GoogleGenAI({ apiKey });

  const income = data.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = data.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const invested = data.investments.reduce((s, i) => s + i.amount, 0);
  const debts = data.debts.reduce((s, d) => s + d.currentAmount, 0);
  
  const recentTransactions = data.transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30)
    .map(t => `- ${t.date}: ${t.description} (${t.type}) R$ ${t.amount} [${t.category}] Status: ${t.status}`)
    .join('\n');

  const investmentPortfolio = data.investments
    .map(i => `- ${i.name} (${i.type}): R$ ${i.amount} (Meta: R$ ${i.targetAmount})`)
    .join('\n');

  const debtList = data.debts
    .map(d => `- ${d.creditor}: R$ ${d.currentAmount} (Status: ${d.status}, Vence: ${d.dueDate})`)
    .join('\n');

  let userPersona = "Neutro";
  if (debts > invested * 2) userPersona = "Endividado (Foco em quitação)";
  else if (invested > expense * 6) userPersona = "Investidor (Foco em otimização)";
  else if (income < expense) userPersona = "Déficit (Foco em corte de gastos)";

  const financialContext = `
    RELATÓRIO FINANCEIRO DO USUÁRIO (Contexto Interno):
    
    1. PERFIL IDENTIFICADO: ${userPersona}
    2. RESUMO:
       - Renda Total: R$ ${income.toFixed(2)}
       - Despesas Totais: R$ ${expense.toFixed(2)}
       - Saldo: R$ ${(income - expense).toFixed(2)}
       - Total Investido: R$ ${invested.toFixed(2)}
       - Dívidas Ativas: R$ ${debts.toFixed(2)}
    3. ÚLTIMAS TRANSAÇÕES:
    ${recentTransactions}
    4. INVESTIMENTOS:
    ${investmentPortfolio}
    5. DÍVIDAS:
    ${debtList}
  `;

  const systemInstruction = `
    Você é o NEXO AI, um assistente financeiro pessoal de elite.
    OBJETIVO: Ajudar o usuário a gerenciar suas finanças com base no perfil identificado: ${userPersona}.
    CONTEXTO: ${financialContext}
    DIRETRIZES:
    - Responda de forma concisa e amigável.
    - Se o usuário perguntar sobre o saldo, gastos específicos ou investimentos, consulte o relatório acima.
    - Seja proativo: se vir uma dívida vencendo ou gasto alto, pode alertar sutilmente.
    - Use Markdown para formatar valores e listas.
  `;

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: { systemInstruction }
  });
  
  const conversationHistory = history.slice(-6).map(h => `${h.role === 'user' ? 'Usuário' : 'Modelo'}: ${h.content}`).join('\n');
  const fullMessage = `
    [Histórico Recente]:
    ${conversationHistory}
    
    [Nova Mensagem]: ${message}
  `;

  try {
    const result = await chat.sendMessageStream({ message: fullMessage });
    for await (const chunk of result) {
       if (chunk.text) {
          yield chunk.text;
       }
    }
  } catch (error) {
    console.error(error);
    yield "Erro de conexão com o cérebro digital. Verifique sua Chave de API.";
  }
}
