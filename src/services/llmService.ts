// PsyTrack LLM Service
// This service handles integration with LLMs for emotion summarization

import { EmotionState, TimeCapsuleEntry, SessionSummary, SummaryOptions } from '@/lib/aiCore';
import DBService from './dbService';

// Types for LLM integration
export interface LLMProvider {
  name: string;
  apiEndpoint: string;
  apiKey?: string;
  modelName: string;
  maxTokens: number;
  temperature: number;
}

export interface LLMRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
  provider: string;
}

export interface LLMResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: string;
  timestamp: number;
}

// Cache entry
interface CacheEntry {
  response: LLMResponse;
  expiryTime: number;
}

// Callbacks
type LLMResponseCallback = (response: LLMResponse) => void;
type LLMErrorCallback = (error: Error, request: LLMRequest) => void;

class LLMService {
  private static instance: LLMService;

  // Providers
  private providers: Map<string, LLMProvider> = new Map();
  private defaultProvider: string = 'template'; // Default to template-based (no actual LLM)

  // Cache
  private cache: Map<string, CacheEntry> = new Map();
  private cacheSize: number = 50;
  private cacheExpiryMs: number = 24 * 60 * 60 * 1000; // 24 hours

  // Database
  private dbService: DBService;

  // Callbacks
  private responseCallbacks: LLMResponseCallback[] = [];
  private errorCallbacks: LLMErrorCallback[] = [];

  // Rate limiting
  private requestQueue: LLMRequest[] = [];
  private isProcessingQueue: boolean = false;
  private requestsPerMinute: number = 10;
  private lastRequestTime: number = 0;

  private constructor() {
    // Initialize database service
    this.dbService = DBService.getInstance();

    // Register providers
    this.registerTemplateProvider();

    console.log('LLM Service initialized');
  }

  // Get the singleton instance
  public static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  // Register the template provider (no actual LLM)
  private registerTemplateProvider(): void {
    const templateProvider: LLMProvider = {
      name: 'template',
      apiEndpoint: '',
      modelName: 'template',
      maxTokens: 1000,
      temperature: 0.7
    };

    this.providers.set('template', templateProvider);
    console.log('Template provider registered');
  }

  // Register an OpenAI provider
  public registerOpenAIProvider(apiKey: string, modelName: string = 'gpt-3.5-turbo'): void {
    const openaiProvider: LLMProvider = {
      name: 'openai',
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey,
      modelName,
      maxTokens: 1000,
      temperature: 0.7
    };

    this.providers.set('openai', openaiProvider);
    this.defaultProvider = 'openai';
    console.log('OpenAI provider registered');
  }

  // Set the default provider
  public setDefaultProvider(providerName: string): void {
    if (!this.providers.has(providerName)) {
      console.warn(`Provider "${providerName}" not registered`);
      return;
    }

    this.defaultProvider = providerName;
    console.log(`Default provider set to "${providerName}"`);
  }

  // Generate a session summary using an LLM
  public async generateSessionSummary(
    states: EmotionState[],
    entries: TimeCapsuleEntry[],
    options?: SummaryOptions
  ): Promise<SessionSummary> {
    // Check if we should use an actual LLM
    const useActualLLM = this.defaultProvider !== 'template';

    if (!useActualLLM) {
      // Use template-based summarization
      return this.generateTemplateSummary(states, entries, options);
    }

    // Generate prompt for LLM
    const prompt = this.generateSummaryPrompt(states, entries, options);

    // Generate cache key
    const cacheKey = this.generateCacheKey(prompt);

    // Check cache
    const cachedResponse = this.getCachedResponse(cacheKey);
    if (cachedResponse) {
      return this.parseSummaryResponse(cachedResponse, states, entries);
    }

    try {
      // Send request to LLM
      const request: LLMRequest = {
        prompt,
        maxTokens: options?.maxLength || 500,
        temperature: 0.7,
        provider: this.defaultProvider
      };

      const response = await this.sendRequest(request);

      // Cache response
      this.cacheResponse(cacheKey, response);

      // Parse response into SessionSummary
      return this.parseSummaryResponse(response, states, entries);
    } catch (error) {
      console.error('Error generating session summary with LLM:', error);

      // Fall back to template-based summarization
      return this.generateTemplateSummary(states, entries, options);
    }
  }

