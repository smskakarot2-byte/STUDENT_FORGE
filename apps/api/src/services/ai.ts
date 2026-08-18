import OpenAI from 'openai';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface DocumentAnalysis {
  topics: string[];
  summary: string;
  keyPoints: string[];
  questions: Array<{
    text: string;
    type: string;
    difficulty: string;
  }>;
}

export interface QuestionGeneration {
  questions: Array<{
    text: string;
    type: string;
    options?: string[];
    correctOption?: number;
    modelAnswer?: string;
    explanation?: string;
    difficulty: string;
    topic?: string;
  }>;
}

class AIService {
  private client: OpenAI | null = null;

  constructor() {
    if (config.aiProviderApiKey) {
      this.client = new OpenAI({
        apiKey: config.aiProviderApiKey,
        baseURL: config.aiProviderBaseUrl,
      });
    } else {
      logger.warn('AI Provider API key not configured. AI features will be disabled.');
    }
  }

  async analyzeDocument(content: string): Promise<DocumentAnalysis> {
    if (!this.client) {
      throw new Error('AI service not configured');
    }

    const response = await this.client.chat.completions.create({
      model: config.aiModel,
      messages: [
        {
          role: 'system',
          content: `You are an academic document analyzer. Analyze the provided educational content and extract:
1. Main topics covered
2. A brief summary
3. Key points
4. Potential exam questions

Respond in JSON format with this structure:
{
  "topics": ["topic1", "topic2"],
  "summary": "brief summary",
  "keyPoints": ["point1", "point2"],
  "questions": [{"text": "question", "type": "MCQ|SHORT_ANSWER|LONG_ANSWER", "difficulty": "EASY|MEDIUM|HARD"}]
}`,
        },
        {
          role: 'user',
          content: content.slice(0, config.aiMaxTokens - 500), // Leave room for response
        },
      ],
      temperature: config.aiTemperature,
      response_format: { type: 'json_object' },
    });

    const content_str = response.choices[0]?.message?.content;
    if (!content_str) {
      throw new Error('Empty response from AI');
    }

    const result = JSON.parse(content_str);
    
    return {
      topics: result.topics || [],
      summary: result.summary || '',
      keyPoints: result.keyPoints || [],
      questions: result.questions || [],
    };
  }

  async generateQuestions(
    context: string,
    topic: string,
    count: number,
    questionTypes: string[],
    difficulty: string
  ): Promise<QuestionGeneration> {
    if (!this.client) {
      throw new Error('AI service not configured');
    }

    const response = await this.client.chat.completions.create({
      model: config.aiModel,
      messages: [
        {
          role: 'system',
          content: `You are an expert educator creating exam questions. Generate ${count} questions about "${topic}" based on the provided context.
          
Question types to include: ${questionTypes.join(', ')}
Difficulty level: ${difficulty}

For MCQs, provide 4 options and indicate the correct one (0-indexed).
Include model answers and explanations.

Respond in JSON format:
{
  "questions": [
    {
      "text": "question text",
      "type": "MCQ|SHORT_ANSWER|LONG_ANSWER|NUMERICAL|CODING",
      "options": ["A) opt1", "B) opt2", "C) opt3", "D) opt4"],
      "correctOption": 0,
      "modelAnswer": "expected answer",
      "explanation": "why this is correct",
      "difficulty": "EASY|MEDIUM|HARD",
      "topic": "subtopic"
    }
  ]
}`,
        },
        {
          role: 'user',
          content: `Context:\n${context.slice(0, config.aiMaxTokens - 1000)}`,
        },
      ],
      temperature: config.aiTemperature + 0.2, // Slightly more creative for questions
      response_format: { type: 'json_object' },
    });

    const content_str = response.choices[0]?.message?.content;
    if (!content_str) {
      throw new Error('Empty response from AI');
    }

    return JSON.parse(content_str);
  }

