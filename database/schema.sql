-- ============================================
-- 🗄️ CRM Database Schema
-- PostgreSQL 14+ with advanced features
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For better indexing

-- ============================================
-- 👥 Users Table (Admin, Agents)
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'agent' CHECK (role IN ('admin', 'agent', 'customer')),
    avatar_url TEXT,
    phone VARCHAR(20),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_online BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    last_activity_at TIMESTAMP,
    preferences JSONB DEFAULT '{}',
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 👤 Customers Table
-- ============================================
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    line_id VARCHAR(100),
    facebook_id VARCHAR(100),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    segment VARCHAR(50) DEFAULT 'new' CHECK (segment IN ('new', 'active', 'loyal', 'inactive', 'vip')),
    source VARCHAR(50) DEFAULT 'website' CHECK (source IN ('website', 'line', 'facebook', 'shopify', 'manual')),
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    avg_order_value DECIMAL(12,2) DEFAULT 0,
    last_order_date DATE,
    last_contact_at TIMESTAMP,
    birthday DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    address JSONB,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 💬 Conversations Table
-- ============================================
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    agent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('line', 'facebook', 'web', 'email', 'shopify')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pending', 'transferred')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    subject VARCHAR(255),
    category VARCHAR(100),
    language VARCHAR(10) DEFAULT 'th',
    unread_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    satisfaction_feedback TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    response_time_avg INTEGER, -- in seconds
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 📝 Messages Table
-- ============================================
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('customer', 'agent', 'bot', 'system')),
    sender_id INTEGER,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'product', 'order', 'location', 'contact')),
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    quoted_message_id INTEGER REFERENCES messages(id),
    intent_detected VARCHAR(100),
    confidence_score DECIMAL(3,2),
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    sentiment_score DECIMAL(3,2),
    language_detected VARCHAR(10),
    is_read BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 🛍️ Products Table
-- ============================================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    shopify_product_id VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description TEXT,
    price DECIMAL(12,2) NOT NULL,
    compare_at_price DECIMAL(12,2),
    cost DECIMAL(12,2),
    sku VARCHAR(100),
    barcode VARCHAR(100),
    stock INTEGER DEFAULT 0,
    weight DECIMAL(8,3),
    dimensions JSONB, -- {length, width, height, unit}
    image_url TEXT,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    category VARCHAR(100),
    subcategory VARCHAR(100),
    brand VARCHAR(100),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    attributes JSONB DEFAULT '{}', -- color, size, etc
    seo_title VARCHAR(255),
    seo_description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    rating_average DECIMAL(2,1) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 🛒 Orders Table
-- ============================================
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    shopify_order_id VARCHAR(100) UNIQUE,
    order_number VARCHAR(50) UNIQUE,
    total_amount DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2),
    tax DECIMAL(12,2),
    shipping DECIMAL(12,2),
    discount DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'THB',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
    fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled')),
    payment_method VARCHAR(50),
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(100),
    tracking_url TEXT,
    shipping_address JSONB,
    billing_address JSONB,
    items JSONB, -- Array of order items
    customer_notes TEXT,
    internal_notes TEXT,
    refund_amount DECIMAL(12,2) DEFAULT 0,
    refund_reason TEXT,
    cancelled_reason TEXT,
    source VARCHAR(50) DEFAULT 'shopify',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 🎨 Generated Images Table (AI)
