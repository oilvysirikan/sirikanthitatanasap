/**
 * 👥 Customers Routes
 * CRUD operations, search, analytics
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validateCustomer, validateSearch } = require('../middleware/validation');
const customerController = require('../controllers/customerController');

// ============================================
// 📋 CRUD Operations
// ============================================

// Get all customers with filtering and pagination
router.get('/', auth, validateSearch, customerController.getCustomers);

// Get customer by ID
router.get('/:id', auth, customerController.getCustomer);

// Create new customer
router.post('/', auth, validateCustomer, customerController.createCustomer);

// Update customer
router.put('/:id', auth, validateCustomer, customerController.updateCustomer);

// Delete customer
router.delete('/:id', auth, customerController.deleteCustomer);

// ============================================
// 🔍 Search & Filters
// ============================================

// Search customers by name, email, phone
router.get('/search/:query', auth, customerController.searchCustomers);

// Get customers by segment
router.get('/segment/:segment', auth, customerController.getCustomersBySegment);

// Get customers by source
router.get('/source/:source', auth, customerController.getCustomersBySource);

// Get customers by tags
router.get('/tags/:tag', auth, customerController.getCustomersByTag);

// ============================================
// 📊 Customer Relations
// ============================================

// Get customer orders
router.get('/:id/orders', auth, customerController.getCustomerOrders);

// Get customer conversations
router.get('/:id/conversations', auth, customerController.getCustomerConversations);

// Get customer messages
router.get('/:id/messages', auth, customerController.getCustomerMessages);

// Get customer activity timeline
router.get('/:id/timeline', auth, customerController.getCustomerTimeline);

// ============================================
// 🏷️ Tags & Segments Management
// ============================================

// Add tags to customer
router.post('/:id/tags', auth, customerController.addCustomerTags);

// Remove tags from customer
router.delete('/:id/tags', auth, customerController.removeCustomerTags);

// Update customer segment
router.put('/:id/segment', auth, customerController.updateCustomerSegment);

// ============================================
// 📝 Notes & Interactions
// ============================================

// Add customer note
router.post('/:id/notes', auth, customerController.addCustomerNote);

// Get customer notes
router.get('/:id/notes', auth, customerController.getCustomerNotes);

// Update customer note
router.put('/:id/notes/:noteId', auth, customerController.updateCustomerNote);

// Delete customer note
router.delete('/:id/notes/:noteId', auth, customerController.deleteCustomerNote);

// ============================================
// 📈 Customer Analytics
// ============================================

// Get customer stats
router.get('/:id/stats', auth, customerController.getCustomerStats);

// Get customer purchase history
router.get('/:id/purchase-history', auth, customerController.getPurchaseHistory);

// Get customer behavior analytics
router.get('/:id/behavior', auth, customerController.getCustomerBehavior);

// ============================================
// 📤 Bulk Operations
// ============================================

// Bulk update customers
router.put('/bulk/update', auth, customerController.bulkUpdateCustomers);

// Bulk delete customers
router.delete('/bulk/delete', auth, customerController.bulkDeleteCustomers);

// Bulk export customers
router.post('/bulk/export', auth, customerController.exportCustomers);

// Bulk import customers
router.post('/bulk/import', auth, customerController.importCustomers);

// ============================================
// 🔄 Sync & Integration
// ============================================

// Sync customer with Shopify
router.post('/:id/sync/shopify', auth, customerController.syncWithShopify);

// Sync customer with LINE
router.post('/:id/sync/line', auth, customerController.syncWithLINE);

// Update customer from external source
router.put('/:id/external-update', auth, customerController.updateFromExternal);

module.exports = router;
