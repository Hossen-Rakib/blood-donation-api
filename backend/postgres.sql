-- Blood Donation Platform PostgreSQL Database Script

-- 1. Table: users
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  username      VARCHAR(100) NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  phone         VARCHAR(30)  NOT NULL,
  hash_password VARCHAR(255) NOT NULL,
  role          VARCHAR(30)  NOT NULL DEFAULT 'requester',
  location      VARCHAR(150) NOT NULL DEFAULT 'Dhaka',
  profile_image VARCHAR(500)          DEFAULT NULL,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 2. Table: donors
CREATE TABLE IF NOT EXISTS donors (
  id                 SERIAL PRIMARY KEY,
  user_id            INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name               VARCHAR(150) NOT NULL,
  email              VARCHAR(255)          DEFAULT NULL,
  blood_group        VARCHAR(10)  NOT NULL,
  phone              VARCHAR(30)  NOT NULL,
  location           VARCHAR(150) NOT NULL,
  age                INTEGER               DEFAULT NULL,
  gender             VARCHAR(10)           DEFAULT 'Male',
  availability       BOOLEAN      NOT NULL DEFAULT TRUE,
  verified           BOOLEAN      NOT NULL DEFAULT TRUE,
  last_donation_date TIMESTAMP             DEFAULT NULL,
  created_at         TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donors_bg ON donors(blood_group);
CREATE INDEX IF NOT EXISTS idx_donors_loc ON donors(location);
CREATE INDEX IF NOT EXISTS idx_donors_avail ON donors(availability);

-- 3. Table: blood_requests
CREATE TABLE IF NOT EXISTS blood_requests (
  id                SERIAL PRIMARY KEY,
  requester_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_name      VARCHAR(150) NOT NULL,
  blood_group       VARCHAR(10)  NOT NULL,
  required_bags     INTEGER      NOT NULL DEFAULT 1,
  hospital_name     VARCHAR(255) NOT NULL,
  hospital_location VARCHAR(255) NOT NULL,
  required_date     VARCHAR(50)  NOT NULL,
  contact_number    VARCHAR(30)  NOT NULL,
  urgency           VARCHAR(30)  NOT NULL DEFAULT 'normal',
  additional_info   TEXT                  DEFAULT NULL,
  status            VARCHAR(30)  NOT NULL DEFAULT 'pending',
  accepted_donor_id INTEGER REFERENCES donors(id) ON DELETE SET NULL,
  created_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_br_bg ON blood_requests(blood_group);
CREATE INDEX IF NOT EXISTS idx_br_urgency ON blood_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_br_status ON blood_requests(status);

-- 4. Table: donation_history
CREATE TABLE IF NOT EXISTS donation_history (
  id                SERIAL PRIMARY KEY,
  donor_id          INTEGER      NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  request_id        INTEGER REFERENCES blood_requests(id) ON DELETE SET NULL,
  donated_date      TIMESTAMP    NOT NULL DEFAULT NOW(),
  blood_group       VARCHAR(10)  NOT NULL,
  bags              INTEGER      NOT NULL DEFAULT 1,
  hospital_location VARCHAR(255) NOT NULL,
  note              TEXT                  DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_dh_donor ON donation_history(donor_id);

-- 5. Table: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50) NOT NULL,
  message    TEXT        NOT NULL,
  request_id INTEGER              DEFAULT NULL,
  is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);

-- 6. Table: reports
CREATE TABLE IF NOT EXISTS reports (
  id               SERIAL PRIMARY KEY,
  reporter_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  request_id       INTEGER REFERENCES blood_requests(id) ON DELETE SET NULL,
  reason           VARCHAR(100) NOT NULL,
  description      TEXT                  DEFAULT NULL,
  status           VARCHAR(30)  NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Seed Data: Admin and Requesters
INSERT INTO users (id, name, username, email, phone, hash_password, role, location) VALUES
(1, 'System Administrator', 'admin', 'admin@blooddonation.com', '01700000000', '$2b$12$KkQ1Mpv178p4O8aR7aO09eL28Uu2cK4jT18P/VbWk6rE8lK4T18Pa', 'admin', 'Dhaka Central'),
(2, 'Rahim Uddin',          'user1', 'user1@blooddonation.com', '01811111111', '$2b$12$KkQ1Mpv178p4O8aR7aO09eL28Uu2cK4jT18P/VbWk6rE8lK4T18Pa', 'requester', 'Mirpur'),
(3, 'Karim Hossain',        'user2', 'user2@blooddonation.com', '01822222222', '$2b$12$KkQ1Mpv178p4O8aR7aO09eL28Uu2cK4jT18P/VbWk6rE8lK4T18Pa', 'requester', 'Dhanmondi'),
(4, 'Sumaiya Akter',        'user3', 'user3@blooddonation.com', '01833333333', '$2b$12$KkQ1Mpv178p4O8aR7aO09eL28Uu2cK4jT18P/VbWk6rE8lK4T18Pa', 'requester', 'Gulshan')
ON CONFLICT (username) DO NOTHING;

-- Seed Data: 40 Donors across Dhaka areas
INSERT INTO donors (id, name, blood_group, phone, location, age, gender, availability, verified, last_donation_date) VALUES
(1,  'Donor 1 (A+)',  'A+',  '01710101001', 'Mirpur',      26, 'Male',   TRUE, TRUE, NOW() - INTERVAL '90 days'),
(2,  'Donor 2 (A+)',  'A+',  '01710102001', 'Dhanmondi',   24, 'Female', TRUE, TRUE, NOW() - INTERVAL '120 days'),
(3,  'Donor 3 (A+)',  'A+',  '01710103001', 'Gulshan',     30, 'Male',   TRUE, TRUE, NOW() - INTERVAL '60 days'),
(4,  'Donor 4 (A+)',  'A+',  '01710104001', 'Uttara',      28, 'Female', TRUE, TRUE, NOW() - INTERVAL '150 days'),
(5,  'Donor 5 (A+)',  'A+',  '01710105001', 'Mohammadpur', 32, 'Male',   TRUE, TRUE, NOW() - INTERVAL '45 days'),
(6,  'Donor 1 (A-)',  'A-',  '01710201001', 'Mirpur',      29, 'Male',   TRUE, TRUE, NOW() - INTERVAL '110 days'),
(7,  'Donor 2 (A-)',  'A-',  '01710202001', 'Dhanmondi',   27, 'Female', TRUE, TRUE, NOW() - INTERVAL '75 days'),
(8,  'Donor 3 (A-)',  'A-',  '01710203001', 'Gulshan',     33, 'Male',   TRUE, TRUE, NOW() - INTERVAL '180 days'),
(9,  'Donor 4 (A-)',  'A-',  '01710204001', 'Uttara',      25, 'Female', TRUE, TRUE, NOW() - INTERVAL '95 days'),
(10, 'Donor 5 (A-)',  'A-',  '01710205001', 'Mohammadpur', 31, 'Male',   TRUE, TRUE, NOW() - INTERVAL '50 days'),
(11, 'Donor 1 (B+)',  'B+',  '01710301001', 'Mirpur',      25, 'Male',   TRUE, TRUE, NOW() - INTERVAL '80 days'),
(12, 'Donor 2 (B+)',  'B+',  '01710302001', 'Dhanmondi',   23, 'Female', TRUE, TRUE, NOW() - INTERVAL '140 days'),
(13, 'Donor 3 (B+)',  'B+',  '01710303001', 'Gulshan',     35, 'Male',   TRUE, TRUE, NOW() - INTERVAL '65 days'),
(14, 'Donor 4 (B+)',  'B+',  '01710304001', 'Uttara',      27, 'Female', TRUE, TRUE, NOW() - INTERVAL '160 days'),
(15, 'Donor 5 (B+)',  'B+',  '01710305001', 'Mohammadpur', 29, 'Male',   TRUE, TRUE, NOW() - INTERVAL '40 days'),
(16, 'Donor 1 (B-)',  'B-',  '01710401001', 'Mirpur',      34, 'Male',   TRUE, TRUE, NOW() - INTERVAL '100 days'),
(17, 'Donor 2 (B-)',  'B-',  '01710402001', 'Dhanmondi',   26, 'Female', TRUE, TRUE, NOW() - INTERVAL '85 days'),
(18, 'Donor 3 (B-)',  'B-',  '01710403001', 'Gulshan',     31, 'Male',   TRUE, TRUE, NOW() - INTERVAL '190 days'),
(19, 'Donor 4 (B-)',  'B-',  '01710404001', 'Uttara',      24, 'Female', TRUE, TRUE, NOW() - INTERVAL '70 days'),
(20, 'Donor 5 (B-)',  'B-',  '01710405001', 'Mohammadpur', 36, 'Male',   TRUE, TRUE, NOW() - INTERVAL '55 days'),
(21, 'Donor 1 (AB+)', 'AB+', '01710501001', 'Mirpur',      28, 'Male',   TRUE, TRUE, NOW() - INTERVAL '90 days'),
(22, 'Donor 2 (AB+)', 'AB+', '01710502001', 'Dhanmondi',   25, 'Female', TRUE, TRUE, NOW() - INTERVAL '130 days'),
(23, 'Donor 3 (AB+)', 'AB+', '01710503001', 'Gulshan',     32, 'Male',   TRUE, TRUE, NOW() - INTERVAL '60 days'),
(24, 'Donor 4 (AB+)', 'AB+', '01710504001', 'Uttara',      29, 'Female', TRUE, TRUE, NOW() - INTERVAL '170 days'),
(25, 'Donor 5 (AB+)', 'AB+', '01710505001', 'Mohammadpur', 27, 'Male',   TRUE, TRUE, NOW() - INTERVAL '45 days'),
(26, 'Donor 1 (AB-)', 'AB-', '01710601001', 'Mirpur',      30, 'Male',   TRUE, TRUE, NOW() - INTERVAL '115 days'),
(27, 'Donor 2 (AB-)', 'AB-', '01710602001', 'Dhanmondi',   28, 'Female', TRUE, TRUE, NOW() - INTERVAL '80 days'),
(28, 'Donor 3 (AB-)', 'AB-', '01710603001', 'Gulshan',     34, 'Male',   TRUE, TRUE, NOW() - INTERVAL '200 days'),
(29, 'Donor 4 (AB-)', 'AB-', '01710604001', 'Uttara',      26, 'Female', TRUE, TRUE, NOW() - INTERVAL '105 days'),
(30, 'Donor 5 (AB-)', 'AB-', '01710605001', 'Mohammadpur', 33, 'Male',   TRUE, TRUE, NOW() - INTERVAL '50 days'),
(31, 'Donor 1 (O+)',  'O+',  '01710701001', 'Mirpur',      27, 'Male',   TRUE, TRUE, NOW() - INTERVAL '85 days'),
(32, 'Donor 2 (O+)',  'O+',  '01710702001', 'Dhanmondi',   24, 'Female', TRUE, TRUE, NOW() - INTERVAL '145 days'),
(33, 'Donor 3 (O+)',  'O+',  '01710703001', 'Gulshan',     29, 'Male',   TRUE, TRUE, NOW() - INTERVAL '60 days'),
(34, 'Donor 4 (O+)',  'O+',  '01710704001', 'Uttara',      31, 'Female', TRUE, TRUE, NOW() - INTERVAL '175 days'),
(35, 'Donor 5 (O+)',  'O+',  '01710705001', 'Mohammadpur', 26, 'Male',   TRUE, TRUE, NOW() - INTERVAL '35 days'),
(36, 'Donor 1 (O-)',  'O-',  '01710801001', 'Mirpur',      35, 'Male',   TRUE, TRUE, NOW() - INTERVAL '120 days'),
(37, 'Donor 2 (O-)',  'O-',  '01710802001', 'Dhanmondi',   27, 'Female', TRUE, TRUE, NOW() - INTERVAL '90 days'),
(38, 'Donor 3 (O-)',  'O-',  '01710803001', 'Gulshan',     32, 'Male',   TRUE, TRUE, NOW() - INTERVAL '210 days'),
(39, 'Donor 4 (O-)',  'O-',  '01710804001', 'Uttara',      25, 'Female', TRUE, TRUE, NOW() - INTERVAL '100 days'),
(40, 'Donor 5 (O-)',  'O-',  '01710805001', 'Mohammadpur', 30, 'Male',   TRUE, TRUE, NOW() - INTERVAL '45 days')
ON CONFLICT (id) DO NOTHING;

SELECT setval('donors_id_seq', (SELECT MAX(id) FROM donors));

-- Seed Data: Donation History
INSERT INTO donation_history (donor_id, donated_date, blood_group, bags, hospital_location, note) VALUES
(1, NOW() - INTERVAL '360 days', 'A+', 1, 'Dhaka Medical College Hospital', 'Voluntary regular donation'),
(1, NOW() - INTERVAL '200 days', 'A+', 1, 'Square Hospital, Panthapath',     'Replacement blood donation'),
(1, NOW() - INTERVAL '90 days',  'A+', 2, 'National Heart Foundation, Mirpur', 'Emergency bypass surgery patient'),
(2, NOW() - INTERVAL '280 days', 'A+', 1, 'BSMMU (PG Hospital)',             'Voluntary donation'),
(2, NOW() - INTERVAL '120 days', 'A+', 1, 'Popular Medical Centre, Dhanmondi','Replacement donation'),
(3, NOW() - INTERVAL '400 days', 'A+', 1, 'United Hospital, Gulshan',        'Voluntary blood camp'),
(3, NOW() - INTERVAL '210 days', 'A+', 2, 'Kurmitola General Hospital',      'Emergency trauma support'),
(3, NOW() - INTERVAL '60 days',  'A+', 1, 'Evercare Hospital, Bashundhara',  'Thalassemia patient support'),
(11, NOW() - INTERVAL '300 days', 'B+', 1, 'National Heart Foundation, Mirpur', 'Cardiac surgery support'),
(11, NOW() - INTERVAL '180 days', 'B+', 1, 'Dhaka Medical College Hospital',   'Voluntary drive'),
(11, NOW() - INTERVAL '80 days',  'B+', 2, 'Square Hospital, Panthapath',      'Accident emergency replacement'),
(12, NOW() - INTERVAL '250 days', 'B+', 1, 'Popular Diagnostic, Dhanmondi',    'Voluntary donation'),
(12, NOW() - INTERVAL '140 days', 'B+', 1, 'Anwer Khan Modern Hospital',       'Maternity ward emergency'),
(31, NOW() - INTERVAL '320 days', 'O+', 1, 'Dhaka Medical College Hospital',   'Voluntary blood donation'),
(31, NOW() - INTERVAL '190 days', 'O+', 2, 'Enam Medical College Hospital',    'Emergency surgery support'),
(31, NOW() - INTERVAL '85 days',  'O+', 1, 'National Heart Foundation, Mirpur', 'Open heart patient'),
(32, NOW() - INTERVAL '270 days', 'O+', 1, 'Square Hospital, Panthapath',     'Voluntary camp'),
(32, NOW() - INTERVAL '145 days', 'O+', 1, 'BSMMU, Shahbag',                  'Platelet donation');

-- Seed Data: Sample Blood Requests
INSERT INTO blood_requests (id, requester_id, patient_name, blood_group, required_bags, hospital_name, hospital_location, required_date, contact_number, urgency, additional_info, status, accepted_donor_id) VALUES
(1, 2, 'Abdur Rashid', 'B+', 2, 'National Heart Foundation Hospital', 'Mirpur', 'Immediately', '01811111111', 'emergency', 'Emergency open heart surgery required today.', 'pending', NULL),
(2, 3, 'Nasima Begum', 'O+', 1, 'Square Hospital', 'Dhanmondi', 'Tomorrow Morning', '01822222222', 'normal', 'Scheduled surgery tomorrow at 10:00 AM.', 'pending', NULL),
(3, 4, 'Tanvir Islam', 'A+', 1, 'United Hospital', 'Gulshan', '2026-09-28', '01833333333', 'normal', 'Dengue patient platelet replacement.', 'donor_accepted', 3)
ON CONFLICT (id) DO NOTHING;

SELECT setval('blood_requests_id_seq', (SELECT MAX(id) FROM blood_requests));

-- Seed Data: Sample Notifications
INSERT INTO notifications (user_id, type, message, request_id, is_read) VALUES
(2, 'request_accepted', '✅ A donor has accepted your blood request for Abdur Rashid. Donor: Donor 1 (B+), Contact: 01710301001', 1, FALSE);
