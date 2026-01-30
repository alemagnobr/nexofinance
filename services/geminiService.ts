
import { GoogleGenAI } from "@google/genai";
import { AppData, Investment, ChatMessage } from '../types';

const CATEGORIES = ['Casa', 'Mobilidade', 'Alimentos', 'Lazer', 'Pets', 'Outros'];
const API_KEY_STORAGE = 'nexo_user_api_key';

// Helper functions for API Key Management
export const getApiKey = (): string | null => {
  // First try the user's custom key stored in browser
  const storedKey = localStorage.getItem(API_KEY_STORAGE);
  if (storedKey) return storedKey;
  
  // Fallback to environment variable (dev mode or configured build)
  return process.env.API_KEY || null;
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

export const generateFinancialAdvice = async (data: AppData): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return "API Key não encontrada. Configure sua chave nas preferências do menu.";
  }

  const ai = new GoogleGenAI({ apiKey });

  const totalIncome = data.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = data.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingBills = data.transactions
    .filter(t => t.type === 'expense' && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalInvested = data.investments.reduce((sum, i) => sum + i.amount, 0);
  
  // Forecasting context
  const recurringExpenses = data.transactions.filter(t => t.isRecurring && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const prompt = `
    Atue como um consultor financeiro.
    Resumo:
    - Renda: R$ ${totalIncome.toFixed(2)}
    - Despesas: R$ ${totalExpense.toFixed(2)}
    - Contas Pendentes: R$ ${pendingBills.toFixed(2)}
    - Investido: R$ ${totalInvested.toFixed(2)}
    - Despesas Recorrentes (Assinaturas/Fixas): R$ ${recurringExpenses.toFixed(2)}
    
    Transações recentes: ${JSON.stringify(data.transactions.slice(-5))}

    Forneça 3 conselhos curtos (bullet points). Foque em:
    1. Fluxo de caixa e contas a pagar.
    2. Impacto dos gastos recorrentes/assinaturas.
    3. Oportunidade de investimento.
    Use Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Sem análise disponível.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro na IA. Verifique sua chave de API.";
  }
};

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
    Use o Google Search para encontrar oportunidades REAIS e ATUAIS (taxas de hoje, cotações recentes).
    
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
    // Usando gemini-3-flash-preview para uso da ferramenta Google Search
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Extract sources
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

    // Filter duplicate sources by URI
    const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);

    return {
      text: response.text || "Não foi possível gerar recomendações no momento.",
      sources: uniqueSources
    };

  } catch (error) {
    console.error("Investment Advice Error:", error);
    return { text: "Erro ao consultar consultor IA. Verifique sua chave.", sources: [] };
  }
};

// Function for Chatbot that implicitly generates a "report" for itself before answering
export const chatWithAdvisor = async (message: string, history: ChatMessage[], data: AppData): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Por favor, configure sua API Key nas preferências do menu.";

  const ai = new GoogleGenAI({ apiKey });

  // 1. Generate the "Report" internally (The Context)
  const income = data.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = data.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const invested = data.investments.reduce((s, i) => s + i.amount, 0);
  const debts = data.debts.reduce((s, d) => s + d.currentAmount, 0);
  
  // Detailed strings
  const recentTransactions = data.transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30) // More context
    .map(t => `- ${t.date}: ${t.description} (${t.type}) R$ ${t.amount} [${t.category}] Status: ${t.status}`)
    .join('\n');

  const investmentPortfolio = data.investments
    .map(i => `- ${i.name} (${i.type}): R$ ${i.amount} (Meta: R$ ${i.targetAmount})`)
    .join('\n');

  const debtList = data.debts
    .map(d => `- ${d.creditor}: R$ ${d.currentAmount} (Status: ${d.status}, Vence: ${d.dueDate})`)
    .join('\n');

  // This is the "Report" the AI reads for itself to understand the user's situation
  const financialContext = `
    RELATÓRIO FINANCEIRO DO USUÁRIO (Contexto Interno):
    
    1. RESUMO:
       - Renda Total: R$ ${income.toFixed(2)}
       - Despesas Totais: R$ ${expense.toFixed(2)}
       - Saldo: R$ ${(income - expense).toFixed(2)}
       - Total Investido: R$ ${invested.toFixed(2)}
       - Dívidas Ativas: R$ ${debts.toFixed(2)}

    2. ÚLTIMAS TRANSAÇÕES:
    ${recentTransactions}

    3. INVESTIMENTOS:
    ${investmentPortfolio}

    4. DÍVIDAS:
    ${debtList}
  `;

  const systemInstruction = `
    Você é o NEXO AI, um assistente financeiro pessoal de elite.
    
    OBJETIVO:
    Ajudar o usuário a gerenciar suas finanças, tirar dúvidas e dar conselhos estratégicos.

    CONTEXTO:
    Você acabou de ler o seguinte relatório financeiro completo do usuário. 
    Use essas informações para responder com precisão, sem que o usuário precise repetir os dados.
    ${financialContext}

    DIRETRIZES:
    - Responda de forma concisa e amigável.
    - Se o usuário perguntar sobre o saldo, gastos específicos ou investimentos, consulte o relatório acima.
    - Seja proativo: se vir uma dívida vencendo ou gasto alto, pode alertar sutilmente.
    - Use Markdown para formatar valores e listas.
    - NÃO inicie a conversa listando o relatório, apenas use-o como conhecimento prévio.
  `;

  // Build History for Gemini (last 10 turns)
  const conversationHistory = history.slice(-6).map(h => `${h.role === 'user' ? 'Usuário' : 'Modelo'}: ${h.content}`).join('\n');

  const prompt = `
    Histórico da conversa:
    ${conversationHistory}
    
    Nova mensagem do Usuário: ${message}
    Modelo:
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction
      }
    });
    return response.text || "Desculpe, não entendi.";
  } catch (error) {
    console.error(error);
    return "Erro de conexão com o cérebro digital. Verifique sua Chave de API.";
  }
};
