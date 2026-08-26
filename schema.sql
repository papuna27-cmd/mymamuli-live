-- ============================================================
-- MyMamuli.ge — D1 სქემა
-- გაშვება: Cloudflare → D1 → mymamuli → Console → ჩასვი და Run
-- ან: npx wrangler d1 execute mymamuli --file=schema.sql --remote
-- ============================================================

-- ───────── მომხმარებლები ─────────
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  email_norm  TEXT NOT NULL UNIQUE,
  email_ok    INTEGER NOT NULL DEFAULT 0,
  -- ეტაპი 2: ტელეფონი (ველები ახლავე, ჩართვა მოგვიანებით)
  phone       TEXT,                                -- დაფარული (••1234) — თუ სადმე საჯაროდ გამოჩნდეს
  phone_hash  TEXT UNIQUE,
  phone_full  TEXT,                                -- სრული ნომერი — მხოლოდ ადმინისთვის (users.html)
  phone_ok    INTEGER NOT NULL DEFAULT 0,
  name        TEXT,
  who         TEXT NOT NULL DEFAULT 'ind',      -- ind | co
  comp        TEXT,
  comp_id     TEXT,
  comp_ok     INTEGER NOT NULL DEFAULT 0,       -- რეესტრში დადასტურდა
  status      TEXT NOT NULL DEFAULT 'active',   -- active | warned | blocked
  lang        TEXT DEFAULT 'ka',
  -- წესებზე თანხმობა: ვინახავთ ვერსიასაც, რომ ვიცოდეთ რას დაეთანხმა
  terms_v     TEXT,
  terms_at    INTEGER,
  -- რეპუტაცია: მაძიებელი მართლა ეცნობა გამოგზავნილს თუ არა
  rep         INTEGER NOT NULL DEFAULT 0,       -- -100…100, 0 = ჯერ უცნობი
  sub         INTEGER NOT NULL DEFAULT 0,       -- არხის გამოწერა
  sub_at      INTEGER,
  -- ── კაბინეტში შესვლა ──
  -- პაროლი არასდროს ინახება ღიად. PBKDF2, 150 000 იტერაცია, ცალკე მარილი.
  pass        TEXT,
  salt        TEXT,
  last_login  INTEGER,
  blocked_at  INTEGER,
  block_why   TEXT,
  created     INTEGER NOT NULL,
  last_seen   INTEGER
);

