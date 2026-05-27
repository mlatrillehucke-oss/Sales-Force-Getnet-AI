import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { v4 as uuid } from 'uuid';
import Database from './database.js';
import AIService from './services/aiService.js';
import CommerceService from './services/commerceService.js';
import MessageService from './services/messageService.js';
import AgentService from './services/agentService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Initialize database
const db = new Database();
await db.init();

const aiService = new AIService();
const commerceService = new CommerceService(db);
const messageService = new MessageService(db);
const agentService = new AgentService(db, aiService);

// ==================== AI ROUTES ====================

// Invoke LLM
app.post('/api/ai/invoke', async (req, res) => {
  try {
    const { prompt, model, temperature, response_json_schema, add_context_from_internet } = req.body;
    const result = await aiService.invokeLLM({
      prompt,
      model: model || process.env.AI_MODEL || 'gpt-4o',
      temperature: temperature || 0.7,
      response_json_schema,
      add_context_from_internet,
    });
    res.json(result);
  } catch (error) {
    console.error('Error invoking LLM:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search commerces with AI
app.post('/api/ai/search-commerces', async (req, res) => {
  try {
    const { query, region } = req.body;
    const result = await aiService.searchCommerces(query, region);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze route with AI
app.post('/api/ai/analyze-route', async (req, res) => {
  try {
    const { commerces, city, country } = req.body;
    const result = await aiService.analyzeRoute(commerces, city, country);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate sales strategy
app.post('/api/ai/strategy', async (req, res) => {
  try {
    const { stats } = req.body;
    const result = await aiService.generateStrategy(stats);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enrich commerce data
app.post('/api/ai/enrich-commerce', async (req, res) => {
  try {
    const { commerce } = req.body;
    const result = await aiService.enrichCommerce(commerce);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== COMMERCE ROUTES ====================

// List commerces
app.get('/api/commerces', async (req, res) => {
  try {
    const { sort, limit } = req.query;
    const commerces = await commerceService.list(sort, parseInt(limit) || 500);
    res.json(commerces);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single commerce
app.get('/api/commerces/:id', async (req, res) => {
  try {
    const commerce = await commerceService.get(req.params.id);
    if (!commerce) return res.status(404).json({ error: 'Commerce not found' });
    res.json(commerce);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create commerce
app.post('/api/commerces', async (req, res) => {
  try {
    const commerce = await commerceService.create({
      ...req.body,
      id: req.body.id || uuid(),
      created_date: new Date().toISOString(),
    });
    res.status(201).json(commerce);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update commerce
app.put('/api/commerces/:id', async (req, res) => {
  try {
    const commerce = await commerceService.update(req.params.id, req.body);
    if (!commerce) return res.status(404).json({ error: 'Commerce not found' });
    res.json(commerce);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete commerce
app.delete('/api/commerces/:id', async (req, res) => {
  try {
    await commerceService.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search commerces
app.get('/api/commerces/search', async (req, res) => {
  try {
    const commerces = await commerceService.search(req.query);
    res.json(commerces);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MESSAGE ROUTES ====================

// List messages by channel
app.get('/api/messages', async (req, res) => {
  try {
    const { channel, limit } = req.query;
    const messages = await messageService.listByChannel(channel, parseInt(limit) || 100);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create message
app.post('/api/messages', async (req, res) => {
  try {
    const message = await messageService.create({
      ...req.body,
      id: uuid(),
      created_date: new Date().toISOString(),
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete message
app.delete('/api/messages/:id', async (req, res) => {
  try {
    await messageService.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== AGENT ROUTES ====================

// List conversations
app.get('/api/agents/conversations', async (req, res) => {
  try {
    const conversations = await agentService.listConversations(req.query);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get conversation
app.get('/api/agents/conversations/:conversationId', async (req, res) => {
  try {
    const conversation = await agentService.getConversation(req.params.conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create conversation
app.post('/api/agents/conversations', async (req, res) => {
  try {
    const conversation = await agentService.createConversation(req.body);
    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add message to conversation
app.post('/api/agents/conversations/:conversationId/messages', async (req, res) => {
  try {
    const result = await agentService.addMessage(req.params.conversationId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete conversation
app.delete('/api/agents/conversations/:conversationId', async (req, res) => {
  try {
    await agentService.deleteConversation(req.params.conversationId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute agent
app.post('/api/agents/execute', async (req, res) => {
  try {
    const { agent_name, prompt, context } = req.body;
    const result = await agentService.executeAgent(agent_name, prompt, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 AI Model: ${process.env.AI_MODEL || 'gpt-4o'}`);
});
