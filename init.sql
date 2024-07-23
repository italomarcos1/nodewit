CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
  	email VARCHAR(255) UNIQUE NOT NULL,
  	password_hash VARCHAR(255) NOT NULL,
  	job VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT false NOT NULL,
  	profile_picture VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE boards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cards UUID[],
  	created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deadline TIMESTAMP,
    top_priority BOOLEAN DEFAULT false NOT NULL,
  	picture VARCHAR(255),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  	board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
    members UUID[],
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url TEXT,
    extension TEXT,
    size TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  	card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE user_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    notification_id UUID NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_notification_id ON user_notifications(notification_id);

CREATE TABLE comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  	card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE flows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nodes TEXT NOT NULL,
    edges TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

INSERT INTO users (id, name, email, job, is_admin, password_hash, created_at) VALUES
('442b77ae-e258-4aad-b2aa-55dd4404da0f', 'Italo', 'italomarcos0010@gmail.com', 'Fullstack Dev', true, '$2a$06$Pxrmj8bOKkn9ivhyvIC8OO1Sd3rLcUiBTB9pSG6LQVbYCh.2b.Rgu', '2024-06-29T21:07:53.539Z'),
('194d2f9b-e662-4850-8f74-9ace2f76ba66', 'Luva de Pedreiro', 'luva@pedreiro.com', 'receba', false, '$2a$06$Rilf2RAKcOKH2Tlpyc9A4unjAYwUWycs.zGGu7MqzPu.l/gcUQoE6', '2024-06-29T21:07:53.539Z'),
('801e193f-e01b-4a8c-be53-d2dcd40e4f0c', 'Sam Winchester', 'sam@winchester.com', 'Hunter & Moose', false, '$2a$06$Pxrmj8bOKkn9ivhyvIC8OO1Sd3rLcUiBTB9pSG6LQVbYCh.2b.Rgu', '2024-06-29T21:07:53.539Z');

INSERT INTO boards (id, title, owner_id, cards, created_at) VALUES
('8c0a1cd3-dd36-414e-b7bd-c0cc8709f69d', 'Main', '442b77ae-e258-4aad-b2aa-55dd4404da0f', NULL, '2024-06-29T21:08:12.026Z'),
('54f27366-1030-4bc5-af9d-22fa25d2876b', 'Second', '442b77ae-e258-4aad-b2aa-55dd4404da0f', NULL, '2024-06-30T18:55:35.291Z');

INSERT INTO cards (id, title, description, owner_id, board_id, members, created_at) VALUES
('3b26c6e6-20ea-40d9-80a5-0a5aa47b7788', 'First Task', 'black ocean cold and dark, i am a hungry shark, fast and merciless.', '442b77ae-e258-4aad-b2aa-55dd4404da0f', '8c0a1cd3-dd36-414e-b7bd-c0cc8709f69d', NULL, '2024-06-29T21:09:03.732Z'),
('b8ca7ac4-4ed3-48c6-8006-a757227edfa7', 'Second Task', 'but the only girl that could talk to him', '442b77ae-e258-4aad-b2aa-55dd4404da0f', '8c0a1cd3-dd36-414e-b7bd-c0cc8709f69d', NULL, '2024-06-29T21:09:24.513Z'),
('dfc94540-9272-4585-900a-6b86f49ef269', 'Third Task', 'just couldn''t swim tell me what''s worse than this', '442b77ae-e258-4aad-b2aa-55dd4404da0f', '8c0a1cd3-dd36-414e-b7bd-c0cc8709f69d', NULL, '2024-06-29T21:09:43.635Z'),
('d6bcb139-df4a-4a9f-bdec-6e1e6d3fb5ef', 'Fourth Task', 'and it echoes in the halls they danced along the walls', '442b77ae-e258-4aad-b2aa-55dd4404da0f', '8c0a1cd3-dd36-414e-b7bd-c0cc8709f69d', NULL, '2024-06-29T21:10:21.607Z'),
('a8985111-d273-45e6-84ff-e96992ef203c', 'Fifthask', 'tomorrow', '442b77ae-e258-4aad-b2aa-55dd4404da0f', '8c0a1cd3-dd36-414e-b7bd-c0cc8709f69d', NULL, '2024-06-30T03:51:04.451Z'),
('83b6fd99-a99a-4242-b100-f3059538a9e0', 'i am th estorm', '', '442b77ae-e258-4aad-b2aa-55dd4404da0f', '54f27366-1030-4bc5-af9d-22fa25d2876b', NULL, '2024-06-30T19:02:34.033Z'),
('7254c760-b0e2-496f-9eb3-44322995ccaf', 'black clouds and isolation', '', '442b77ae-e258-4aad-b2aa-55dd4404da0f', '54f27366-1030-4bc5-af9d-22fa25d2876b', NULL, '2024-06-30T19:06:13.698Z');

INSERT INTO notifications (id, content) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Sua tarefa foi concluída com sucesso.'),
('550e8400-e29b-41d4-a716-446655440001', 'Você tem uma nova mensagem.'),
('550e8400-e29b-41d4-a716-446655440002', 'Seu relatório mensal está pronto.'),
('550e8400-e29b-41d4-a716-446655440003', 'Atualização do sistema agendada para amanhã.'),
('550e8400-e29b-41d4-a716-446655440004', 'Novo comentário no seu post.');

INSERT INTO user_notifications (user_id, notification_id) VALUES 
('442b77ae-e258-4aad-b2aa-55dd4404da0f', '550e8400-e29b-41d4-a716-446655440000'),
('442b77ae-e258-4aad-b2aa-55dd4404da0f', '550e8400-e29b-41d4-a716-446655440001'),
('442b77ae-e258-4aad-b2aa-55dd4404da0f', '550e8400-e29b-41d4-a716-446655440002'),
('442b77ae-e258-4aad-b2aa-55dd4404da0f', '550e8400-e29b-41d4-a716-446655440003'),
('442b77ae-e258-4aad-b2aa-55dd4404da0f', '550e8400-e29b-41d4-a716-446655440004');

INSERT INTO comments (content, user_id, card_id) VALUES
('vai dar nao vou levar minha vó no crossfit', '442b77ae-e258-4aad-b2aa-55dd4404da0f', '3b26c6e6-20ea-40d9-80a5-0a5aa47b7788');
