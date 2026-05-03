-- UserAccount (NFR-ST-02: RBAC, NFR-ST-08: bcrypt hash)
CREATE TABLE IF NOT EXISTS UserAccount (
  user_id       SERIAL PRIMARY KEY,
  user_email    VARCHAR(48)  UNIQUE NOT NULL,
  user_password VARCHAR(255) NOT NULL,
  rbac_role     VARCHAR(20)  NOT NULL
                CHECK (rbac_role IN ('sales', 'support', 'admin')),
  full_name     VARCHAR(100) NOT NULL
);

-- Lead (FR-ST-01, FR-UC-02)
CREATE TABLE IF NOT EXISTS Lead (
  lead_id        SERIAL PRIMARY KEY,
  email          VARCHAR(100) UNIQUE NOT NULL,
  contact_name   VARCHAR(100) NOT NULL,
  priority_score DECIMAL(5,2) DEFAULT 0.0,
  pipeline_stage VARCHAR(50)  DEFAULT 'New'
                 CHECK (pipeline_stage IN ('New', 'Contacted', 'Qualified', 'Closed')),
  user_id        INTEGER REFERENCES UserAccount(user_id),
  created_at     TIMESTAMP DEFAULT NOW()
);

-- SupportTicket (FR-ST-05, FR-ST-07)
CREATE TABLE IF NOT EXISTS SupportTicket (
  ticket_id      SERIAL PRIMARY KEY,
  description    TEXT NOT NULL,
  priority_level VARCHAR(10) NOT NULL
                 CHECK (priority_level IN ('Low', 'Medium', 'High')),
  status         VARCHAR(20) DEFAULT 'Open'
                 CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  lead_id        INTEGER REFERENCES Lead(lead_id),
  user_id        INTEGER REFERENCES UserAccount(user_id),
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

-- InteractionLog (FR-ST-04)
CREATE TABLE IF NOT EXISTS InteractionLog (
  log_id    SERIAL PRIMARY KEY,
  note_text TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  lead_id   INTEGER REFERENCES Lead(lead_id),
  user_id   INTEGER REFERENCES UserAccount(user_id)
);