-- ============================================
CREATE TABLE generated_images (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    style VARCHAR(100),
    model VARCHAR(50) DEFAULT 'dall-e-3',
    size VARCHAR(20) DEFAULT '1024x1024',
    quality VARCHAR(20) DEFAULT 'standard',
    image_url TEXT,
    thumbnail_url TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    generation_time INTEGER, -- in seconds
    cost DECIMAL(8,4), -- API cost
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- ============================================
-- 🤖 Bot Intents & Responses
-- ============================================
CREATE TABLE bot_intents (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    intent_name VARCHAR(100) NOT NULL,
    confidence_score DECIMAL(3,2),
    parameters JSONB DEFAULT '{}',
    entities JSONB DEFAULT '[]',
    response TEXT,
    response_type VARCHAR(50) DEFAULT 'text' CHECK (response_type IN ('text', 'quick_reply', 'template', 'product_carousel')),
    training_approved BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Intent training data
CREATE TABLE bot_training_data (
    id SERIAL PRIMARY KEY,
    intent_name VARCHAR(100) NOT NULL,
    example_text TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'th',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 🔔 Notifications Table
-- ============================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    action_url TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 📊 Activity Logs
-- ============================================
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    description TEXT,
    changes JSONB, -- before/after values
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 📈 Analytics Tables
-- ============================================
CREATE TABLE daily_stats (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    new_customers INTEGER DEFAULT 0,
    total_conversations INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    bot_interactions INTEGER DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0,
    customer_satisfaction DECIMAL(3,2),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 🔍 Full-Text Search
-- ============================================
CREATE INDEX idx_customers_search ON customers USING gin(
    (setweight(to_tsvector('thai', name), 'A') ||
     setweight(to_tsvector('thai', coalesce(email, '')), 'B') ||
     setweight(to_tsvector('thai', coalesce(phone, '')), 'B'))
);

CREATE INDEX idx_products_search ON products USING gin(
    (setweight(to_tsvector('thai', name), 'A') ||
     setweight(to_tsvector('thai', coalesce(description, '')), 'B') ||
     setweight(to_tsvector('thai', coalesce(sku, '')), 'C'))
);

CREATE INDEX idx_messages_content_search ON messages USING gin(to_tsvector('thai', content));

-- ============================================
-- 📊 Performance Indexes
-- ============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_last_activity ON users(last_activity_at);

-- Customers indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_line_id ON customers(line_id);
CREATE INDEX idx_customers_facebook_id ON customers(facebook_id);
CREATE INDEX idx_customers_segment ON customers(segment);
CREATE INDEX idx_customers_source ON customers(source);
CREATE INDEX idx_customers_created_at ON customers(created_at);
CREATE INDEX idx_customers_last_contact ON customers(last_contact_at);
CREATE INDEX idx_customers_total_spent ON customers(total_spent);

-- Conversations indexes
CREATE INDEX idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_channel ON conversations(channel);
CREATE INDEX idx_conversations_priority ON conversations(priority);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at);

-- Messages indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_type ON messages(sender_type);
CREATE INDEX idx_messages_message_type ON messages(message_type);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_intent ON messages(intent_detected);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- Products indexes
CREATE INDEX idx_products_shopify_id ON products(shopify_product_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_sales_count ON products(sales_count);

-- Orders indexes
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_shopify_id ON orders(shopify_order_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_total_amount ON orders(total_amount);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_customer_id ON activity_logs(customer_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================
-- ⚡ Auto-update Triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 📊 Auto-calculate Customer Stats
-- ============================================
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update customer totals when order is inserted/updated
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE customers SET
            total_orders = (
                SELECT COUNT(*) FROM orders 
                WHERE customer_id = NEW.customer_id 
                AND status NOT IN ('cancelled', 'refunded')
            ),
            total_spent = (
                SELECT COALESCE(SUM(total_amount), 0) FROM orders 
                WHERE customer_id = NEW.customer_id 
                AND status NOT IN ('cancelled', 'refunded')
            ),
            avg_order_value = (
                SELECT COALESCE(AVG(total_amount), 0) FROM orders 
                WHERE customer_id = NEW.customer_id 
                AND status NOT IN ('cancelled', 'refunded')
            ),
            last_order_date = (
                SELECT MAX(created_at::date) FROM orders 
                WHERE customer_id = NEW.customer_id 
                AND status NOT IN ('cancelled', 'refunded')
            )
        WHERE id = NEW.customer_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customer_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

-- ============================================
-- 📊 Conversation Message Counter
-- ============================================
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE conversations SET
            message_count = message_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.conversation_id;
        
        -- Update unread count for customer messages
        IF NEW.sender_type = 'customer' THEN
            UPDATE conversations SET
                unread_count = unread_count + 1
            WHERE id = NEW.conversation_id;
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE conversations SET
            message_count = message_count - 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.conversation_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_message_count_trigger
    AFTER INSERT OR DELETE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_message_count();

-- ============================================
-- 🎯 Sample Data for Development
-- ============================================

-- Insert admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role, department) VALUES
('admin@crm.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewqCJgf4T0GF5kG.', 'ผู้ดูแลระบบ', 'admin', 'IT'),
('agent1@crm.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewqCJgf4T0GF5kG.', 'พนักงานขาย 1', 'agent', 'Sales'),
('agent2@crm.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewqCJgf4T0GF5kG.', 'พนักงานขาย 2', 'agent', 'Support');

-- Insert sample customers
INSERT INTO customers (name, email, phone, segment, source, total_spent) VALUES
('สมชาย ใจดี', 'somchai@example.com', '0812345678', 'active', 'shopify', 15000.00),
('สมหญิง รักสวย', 'somying@example.com', '0823456789', 'loyal', 'line', 25000.00),
('ประยุทธ์ มั่นคง', 'prayut@example.com', '0834567890', 'new', 'website', 0.00),
('นาริษา แสนดี', 'narisa@example.com', '0845678901', 'vip', 'facebook', 50000.00),
('วิชาย สมบูรณ์', 'vichai@example.com', '0856789012', 'inactive', 'manual', 5000.00);

-- Insert sample products
INSERT INTO products (name, description, price, stock, category, brand, is_active) VALUES
('iPhone 15 Pro Max', 'สมาร์ทโฟนรุ่นท็อป พร้อมกล้อง 48MP', 49900.00, 25, 'มือถือ', 'Apple', true),
('MacBook Air M3', 'โน้ตบุ๊คสำหรับทำงาน น้ำหนักเบา', 42900.00, 15, 'คอมพิวเตอร์', 'Apple', true),
('AirPods Pro 2', 'หูฟังไร้สาย เสียงใส', 8990.00, 50, 'อุปกรณ์เสริม', 'Apple', true),
('Samsung Galaxy S24', 'สมาร์ทโฟนแอนดรอยด์ รุ่นใหม่', 32900.00, 30, 'มือถือ', 'Samsung', true),
('iPad Air', 'แท็บเล็ตสำหรับงานสร้างสรรค์', 21900.00, 20, 'แท็บเล็ต', 'Apple', true);

-- Insert sample conversations
INSERT INTO conversations (customer_id, agent_id, channel, status, subject) VALUES
(1, 2, 'line', 'active', 'สอบถามสินค้า iPhone'),
(2, 2, 'facebook', 'closed', 'ปัญหาการจัดส่ง'),
(3, 3, 'web', 'pending', 'ต้องการคำแนะนำ MacBook'),
(4, 2, 'line', 'active', 'สั่งซื้อ AirPods Pro'),
(5, 3, 'email', 'closed', 'ขอใบกำกับภาษี');

-- Insert sample messages
INSERT INTO messages (conversation_id, sender_type, sender_id, content, intent_detected, confidence_score) VALUES
(1, 'customer', 1, 'สวัสดีครับ อยากสอบถามราคา iPhone 15 Pro Max', 'product_inquiry', 0.95),
(1, 'agent', 2, 'สวัสดีครับ iPhone 15 Pro Max ราคา 49,900 บาท มีสีให้เลือก 4 สี', null, null),
(1, 'customer', 1, 'มีของพร้อมส่งไหมครับ', 'stock_inquiry', 0.88),
(2, 'customer', 2, 'คุณคะ ของที่สั่งไปเมื่อไหร่จะได้รับ', 'delivery_inquiry', 0.92),
(2, 'agent', 2, 'ขออภัยค่ะ ตรวจสอบให้แล้วจะจัดส่งพรุ่งนี้ค่ะ', null, null);

-- Insert sample bot training data
INSERT INTO bot_training_data (intent_name, example_text, language) VALUES
('greeting', 'สวัสดี', 'th'),
('greeting', 'หวัดดี', 'th'),
('greeting', 'ดีครับ', 'th'),
('product_inquiry', 'อยากดูสินค้า', 'th'),
('product_inquiry', 'มีอะไรใหม่บ้าง', 'th'),
('product_inquiry', 'ราคาเท่าไหร่', 'th'),
('stock_inquiry', 'มีของไหม', 'th'),
('stock_inquiry', 'เหลือกี่ชิ้น', 'th'),
('delivery_inquiry', 'ส่งเมื่อไหร่', 'th'),
('delivery_inquiry', 'จัดส่งกี่วัน', 'th');

-- Update sequences
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('conversations_id_seq', (SELECT MAX(id) FROM conversations));
SELECT setval('messages_id_seq', (SELECT MAX(id) FROM messages));

-- ============================================
-- 📝 Comments & Documentation
-- ============================================
COMMENT ON TABLE users IS 'ตารางผู้ใช้งานระบบ (Admin, Agent)';
COMMENT ON TABLE customers IS 'ตารางข้อมูลลูกค้า';
COMMENT ON TABLE conversations IS 'ตารางการสนทนากับลูกค้า';
COMMENT ON TABLE messages IS 'ตารางข้อความในการสนทนา';
COMMENT ON TABLE products IS 'ตารางสินค้า';
COMMENT ON TABLE orders IS 'ตารางคำสั่งซื้อ';
COMMENT ON TABLE generated_images IS 'ตารางรูปภาพที่สร้างด้วย AI';
COMMENT ON TABLE bot_intents IS 'ตาราง Intent ที่ Chatbot ตรวจจับได้';
COMMENT ON TABLE notifications IS 'ตารางการแจ้งเตือน';
COMMENT ON TABLE activity_logs IS 'ตารางบันทึกกิจกรรม';
COMMENT ON TABLE daily_stats IS 'ตารางสถิติรายวัน';

COMMIT;

-- ============================================
-- 🎯 Success Message
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '
    ╔═══════════════════════════════════════════════════════════╗
    ║                    ✅ Database Ready!                    ║
    ║═══════════════════════════════════════════════════════════║
    ║  📊 Tables: % created successfully                       ║
    ║  🔍 Indexes: % performance indexes created               ║
    ║  ⚡ Triggers: % auto-update triggers active              ║
    ║  🎯 Sample Data: % records inserted                      ║
    ║                                                          ║
    ║  🚀 Ready for CRM Backend API!                          ║
    ╚═══════════════════════════════════════════════════════════╝
    ', 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'),
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'),
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public'),
    (SELECT COUNT(*) FROM customers) + (SELECT COUNT(*) FROM products) + (SELECT COUNT(*) FROM users);
END $$;