  async answerQuestion(
    question: string,
    context: string[],
    courseMaterial: boolean = true
  ): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('AI service not configured');
    }

    const systemPrompt = courseMaterial
      ? `You are a helpful study assistant. Answer questions based PRIMARILY on the provided course material.
If the answer cannot be found in the material, clearly state "I couldn't find this in your uploaded material" before providing general knowledge.
Always cite which part of the material your answer comes from when possible.
Be clear, concise, and exam-focused.`
      : `You are a helpful study assistant. Answer questions clearly and concisely with an academic focus.`;

    const contextStr = context.length > 0
      ? `Relevant course material:\n\n${context.join('\n\n---\n\n')}`
      : '';

    const response = await this.client.chat.completions.create({
      model: config.aiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${contextStr}\n\nQuestion: ${question}` },
      ],
      temperature: config.aiTemperature,
    });

    return {
      content: response.choices[0]?.message?.content || 'No response generated',
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
    };
  }

  async gradeAnswer(
    question: string,
    studentAnswer: string,
    modelAnswer: string,
    rubric?: any
  ): Promise<{ score: number; feedback: string; strengths: string[]; improvements: string[] }> {
    if (!this.client) {
      throw new Error('AI service not configured');
    }

    const response = await this.client.chat.completions.create({
      model: config.aiModel,
      messages: [
        {
          role: 'system',
          content: `You are an expert grader. Evaluate the student's answer against the model answer.
Provide:
1. A score from 0-100
2. Brief feedback
3. Strengths in the answer
4. Areas for improvement

Respond in JSON format:
{
  "score": 85,
  "feedback": "Good explanation but missing key details...",
  "strengths": ["Correct concept", "Clear structure"],
  "improvements": ["Add more examples", "Mention edge cases"]
}`,
        },
        {
          role: 'user',
          content: `Question: ${question}\n\nModel Answer: ${modelAnswer}\n\nStudent Answer: ${studentAnswer}`,
        },
      ],
      temperature: 0.3, // More deterministic for grading
      response_format: { type: 'json_object' },
    });

    const content_str = response.choices[0]?.message?.content;
    if (!content_str) {
      throw new Error('Empty response from AI');
    }

    return JSON.parse(content_str);
  }

  async generateVivaQuestion(
    topic: string,
    previousAnswers: Array<{ question: string; answer: string }> = [],
    mode: string = 'NORMAL'
  ): Promise<{ question: string; followUpBasedOn: string | null }> {
    if (!this.client) {
      throw new Error('AI service not configured');
    }

    const modePrompts: Record<string, string> = {
      FRIENDLY: 'Be encouraging and ask straightforward questions. Provide hints if needed.',
      NORMAL: 'Ask standard viva questions at a moderate pace.',
      STRICT: 'Ask challenging questions and probe deeply into understanding.',
      BRUTAL: 'Ask very difficult questions, challenge every answer, and test limits aggressively.',
    };

    const previousContext = previousAnswers.length > 0
      ? `Previous questions and answers:\n${previousAnswers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n')}`
      : '';

    const response = await this.client.chat.completions.create({
      model: config.aiModel,
      messages: [
        {
          role: 'system',
          content: `You are a viva examiner conducting an oral exam on "${topic}".
Mode: ${mode} - ${modePrompts[mode] || modePrompts.NORMAL}

${previousContext}

Generate the next question. If there are previous answers, consider asking a follow-up that probes deeper.

Respond in JSON format:
{
  "question": "your question here",
  "followUpBasedOn": "previous question ID or null if this is a new topic"
}`,
        },
      ],
      temperature: config.aiTemperature + 0.3,
      response_format: { type: 'json_object' },
    });

    const content_str = response.choices[0]?.message?.content;
    if (!content_str) {
      throw new Error('Empty response from AI');
    }

    return JSON.parse(content_str);
  }

  async evaluateVivaAnswer(
    question: string,
    answer: string,
    topic: string
  ): Promise<{ score: number; feedback: string; correctness: string; completeness: string; followUpQuestion?: string }> {
    if (!this.client) {
      throw new Error('AI service not configured');
    }

    const response = await this.client.chat.completions.create({
      model: config.aiModel,
      messages: [
        {
          role: 'system',
          content: `You are a viva examiner. Evaluate this answer on a scale of 0-10.
Consider:
- Correctness of the technical content
- Completeness of the explanation
- Use of proper terminology
- Clarity of reasoning

Provide a follow-up question to probe deeper understanding.

Respond in JSON format:
{
  "score": 7.5,
  "feedback": "You correctly explained X, but missed Y...",
  "correctness": "Mostly correct with minor issues",
  "completeness": "Good coverage but could elaborate on...",
  "followUpQuestion": "Based on your answer, explain why..."
}`,
        },
        {
          role: 'user',
          content: `Topic: ${topic}\nQuestion: ${question}\nAnswer: ${answer}`,
        },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const content_str = response.choices[0]?.message?.content;
    if (!content_str) {
      throw new Error('Empty response from AI');
    }

    return JSON.parse(content_str);
  }

  async generateStudyPlan(
    courses: Array<{ name: string; examDate: string; topics: string[] }>,
    dailyAvailability: number,
    weaknesses: string[]
  ): Promise<{ days: Array<{ date: string; tasks: Array<{ course: string; topic: string; duration: number; type: string }> }> }> {
    if (!this.client) {
      throw new Error('AI service not configured');
    }

    const response = await this.client.chat.completions.create({
      model: config.aiModel,
      messages: [
        {
          role: 'system',
          content: `You are a study planning expert. Create a day-by-day study plan.
Daily availability: ${dailyAvailability} minutes
Weak areas to focus on: ${weaknesses.join(', ')}

Courses and exam dates:
${courses.map(c => `- ${c.name}: Exam on ${c.examDate}, Topics: ${c.topics.join(', ')}`).join('\n')}

Create a balanced plan that:
1. Prioritizes exams coming sooner
2. Allocates more time to weak areas
3. Includes practice sessions and reviews
4. Avoids burnout with varied topics

Respond in JSON format:
{
  "days": [
    {
      "date": "2024-01-15",
      "tasks": [
        {"course": "Course Name", "topic": "Topic", "duration": 45, "type": "STUDY|PRACTICE|QUIZ|REVIEW"}
      ]
    }
  ]
}`,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content_str = response.choices[0]?.message?.content;
    if (!content_str) {
      throw new Error('Empty response from AI');
    }

    return JSON.parse(content_str);
  }
}

export const aiService = new AIService();
export default aiService;