  // Generate a template-based summary (no actual LLM)
  private async generateTemplateSummary(
    states: EmotionState[],
    entries: TimeCapsuleEntry[],
    options?: SummaryOptions
  ): Promise<SessionSummary> {
    // Import the template summarizer from aiCore
    const { TemplateLLMSummarizer } = await import('@/lib/aiCore');

    // Create a new template summarizer
    const templateSummarizer = new TemplateLLMSummarizer();

    // Generate summary
    return templateSummarizer.summarizeSession(states, entries, options);
  }

  // Generate a prompt for the LLM
  private generateSummaryPrompt(
    states: EmotionState[],
    entries: TimeCapsuleEntry[],
    options?: SummaryOptions
  ): string {
    // Format emotion states
    const formattedStates = states.map(state => {
      return `- Emotion: ${state.mood}, Confidence: ${Math.round(state.confidence * 100)}%, Time: ${new Date(state.timestamp).toLocaleString()}, Context: ${state.context || 'unknown'}`;
    }).join('\n');

    // Format time capsule entries
    const formattedEntries = entries.map(entry => {
      return `- Type: ${entry.type}, Emotion: ${entry.emotionTag}, Time: ${new Date(entry.timestamp).toLocaleString()}, Context: ${entry.context || 'unknown'}, Notes: ${entry.notes || 'none'}`;
    }).join('\n');

    // Build prompt
    let prompt = `Generate an emotion summary based on the following data:\n\n`;
    prompt += `Emotion States:\n${formattedStates || 'None'}\n\n`;
    prompt += `Time Capsule Entries:\n${formattedEntries || 'None'}\n\n`;

    // Add audience type
    if (options?.audienceType) {
      prompt += `Target audience: ${options.audienceType}\n`;
    }

    // Add focus areas
    if (options?.focusAreas && options.focusAreas.length > 0) {
      prompt += `Focus areas: ${options.focusAreas.join(', ')}\n`;
    }

    // Add instructions
    prompt += `\nPlease provide:\n`;
    prompt += `1. A concise summary of the emotional state\n`;
    prompt += `2. An emotional journey narrative\n`;
    prompt += `3. Suggested focus areas for therapy or emotional growth\n`;
    prompt += `\nKeep the summary under ${options?.maxLength || 500} characters.`;

    return prompt;
  }

