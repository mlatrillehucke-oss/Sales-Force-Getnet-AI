import { v4 as uuid } from 'uuid';

export default class AgentService {
  constructor(db, aiService) {
    this.db = db;
    this.aiService = aiService;
  }

  async listConversations(filters = {}) {
    let sql = 'SELECT * FROM conversations WHERE 1=1';
    const params = [];

    if (filters.agent_name) {
      sql += ' AND agent_name = ?';
      params.push(filters.agent_name);
    }

    sql += ' ORDER BY updated_date DESC LIMIT 50';

    const conversations = await this.db.all(sql, params);
    
    // Get message count for each conversation
    for (const conv of conversations) {
      const msgCount = await this.db.get(
        'SELECT COUNT(*) as count FROM conversation_messages WHERE conversation_id = ?',
        [conv.id]
      );
      conv.message_count = msgCount?.count || 0;
    }

    return conversations;
  }

  async getConversation(conversationId) {
    const conversation = await this.db.get(
      'SELECT * FROM conversations WHERE id = ?',
      [conversationId]
    );

    if (!conversation) return null;

    const messages = await this.db.all(
      'SELECT id, role, content, created_date FROM conversation_messages WHERE conversation_id = ? ORDER BY created_date ASC',
      [conversationId]
    );

    conversation.messages = messages;
    conversation.metadata = conversation.metadata ? JSON.parse(conversation.metadata) : {};

    return conversation;
  }

  async createConversation(data) {
    const conversation = {
      id: uuid(),
      agent_name: data.agent_name || 'sales_agent',
      metadata: JSON.stringify(data.metadata || {}),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };

    await this.db.run(
      'INSERT INTO conversations (id, agent_name, metadata, created_date, updated_date) VALUES (?, ?, ?, ?, ?)',
      Object.values(conversation)
    );

    return { ...conversation, messages: [], metadata: data.metadata || {} };
  }

  async addMessage(conversationId, messageData) {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    // Add user message
    const userMessage = {
      id: uuid(),
      conversation_id: conversationId,
      role: 'user',
      content: messageData.content || messageData.message,
      created_date: new Date().toISOString(),
    };

    await this.db.run(
      'INSERT INTO conversation_messages (id, conversation_id, role, content, created_date) VALUES (?, ?, ?, ?, ?)',
      Object.values(userMessage)
    );

    // Generate AI response
    const messages = [...conversation.messages, userMessage];
    const chatHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n');

    const aiResponse = await this.aiService.invokeLLM({
      prompt: `You are a helpful sales agent assistant for GETNET payment terminals.

Conversation history:
${chatHistory}

User: ${messageData.content || messageData.message}

Provide a helpful, concise response in Spanish.`,
      temperature: 0.7,
    });

    const assistantMessage = {
      id: uuid(),
      conversation_id: conversationId,
      role: 'assistant',
      content: typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse),
      created_date: new Date().toISOString(),
    };

    await this.db.run(
      'INSERT INTO conversation_messages (id, conversation_id, role, content, created_date) VALUES (?, ?, ?, ?, ?)',
      Object.values(assistantMessage)
    );

    // Update conversation timestamp
    await this.db.run(
      'UPDATE conversations SET updated_date = ? WHERE id = ?',
      [new Date().toISOString(), conversationId]
    );

    return { user: userMessage, assistant: assistantMessage };
  }

  async deleteConversation(conversationId) {
    await this.db.run('DELETE FROM conversation_messages WHERE conversation_id = ?', [conversationId]);
    await this.db.run('DELETE FROM conversations WHERE id = ?', [conversationId]);
  }

  async executeAgent(agentName, prompt, context = {}) {
    const contextStr = Object.entries(context)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');

    const fullPrompt = `You are a ${agentName} agent for GETNET sales team.

Context:
${contextStr}

Task: ${prompt}

Respond in Spanish with practical, actionable advice.`;

    return await this.aiService.invokeLLM({
      prompt: fullPrompt,
      temperature: 0.7,
    });
  }
}