-- ───────── ერთჯერადი კოდები ─────────
CREATE TABLE IF NOT EXISTS token (
  id      TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind    TEXT NOT NULL,                        -- verify_email | login
  hash    TEXT NOT NULL,
  ref     TEXT,                                 -- რომელ ჩანაწერს ეხება (r_… / l_…)
  ref_kind TEXT,                                -- req | lst
  expires INTEGER NOT NULL,
  tries   INTEGER NOT NULL DEFAULT 0,           -- ⚠️ ითვლება! 5 შემდეგ იბლოკება
  used    INTEGER NOT NULL DEFAULT 0,
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS i_token_user ON token (user_id, kind, created);

-- ───────── მოთხოვნები ─────────
CREATE TABLE IF NOT EXISTS req (
  id        TEXT PRIMARY KEY,
  user_id   TEXT NOT NULL,
  cat       TEXT NOT NULL,
  deal      TEXT NOT NULL,                      -- buy | rent
  period    TEXT,                               -- month | year
  lat REAL NOT NULL, lng REAL NOT NULL,
  radius    INTEGER NOT NULL,
  bn REAL, bs REAL, be REAL, bw REAL,
  area_min INTEGER, area_max INTEGER,
  price_min INTEGER, price_max INTEGER,
  attrs    TEXT,                                -- JSON
  note     TEXT,
  status   TEXT NOT NULL DEFAULT 'pending',     -- pending|active|paused|closed|expired|rejected
  reject   TEXT,
  -- ჩართულობა: რამდენი შევთავაზეთ და რამდენი გახსნა
  sent_n   INTEGER NOT NULL DEFAULT 0,          -- სულ გაგზავნილი შეთავაზება
  open_n   INTEGER NOT NULL DEFAULT 0,          -- რამდენი დააწკაპუნა
  last_open INTEGER,
  warned   INTEGER NOT NULL DEFAULT 0,          -- 0 არა · 1 ვკითხეთ · 2 შევაჩერეთ
  warn_at  INTEGER,
  created  INTEGER NOT NULL,
  expires  INTEGER NOT NULL
);

-- ───────── განცხადებები ─────────
CREATE TABLE IF NOT EXISTS lst (
  id       TEXT PRIMARY KEY,
  user_id  TEXT NOT NULL,
  cat TEXT NOT NULL, deal TEXT NOT NULL,
  period   TEXT,
  cad      TEXT,
  addr     TEXT,                                -- რეესტრიდან
  cad_ok   INTEGER NOT NULL DEFAULT 0,
  lat REAL NOT NULL, lng REAL NOT NULL,
  poly     TEXT,                                -- JSON [[lng,lat],…] — გამყიდველის დახაზული
  loc TEXT, reg TEXT,
  area INTEGER, price INTEGER,
  ttl TEXT, dsc TEXT,
  photos TEXT,
  attrs  TEXT,
  tel TEXT, contact_name TEXT,
  decl     TEXT,                                -- გამყიდველის დეკლარაცია (JSON) — მტკიცებულება
  status   TEXT NOT NULL DEFAULT 'pending',     -- pending|active|rejected|expired
  reject   TEXT,
  src_req  TEXT,
  created  INTEGER NOT NULL,
  expires  INTEGER NOT NULL
);

-- ───────── დამთხვევები ─────────
CREATE TABLE IF NOT EXISTS mt (
  req_id  TEXT NOT NULL,
  lst_id  TEXT NOT NULL,
  created INTEGER NOT NULL,
  sent    INTEGER,
  opened  INTEGER,
  PRIMARY KEY (req_id, lst_id)
);

-- ───────── წერილების რიგი ─────────
CREATE TABLE IF NOT EXISTS mailq (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  to_addr TEXT NOT NULL,
  kind    TEXT NOT NULL,
  payload TEXT,
  status  TEXT DEFAULT 'queued',
  created INTEGER NOT NULL, sent INTEGER, err TEXT
);

-- ───────── მოდერაციის ჟურნალი ─────────
CREATE TABLE IF NOT EXISTS mod_log (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  kind   TEXT, target TEXT, action TEXT, note TEXT, at INTEGER
);

-- ───────── ბოროტად გამოყენების შეზღუდვა ─────────
CREATE TABLE IF NOT EXISTS rl (
  k TEXT PRIMARY KEY, n INTEGER NOT NULL, reset INTEGER NOT NULL
);

-- ───────── საკადასტრო ქეში ─────────
-- რეესტრი ნელია და ხანდახან წვება. ნაკვეთის საზღვარი წლობით არ იცვლება,
-- ამიტომ პასუხს 30 დღით ვინახავთ. payload-ში წყაროც წერია (provenance).
CREATE TABLE IF NOT EXISTS cad (
  code    TEXT PRIMARY KEY,
  payload TEXT NOT NULL,                          -- JSON: {addr, ring, src}
  fetched INTEGER NOT NULL
);

-- ───────── ნახვები ─────────
-- /api/views ამ ორ ცხრილს იყენებს. დღე თბილისის დროითაა (UTC+4).
CREATE TABLE IF NOT EXISTS view_total (
  id         TEXT PRIMARY KEY,
  total      INTEGER NOT NULL DEFAULT 0,
  first_seen TEXT,
  last_seen  TEXT
);

CREATE TABLE IF NOT EXISTS view_day (
  id  TEXT NOT NULL,
  day TEXT NOT NULL,
  n   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, day)
);

