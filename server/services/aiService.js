import axios from 'axios';
import { v4 as uuid } from 'uuid';

export default class AIService {
  constructor() {
    this.openaiKey = process.env.OPENAI_API_KEY;
    this.anthropicKey = process.env.ANTHROPIC_API_KEY;
    this.googleKey = process.env.GOOGLE_API_KEY;
    this.model = process.env.AI_MODEL || 'gpt-4o';
  }

  async invokeLLM(options) {
    const { prompt, model = this.model, temperature = 0.7, response_json_schema, add_context_from_internet } = options;
    
    try {
      // Route to appropriate AI provider
      if (model.includes('gpt') || model.includes('openai')) {
        return await this.callOpenAI(prompt, model, temperature, response_json_schema);
      } else if (model.includes('claude') || model.includes('anthropic')) {
        return await this.callAnthropic(prompt, model, temperature, response_json_schema);
      } else if (model.includes('gemini') || model.includes('google')) {
        return await this.callGoogle(prompt, model, temperature, response_json_schema);
      } else {
        // Default fallback to OpenAI
        return await this.callOpenAI(prompt, model, temperature, response_json_schema);
      }
    } catch (error) {
      console.error('AI Service Error:', error.message);
      throw error;
    }
  }

  async callOpenAI(prompt, model, temperature, responseSchema) {
    if (!this.openaiKey) throw new Error('OPENAI_API_KEY not configured');

    const payload = {
      model: model || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: 2000,
    };

    if (responseSchema) {
      payload.response_format = {
        type: 'json_schema',
        json_schema: {
          name: 'response',
          schema: responseSchema,
          strict: true,
        },
      };
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      payload,
      { headers: { Authorization: `Bearer ${this.openaiKey}` } }
    );

    const content = response.data.choices[0].message.content;
    try {
      return responseSchema ? JSON.parse(content) : content;
    } catch {
      return content;
    }
  }

  async callAnthropic(prompt, model, temperature, responseSchema) {
    if (!this.anthropicKey) throw new Error('ANTHROPIC_API_KEY not configured');

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: model || 'claude-3-opus-20250219',
        max_tokens: 2000,
        temperature,
        messages: [{ role: 'user', content: prompt }],
      },
      { headers: { 'x-api-key': this.anthropicKey, 'anthropic-version': '2023-06-01' } }
    );

    const content = response.data.content[0].text;
    try {
      return responseSchema ? JSON.parse(content) : content;
    } catch {
      return content;
    }
  }

  async callGoogle(prompt, model, temperature, responseSchema) {
    if (!this.googleKey) throw new Error('GOOGLE_API_KEY not configured');

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.googleKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens: 2000 },
      }
    );

    const content = response.data.candidates[0].content.parts[0].text;
    try {
      return responseSchema ? JSON.parse(content) : content;
    } catch {
      return content;
    }
  }

  async searchCommerces(query, region) {
    const prompt = `Based on the search query "${query}" for region "${region}", suggest 5-10 relevant commerce categories or business types that would be good prospects for payment terminals. Format as JSON array with objects containing: name, type, description, potential_revenue_category.`;
    
    return await this.invokeLLM({
      prompt,
      temperature: 0.7,
      response_json_schema: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string' },
                description: { type: 'string' },
                potential_revenue_category: { type: 'string' },
              },
            },
          },
        },
      },
    });
  }

  async analyzeRoute(commerces, city, country) {
    const commerceData = commerces.map(c => ({
      name: c.name,
      type: c.type,
      status: c.status,
      address: c.address,
      lat: c.latitude,
      lng: c.longitude,
    }));

    const prompt = `You are an expert commercial route planner for payment terminal (GETNET) sales.

City: ${city}, ${country}
Registered Commerces: ${JSON.stringify(commerceData)}

Generate an optimized visit route plan. Include:
1. Visit order with time estimates
2. Suggested key commercial zones in ${city}
3. Sales tips for each commerce type
4. New prospect recommendations

Respond in Spanish with markdown formatting.`;

    return await this.invokeLLM({ prompt, temperature: 0.7 });
  }

  async generateStrategy(stats) {
    const prompt = `You are a sales director expert in payment services (GETNET). Analyze these team sales data and provide:

1. Complete pipeline analysis
2. Key statistics with percentages
3. 5 concrete conversion improvement strategies
4. Recommended weekly action plan
5. Commerce types with highest conversion probability
6. Specific recommendations for Spain and Chile

Data: ${JSON.stringify(stats)}

Respond in Spanish with markdown formatting, well organized with titles and bullets.`;

    return await this.invokeLLM({ prompt, temperature: 0.7 });
  }

  async enrichCommerce(commerce) {
    const prompt = `Based on this commerce data, enrich it with AI insights:

Commerce: ${JSON.stringify(commerce)}

Provide analysis in JSON format with:
- estimated_revenue_potential (low/medium/high)
- recommended_approach (customized sales strategy)
- key_selling_points (array of relevant benefits for this type)
- risk_factors (array of potential objections)
- best_contact_times (optimal visiting hours)
- industry_benchmarks (industry-specific insights)

Respond only with valid JSON.`;

    return await this.invokeLLM({
      prompt,
      temperature: 0.7,
      response_json_schema: {
        type: 'object',
        properties: {
          estimated_revenue_potential: { type: 'string' },
          recommended_approach: { type: 'string' },
          key_selling_points: { type: 'array', items: { type: 'string' } },
          risk_factors: { type: 'array', items: { type: 'string' } },
          best_contact_times: { type: 'string' },
          industry_benchmarks: { type: 'string' },
        },
      },
    });
  }
}
