import OpenAI from "openai";
import type { TaskWithDetails } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!openai && (process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY)) {
    openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY 
    });
  }
  return openai;
}

class OpenAIService {
  async findTasksWithAI(query: string, tasks: TaskWithDetails[]): Promise<TaskWithDetails[]> {
    try {
      if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY && !process.env.API_KEY) {
        console.warn("OpenAI API key not configured, falling back to basic search");
        return this.basicSearch(query, tasks);
      }

      const systemInstruction = `
        Você é um assistente de IA especializado em gestão de projetos arquitetônicos da empresa FAAE Projetos.
        Sua tarefa é analisar uma consulta do usuário e encontrar as tarefas mais relevantes de uma lista fornecida.
        
        Analise a consulta e identifique qual(is) tarefa(s) são mais relevantes baseando-se em:
        - Título da tarefa
        - Descrição da tarefa
        - Status da tarefa
        - Prioridade
        - Projeto relacionado
        - Usuário responsável
        - Datas de início e fim
        
        Responda APENAS com um array JSON das tarefas relevantes. Se nenhuma tarefa corresponder, retorne um array vazio [].
        Não adicione texto de conversação, explicações ou markdown. A resposta deve ser um JSON válido.
      `;

      const prompt = `
        Lista de Tarefas (JSON):
        ${JSON.stringify(tasks, null, 2)}

        Consulta do Usuário:
        "${query}"
      `;

      const client = getOpenAIClient();
      if (!client) {
        console.warn("OpenAI API key not configured, falling back to basic search");
        return this.basicSearch(query, tasks);
      }

      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000,
      });

      const result = response.choices[0].message.content;
      if (!result) {
        return this.basicSearch(query, tasks);
      }

      try {
        const parsedResult = JSON.parse(result);
        
        // Handle different response formats
        if (Array.isArray(parsedResult)) {
          return parsedResult;
        } else if (parsedResult.tasks && Array.isArray(parsedResult.tasks)) {
          return parsedResult.tasks;
        } else if (parsedResult.results && Array.isArray(parsedResult.results)) {
          return parsedResult.results;
        } else {
          return this.basicSearch(query, tasks);
        }
      } catch (parseError) {
        console.error("Error parsing OpenAI response:", parseError);
        return this.basicSearch(query, tasks);
      }
    } catch (error) {
      console.error("OpenAI API error:", error);
      return this.basicSearch(query, tasks);
    }
  }

  private basicSearch(query: string, tasks: TaskWithDetails[]): TaskWithDetails[] {
    const searchTerm = query.toLowerCase();
    
    return tasks.filter(task => 
      task.title.toLowerCase().includes(searchTerm) ||
      task.description?.toLowerCase().includes(searchTerm) ||
      task.project?.name.toLowerCase().includes(searchTerm) ||
      task.assignedUser?.firstName?.toLowerCase().includes(searchTerm) ||
      task.assignedUser?.lastName?.toLowerCase().includes(searchTerm) ||
      task.status.toLowerCase().includes(searchTerm) ||
      task.priority.toLowerCase().includes(searchTerm)
    );
  }

  async generateTaskSuggestions(projectName: string, taskCount: number = 5): Promise<string[]> {
    try {
      if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY && !process.env.API_KEY) {
        return [
          "Revisar plantas baixas",
          "Criar modelo 3D",
          "Preparar documentação",
          "Verificar especificações técnicas",
          "Coordenar com equipe"
        ];
      }

      const client = getOpenAIClient();
      if (!client) {
        return [
          "Revisar plantas baixas",
          "Criar modelo 3D",
          "Preparar documentação",
          "Verificar especificações técnicas",
          "Coordenar com equipe"
        ];
      }

      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: `Como especialista em projetos arquitetônicos, sugira ${taskCount} tarefas específicas e práticas para o projeto "${projectName}". Responda com um JSON array de strings, sem explicações adicionais.`
        }],
        response_format: { type: "json_object" },
      });

      const result = response.choices[0].message.content;
      if (result) {
        const parsed = JSON.parse(result);
        return Array.isArray(parsed) ? parsed : parsed.suggestions || [];
      }
    } catch (error) {
      console.error("Error generating task suggestions:", error);
    }

    return [
      "Revisar plantas baixas",
      "Criar modelo 3D",
      "Preparar documentação",
      "Verificar especificações técnicas",
      "Coordenar com equipe"
    ];
  }

  async analyzeProjectHealth(tasks: TaskWithDetails[]): Promise<{
    score: number;
    insights: string[];
    recommendations: string[];
  }> {
    try {
      if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY && !process.env.API_KEY) {
        return this.basicProjectAnalysis(tasks);
      }

      const client = getOpenAIClient();
      if (!client) {
        return this.basicProjectAnalysis(tasks);
      }

      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "system",
          content: "Você é um especialista em gestão de projetos arquitetônicos. Analise as tarefas fornecidas e forneça insights sobre a saúde do projeto."
        }, {
          role: "user",
          content: `Analise estas tarefas e forneça uma análise da saúde do projeto:
          
          ${JSON.stringify(tasks, null, 2)}
          
          Responda com JSON contendo:
          - score (0-100): pontuação da saúde do projeto
          - insights: array de observações importantes
          - recommendations: array de recomendações para melhoria`
        }],
        response_format: { type: "json_object" },
      });

      const result = response.choices[0].message.content;
      if (result) {
        return JSON.parse(result);
      }
    } catch (error) {
      console.error("Error analyzing project health:", error);
    }

    return this.basicProjectAnalysis(tasks);
  }

  private basicProjectAnalysis(tasks: TaskWithDetails[]): {
    score: number;
    insights: string[];
    recommendations: string[];
  } {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'concluida').length;
    const overdue = tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'concluida'
    ).length;
    
    let score = 70; // Base score
    
    if (total > 0) {
      const completionRate = completed / total;
      score += completionRate * 20; // Up to 20 points for completion
      
      const overdueRate = overdue / total;
      score -= overdueRate * 30; // Lose up to 30 points for overdue tasks
    }

    const insights = [
      `${completed} de ${total} tarefas concluídas (${Math.round((completed/total) * 100)}%)`,
      overdue > 0 ? `${overdue} tarefas em atraso` : "Nenhuma tarefa em atraso",
    ];

    const recommendations = [];
    if (overdue > 0) {
      recommendations.push("Priorizar tarefas em atraso");
    }
    if (completed / total < 0.5) {
      recommendations.push("Acelerar o ritmo de conclusão de tarefas");
    }
    if (tasks.filter(t => t.status === 'aberta').length > 5) {
      recommendations.push("Distribuir melhor as tarefas abertas");
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      insights,
      recommendations: recommendations.length > 0 ? recommendations : ["Projeto está progredindo bem"],
    };
  }
}

export const openaiService = new OpenAIService();
