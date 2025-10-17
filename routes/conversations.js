/**
 * 💬 Conversations Routes
 * Real-time messaging, conversation management
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const conversationController = require('../controllers/conversationController');

// ============================================
// 💬 Conversation Management
// ============================================

// Get all conversations with filters
router.get('/', auth, conversationController.getConversations);

// Get conversation by ID
router.get('/:id', auth, conversationController.getConversation);

// Create new conversation
router.post('/', auth, conversationController.createConversation);

// Update conversation
router.put('/:id', auth, conversationController.updateConversation);

// Close conversation
router.put('/:id/close', auth, conversationController.closeConversation);

// Reopen conversation
router.put('/:id/reopen', auth, conversationController.reopenConversation);

// Transfer conversation to another agent
router.put('/:id/transfer', auth, conversationController.transferConversation);

// ============================================
// 📝 Messages
// ============================================

// Get messages in conversation
router.get('/:id/messages', auth, conversationController.getMessages);

// Send message
router.post('/:id/messages', auth, conversationController.sendMessage);

// Edit message
router.put('/:id/messages/:messageId', auth, conversationController.editMessage);

// Delete message
router.delete('/:id/messages/:messageId', auth, conversationController.deleteMessage);

// Mark messages as read
router.put('/:id/messages/mark-read', auth, conversationController.markMessagesAsRead);

// Get message by ID
router.get('/:id/messages/:messageId', auth, conversationController.getMessage);

// ============================================
// 📎 File Attachments
// ============================================

// Upload file to conversation
router.post('/:id/upload', auth, conversationController.uploadFile);

// Get file attachments
router.get('/:id/files', auth, conversationController.getFiles);

// Delete file attachment
router.delete('/:id/files/:fileId', auth, conversationController.deleteFile);

// ============================================
// 🏷️ Conversation Metadata
// ============================================

// Add tags to conversation
router.post('/:id/tags', auth, conversationController.addTags);

// Remove tags from conversation
router.delete('/:id/tags', auth, conversationController.removeTags);

// Update conversation priority
router.put('/:id/priority', auth, conversationController.updatePriority);

// Set conversation category
router.put('/:id/category', auth, conversationController.setCategory);

// Add internal notes
router.post('/:id/notes', auth, conversationController.addInternalNote);

// ============================================
// ⭐ Satisfaction & Feedback
// ============================================

// Submit satisfaction rating
router.post('/:id/satisfaction', conversationController.submitSatisfaction);

// Get satisfaction feedback
router.get('/:id/satisfaction', auth, conversationController.getSatisfaction);

// Update satisfaction rating
router.put('/:id/satisfaction', auth, conversationController.updateSatisfaction);

// ============================================
// 🤖 Bot Integration
// ============================================

// Send bot message
router.post('/:id/bot-message', auth, conversationController.sendBotMessage);

// Trigger bot intent
router.post('/:id/bot-intent', auth, conversationController.triggerBotIntent);

// Get bot suggestions
router.get('/:id/bot-suggestions', auth, conversationController.getBotSuggestions);

// Train bot from conversation
router.post('/:id/train-bot', auth, conversationController.trainBotFromConversation);

// ============================================
// 📊 Conversation Analytics
// ============================================

// Get conversation statistics
router.get('/:id/stats', auth, conversationController.getConversationStats);

// Get response time metrics
router.get('/:id/response-times', auth, conversationController.getResponseTimes);

// Get conversation timeline
router.get('/:id/timeline', auth, conversationController.getTimeline);

// ============================================
// 🔄 Real-time Updates
// ============================================

// Join conversation for real-time updates
router.post('/:id/join', auth, conversationController.joinConversation);

// Leave conversation
router.post('/:id/leave', auth, conversationController.leaveConversation);

// Send typing indicator
router.post('/:id/typing', auth, conversationController.sendTyping);

// ============================================
// 📤 Export & Share
// ============================================

// Export conversation transcript
router.get('/:id/export', auth, conversationController.exportTranscript);

// Share conversation link
router.post('/:id/share', auth, conversationController.shareConversation);

// Print conversation
router.get('/:id/print', auth, conversationController.printConversation);

// ============================================
// 🔍 Search & Filters
// ============================================

// Search messages in conversation
router.get('/:id/search/:query', auth, conversationController.searchMessages);

// Filter conversations by status
router.get('/status/:status', auth, conversationController.getConversationsByStatus);

// Filter conversations by channel
router.get('/channel/:channel', auth, conversationController.getConversationsByChannel);

// Filter conversations by agent
router.get('/agent/:agentId', auth, conversationController.getConversationsByAgent);

// Get unassigned conversations
router.get('/unassigned', auth, conversationController.getUnassignedConversations);

module.exports = router;