-- ───────── მოვლენები ─────────
-- აგრეგირებული: დღე + სახელი + გასაღები + რაოდენობა.
-- პერსონალური მონაცემი განზრახ არ იწერება.
CREATE TABLE IF NOT EXISTS ev (
  day  TEXT NOT NULL,
  name TEXT NOT NULL,
  k    TEXT NOT NULL DEFAULT '',
  n    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, name, k)
);

-- ───────── რუკის სწრაფი ფორმები ─────────
-- index.html-ის რუკაზე ორი მოკლე პანელია („მოთხოვნა" და „შეთავაზება"),
-- სადაც მხოლოდ ტელეფონი იკითხება — ელფოსტა არა. ე.ი. ჩვეულებრივი
-- ვერიფიკაცია აქ ვერ მუშაობს, ამიტომ ისინი ცალკე დგას და მოდერატორთან
-- მიდის ხელით დასამუშავებლად.
-- ⚠️ ეს ორი პანელი form.html-ს ჰყოფს — გრძელვადიანად ერთი უნდა დარჩეს.
CREATE TABLE IF NOT EXISTS lead (
  id      TEXT PRIMARY KEY,
  kind    TEXT NOT NULL,                          -- req | offer
  ref     TEXT,                                   -- რომელ მოთხოვნაზეა შეთავაზება
  tel     TEXT,
  payload TEXT,                                   -- JSON: დანარჩენი ველები
  status  TEXT NOT NULL DEFAULT 'new',            -- new | done | spam
  ip_hash TEXT,
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS i_lead ON lead (status, created);

-- ───────── არხის გამომწერები ─────────
-- იმ ადამიანების სია, ვისაც უნდა ახალი განცხადებების მიღება.
-- განსაკუთრებით გამოგვადგება „ჩუმ" ლოკაციებზე: სადაც მოთხოვნა არ არის,
-- იქ განცხადება ისე დაიკარგება, თუ ვინმეს არ ვაცნობეთ. ე.ი. ეს
-- გამყიდველის დახმარებაა, არა უბრალოდ დაგზავნა.
CREATE TABLE IF NOT EXISTS subs (
  id      TEXT PRIMARY KEY,
  email   TEXT NOT NULL,
  email_norm TEXT NOT NULL UNIQUE,
  user_id TEXT,                                 -- თუ დარეგისტრირებულია
  lat REAL, lng REAL, radius INTEGER,           -- ინტერესის არეალი (არასავალდებულო)
  cats    TEXT,                                 -- JSON: ['land','house'] — ცარიელი = ყველა
  ok      INTEGER NOT NULL DEFAULT 0,           -- ელფოსტა დადასტურდა
  sent_n  INTEGER NOT NULL DEFAULT 0,
  open_n  INTEGER NOT NULL DEFAULT 0,
  status  TEXT NOT NULL DEFAULT 'active',       -- active | paused | off
  created INTEGER NOT NULL,
  last_sent INTEGER
);
CREATE INDEX IF NOT EXISTS i_subs_box ON subs (status, lat, lng);

-- ───────── ონლაინ ყოფნა ─────────
-- vid ანონიმური და ჰეშირებულია — IP არსად ინახება.
CREATE TABLE IF NOT EXISTS pres (
  vid  TEXT PRIMARY KEY,
  seen INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS i_pres_seen ON pres (seen);
CREATE INDEX IF NOT EXISTS i_view_day  ON view_day (day);

CREATE INDEX IF NOT EXISTS i_req_live  ON req (status, cat, deal);
CREATE INDEX IF NOT EXISTS i_req_box   ON req (bn, bs, be, bw);
CREATE INDEX IF NOT EXISTS i_req_user  ON req (user_id, status);
CREATE INDEX IF NOT EXISTS i_lst_live  ON lst (status, cat, deal);
CREATE INDEX IF NOT EXISTS i_lst_user  ON lst (user_id, status);
CREATE INDEX IF NOT EXISTS i_mailq     ON mailq (status, created);