  // Parse LLM response into SessionSummary
  private parseSummaryResponse(
    response: LLMResponse,
    states: EmotionState[],
    entries: TimeCapsuleEntry[]
  ): SessionSummary {
    // Extract sections from response
    const text = response.text.trim();
    const sections = text.split('\n\n');

    // Extract summary (first section)
    const summary = sections[0] || 'No summary available.';

    // Extract emotional journey (second section)
    const emotionalJourney = sections[1] || 'No emotional journey available.';

    // Extract suggested focus (third section)
    const suggestedFocus = sections[2] || 'No suggested focus available.';

    // Determine dominant emotions
    const emotionCounts: Record<string, number> = {};
    states.forEach(state => {
      emotionCounts[state.mood] = (emotionCounts[state.mood] || 0) + 1;
    });

    const dominantEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emotion]) => emotion as EmotionCategory);

    // Create SessionSummary
    return {
      summary,
      timestamp: Date.now(),
      dominantEmotions,
      emotionalJourney,
      suggestedFocus,
      confidence: 0.8 // Placeholder confidence
    };
  }

  // Send a request to an LLM
  private async sendRequest(request: LLMRequest): Promise<LLMResponse> {
    // Add to queue and process
    return new Promise((resolve, reject) => {
      this.requestQueue.push(request);

      // Add callbacks to the queue item
      const index = this.requestQueue.length - 1;
      (this.requestQueue[index] as any).resolve = resolve;
      (this.requestQueue[index] as any).reject = reject;

      // Start processing queue if not already
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  // Process the request queue
  private async processQueue(): Promise<void> {
    if (this.requestQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minTimeBetweenRequests = 60000 / this.requestsPerMinute;

    if (timeSinceLastRequest < minTimeBetweenRequests) {
      await new Promise(resolve => setTimeout(resolve, minTimeBetweenRequests - timeSinceLastRequest));
    }

    // Get next request
    const request = this.requestQueue.shift();
    const resolve = (request as any).resolve;
    const reject = (request as any).reject;

    if (!request) {
      this.processQueue();
      return;
    }

    try {
      // Get provider
      const provider = this.providers.get(request.provider);

      if (!provider) {
        throw new Error(`Provider "${request.provider}" not registered`);
      }

      // If template provider, generate mock response
      if (provider.name === 'template') {
        const response = this.generateMockResponse(request);
        this.notifyResponse(response);
        resolve(response);
      } else {
        // Send actual request to LLM API
        const response = await this.sendLLMRequest(request, provider);
        this.notifyResponse(response);
        resolve(response);
      }
    } catch (error) {
      console.error('Error sending LLM request:', error);
      this.notifyError(error as Error, request);
      reject(error);
    } finally {
      this.lastRequestTime = Date.now();

      // Process next request
      setTimeout(() => {
        this.processQueue();
      }, 100);
    }
  }

  // Send a request to an actual LLM API
  private async sendLLMRequest(request: LLMRequest, provider: LLMProvider): Promise<LLMResponse> {
    // For now, just return a mock response
    // In a real implementation, this would make an API call to the LLM provider
    return this.generateMockResponse(request);
  }

  // Generate a mock LLM response
  private generateMockResponse(request: LLMRequest): LLMResponse {
    // Generate a simple response based on the prompt
    const prompt = request.prompt.toLowerCase();

    let text = '';

    if (prompt.includes('emotion summary')) {
      text = 'The emotional state shows a mix of happiness and occasional anxiety. Overall, the mood has been positive with some fluctuations.\n\n';
      text += 'The emotional journey began with anxiety, followed by periods of calm and focus, and eventually shifted to happiness and excitement.\n\n';
      text += 'Suggested focus areas include continuing to build on positive emotional states and developing strategies for managing anxiety when it arises.';
    } else {
      text = 'I\'m not sure how to respond to this prompt. Please provide more specific instructions.';
    }

    return {
      text,
      usage: {
        promptTokens: request.prompt.length / 4,
        completionTokens: text.length / 4,
        totalTokens: (request.prompt.length + text.length) / 4
      },
      provider: request.provider,
      timestamp: Date.now()
    };
  }

  // Generate a cache key for a prompt
  private generateCacheKey(prompt: string): string {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `llm_${hash}`;
  }

  // Get a cached response
  private getCachedResponse(cacheKey: string): LLMResponse | null {
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiryTime) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.response;
  }

  // Cache a response
  private cacheResponse(cacheKey: string, response: LLMResponse): void {
    // Create cache entry
    const entry: CacheEntry = {
      response,
      expiryTime: Date.now() + this.cacheExpiryMs
    };

    // Add to cache
    this.cache.set(cacheKey, entry);

    // Trim cache if needed
    if (this.cache.size > this.cacheSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }
  }

  // Register callbacks
  public onResponse(callback: LLMResponseCallback): void {
    this.responseCallbacks.push(callback);
  }

  public onError(callback: LLMErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  // Remove callbacks
  public removeResponseCallback(callback: LLMResponseCallback): void {
    this.responseCallbacks = this.responseCallbacks.filter(cb => cb !== callback);
  }

  public removeErrorCallback(callback: LLMErrorCallback): void {
    this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
  }

  // Notify callbacks
  private notifyResponse(response: LLMResponse): void {
    this.responseCallbacks.forEach(callback => callback(response));
  }

  private notifyError(error: Error, request: LLMRequest): void {
    this.errorCallbacks.forEach(callback => callback(error, request));
  }
}

export default LLMService;
