-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    target_url TEXT NOT NULL UNIQUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    metadata JSONB
);

CREATE TABLE competitor_battle_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,

    competitor_url TEXT NOT NULL,

    strategy_summary JSONB NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_company
        FOREIGN KEY(company_id)
        REFERENCES company_profiles(id)
        ON DELETE CASCADE
);

CREATE TABLE api_cache_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    request_signature TEXT NOT NULL UNIQUE,

    response_payload JSONB NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE request_locks (
    request_signature TEXT PRIMARY KEY,
    locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
