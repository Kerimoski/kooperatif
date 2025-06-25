--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 15.13 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS koop_db;
--
-- Name: koop_db; Type: DATABASE; Schema: -; Owner: kerimoski
--

CREATE DATABASE koop_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'C';


ALTER DATABASE koop_db OWNER TO kerimoski;

\connect koop_db

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: update_commission_member_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_commission_member_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Yeni üye ekleme
    IF TG_OP = 'INSERT' THEN
        UPDATE commissions 
        SET current_members = current_members + 1 
        WHERE id = NEW.commission_id;
        RETURN NEW;
    END IF;
    
    -- Üye çıkarma
    IF TG_OP = 'DELETE' THEN
        UPDATE commissions 
        SET current_members = current_members - 1 
        WHERE id = OLD.commission_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_commission_member_count() OWNER TO postgres;

--
-- Name: update_membership_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_membership_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_membership_updated_at() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calendar_events (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    event_type character varying(50) NOT NULL,
    start_date date NOT NULL,
    end_date date,
    start_time time without time zone,
    end_time time without time zone,
    is_all_day boolean DEFAULT false,
    location character varying(255),
    color character varying(20) DEFAULT 'blue'::character varying,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT calendar_events_event_type_check CHECK (((event_type)::text = ANY ((ARRAY['duyuru'::character varying, 'etkinlik'::character varying, 'toplanti'::character varying, 'egitim'::character varying, 'diger'::character varying])::text[])))
);


ALTER TABLE public.calendar_events OWNER TO postgres;

--
-- Name: COLUMN calendar_events.color; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.calendar_events.color IS 'Event color for UI customization (blue, emerald, purple, orange, red, pink, indigo, teal)';


--
-- Name: calendar_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.calendar_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.calendar_events_id_seq OWNER TO postgres;

--
-- Name: calendar_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.calendar_events_id_seq OWNED BY public.calendar_events.id;


--
-- Name: commission_links; Type: TABLE; Schema: public; Owner: kerimoski
--

CREATE TABLE public.commission_links (
    id integer NOT NULL,
    commission_id integer NOT NULL,
    title character varying(255) NOT NULL,
    url text NOT NULL,
    description text,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.commission_links OWNER TO kerimoski;

--
-- Name: commission_links_id_seq; Type: SEQUENCE; Schema: public; Owner: kerimoski
--

CREATE SEQUENCE public.commission_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.commission_links_id_seq OWNER TO kerimoski;

--
-- Name: commission_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kerimoski
--

ALTER SEQUENCE public.commission_links_id_seq OWNED BY public.commission_links.id;


--
-- Name: commission_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commission_members (
    id integer NOT NULL,
    commission_id integer,
    user_id integer,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'active'::character varying,
    role character varying(50) DEFAULT 'member'::character varying
);


ALTER TABLE public.commission_members OWNER TO postgres;

--
-- Name: commission_members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.commission_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.commission_members_id_seq OWNER TO postgres;

--
-- Name: commission_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.commission_members_id_seq OWNED BY public.commission_members.id;


--
-- Name: commissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commissions (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    max_members integer DEFAULT 10,
    current_members integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.commissions OWNER TO postgres;

--
-- Name: commissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.commissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.commissions_id_seq OWNER TO postgres;

--
-- Name: commissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.commissions_id_seq OWNED BY public.commissions.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    category character varying(100) NOT NULL,
    file_size integer NOT NULL,
    uploaded_by integer,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.documents_id_seq OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: fee_reminders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fee_reminders (
    id integer NOT NULL,
    membership_fee_id integer,
    reminder_type character varying(20) DEFAULT 'email'::character varying,
    sent_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'sent'::character varying,
    CONSTRAINT fee_reminders_status_check CHECK (((status)::text = ANY ((ARRAY['sent'::character varying, 'failed'::character varying, 'opened'::character varying])::text[])))
);


ALTER TABLE public.fee_reminders OWNER TO postgres;

--
-- Name: fee_reminders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fee_reminders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.fee_reminders_id_seq OWNER TO postgres;

--
-- Name: fee_reminders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fee_reminders_id_seq OWNED BY public.fee_reminders.id;


--
-- Name: mail_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mail_logs (
    id integer NOT NULL,
    sender_id integer,
    recipient_email character varying(255) NOT NULL,
    subject character varying(500) NOT NULL,
    message text NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    sent_at timestamp without time zone,
    error_message text,
    mail_type character varying(50) DEFAULT 'announcement'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT mail_logs_mail_type_check CHECK (((mail_type)::text = ANY ((ARRAY['announcement'::character varying, 'fee_reminder'::character varying, 'notification'::character varying])::text[]))),
    CONSTRAINT mail_logs_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'sent'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.mail_logs OWNER TO postgres;

--
-- Name: mail_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mail_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.mail_logs_id_seq OWNER TO postgres;

--
-- Name: mail_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mail_logs_id_seq OWNED BY public.mail_logs.id;


--
-- Name: membership_fees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.membership_fees (
    id integer NOT NULL,
    user_id integer,
    plan_id integer,
    amount numeric(10,2) NOT NULL,
    due_date date NOT NULL,
    paid_date timestamp without time zone,
    status character varying(20) DEFAULT 'pending'::character varying,
    late_fee numeric(10,2) DEFAULT 0,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT membership_fees_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'overdue'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.membership_fees OWNER TO postgres;

--
-- Name: membership_fees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.membership_fees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.membership_fees_id_seq OWNER TO postgres;

--
-- Name: membership_fees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.membership_fees_id_seq OWNED BY public.membership_fees.id;


--
-- Name: membership_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.membership_plans (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    amount numeric(10,2) NOT NULL,
    period_months integer NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.membership_plans OWNER TO postgres;

--
-- Name: membership_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.membership_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.membership_plans_id_seq OWNER TO postgres;

--
-- Name: membership_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.membership_plans_id_seq OWNED BY public.membership_plans.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    membership_fee_id integer,
    amount numeric(10,2) NOT NULL,
    payment_method character varying(50) DEFAULT 'bank_transfer'::character varying,
    transaction_id character varying(100),
    payment_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    processed_by integer,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.payments_id_seq OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    role character varying(20) DEFAULT 'member'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    phone_number character varying(20),
    profession character varying(100),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'member'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: calendar_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events ALTER COLUMN id SET DEFAULT nextval('public.calendar_events_id_seq'::regclass);


--
-- Name: commission_links id; Type: DEFAULT; Schema: public; Owner: kerimoski
--

ALTER TABLE ONLY public.commission_links ALTER COLUMN id SET DEFAULT nextval('public.commission_links_id_seq'::regclass);


--
-- Name: commission_members id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commission_members ALTER COLUMN id SET DEFAULT nextval('public.commission_members_id_seq'::regclass);


--
-- Name: commissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commissions ALTER COLUMN id SET DEFAULT nextval('public.commissions_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: fee_reminders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_reminders ALTER COLUMN id SET DEFAULT nextval('public.fee_reminders_id_seq'::regclass);


--
-- Name: mail_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mail_logs ALTER COLUMN id SET DEFAULT nextval('public.mail_logs_id_seq'::regclass);


--
-- Name: membership_fees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_fees ALTER COLUMN id SET DEFAULT nextval('public.membership_fees_id_seq'::regclass);


--
-- Name: membership_plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_plans ALTER COLUMN id SET DEFAULT nextval('public.membership_plans_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: calendar_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.calendar_events (id, title, description, event_type, start_date, end_date, start_time, end_time, is_all_day, location, color, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: commission_links; Type: TABLE DATA; Schema: public; Owner: kerimoski
--

COPY public.commission_links (id, commission_id, title, url, description, created_by, created_at, updated_at) FROM stdin;
1	1	deneme	https://youtube.com	\N	2	2025-06-16 12:15:01.423729	2025-06-16 12:15:01.423729
2	2	deneme	https://youtube.com	dajsdnad	2	2025-06-16 12:42:40.45036	2025-06-16 12:42:40.45036
3	1	Google Drive	https://drive.google.com	Komisyon dökümanları	1	2025-06-16 12:44:42.288372	2025-06-16 12:44:42.288372
\.


--
-- Data for Name: commission_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.commission_members (id, commission_id, user_id, joined_at, status, role) FROM stdin;
\.


--
-- Data for Name: commissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.commissions (id, name, description, max_members, current_members, is_active, created_by, created_at, updated_at) FROM stdin;
1	Eğitim Komisyonu	Kooperatif üyelerinin eğitim faaliyetlerini planlayan ve yürüten komisyon	15	0	t	1	2025-06-11 15:45:13.136147	2025-06-16 18:06:25.627203
2	Adelet	lkjndkjas	15	0	t	2	2025-06-13 14:38:29.692126	2025-06-16 18:06:25.627203
3	Eğitim Komisyonu	Kooperatif üyelerinin eğitim faaliyetlerini planlayan ve yürüten komisyon	15	0	t	1	2025-06-24 14:48:10.594025	2025-06-24 14:48:10.594025
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, title, file_name, file_path, category, file_size, uploaded_by, uploaded_at) FROM stdin;
\.


--
-- Data for Name: fee_reminders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fee_reminders (id, membership_fee_id, reminder_type, sent_date, status) FROM stdin;
\.


--
-- Data for Name: mail_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mail_logs (id, sender_id, recipient_email, subject, message, status, sent_at, error_message, mail_type, created_at) FROM stdin;
1	2	erdurunabdulkerim@gmail.com	deneme	deneme	failed	\N	Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials ffacd0b85a97d-3a6e8051f58sm1857864f8f.12 - gsmtp	announcement	2025-06-24 15:09:48.049459
2	2	erdurunabdulkerim@gmail.com	deneme	deneme	sent	2025-06-24 15:23:19.883788	\N	announcement	2025-06-24 15:23:19.883788
3	2	erdurunabdulkerim@gmail.com	deneme	dneme3	sent	2025-06-25 10:19:37.676281	\N	announcement	2025-06-25 10:19:37.676281
\.


--
-- Data for Name: membership_fees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.membership_fees (id, user_id, plan_id, amount, due_date, paid_date, status, late_fee, notes, created_at, updated_at) FROM stdin;
5	1	9	100.00	2025-01-01	2025-06-16 14:47:11.262869	paid	0.00	6 Aylık Plan - 1. Taksit (6 taksit) - 6 aylık test	2025-06-16 14:46:51.1151	2025-06-16 14:47:11.262869
6	1	9	100.00	2025-02-01	2025-06-16 14:47:11.262869	paid	0.00	6 Aylık Plan - 2. Taksit (6 taksit) - 6 aylık test	2025-06-16 14:46:51.1151	2025-06-16 14:47:11.262869
7	1	9	100.00	2025-03-01	2025-06-16 14:47:11.262869	paid	0.00	6 Aylık Plan - 3. Taksit (6 taksit) - 6 aylık test	2025-06-16 14:46:51.1151	2025-06-16 14:47:11.262869
8	1	9	100.00	2025-04-01	2025-06-16 14:47:11.262869	paid	0.00	6 Aylık Plan - 4. Taksit (6 taksit) - 6 aylık test	2025-06-16 14:46:51.1151	2025-06-16 14:47:11.262869
9	1	9	100.00	2025-05-01	2025-06-16 14:47:11.262869	paid	0.00	6 Aylık Plan - 5. Taksit (6 taksit) - 6 aylık test	2025-06-16 14:46:51.1151	2025-06-16 14:47:11.262869
10	1	9	100.00	2025-06-01	2025-06-16 14:47:11.262869	paid	0.00	6 Aylık Plan - 6. Taksit (6 taksit) - 6 aylık test	2025-06-16 14:46:51.1151	2025-06-16 14:47:11.262869
19	2	9	100.00	2025-01-01	\N	pending	0.00	6 Aylık Plan - 2. Taksit (6 taksit)	2025-06-16 15:00:26.804953	2025-06-16 15:00:26.804953
20	2	9	100.00	2025-02-01	\N	pending	0.00	6 Aylık Plan - 3. Taksit (6 taksit)	2025-06-16 15:00:26.804953	2025-06-16 15:00:26.804953
21	2	9	100.00	2025-03-01	\N	pending	0.00	6 Aylık Plan - 4. Taksit (6 taksit)	2025-06-16 15:00:26.804953	2025-06-16 15:00:26.804953
22	2	9	100.00	2025-04-01	\N	pending	0.00	6 Aylık Plan - 5. Taksit (6 taksit)	2025-06-16 15:00:26.804953	2025-06-16 15:00:26.804953
18	2	9	100.00	2024-12-01	2025-06-16 15:00:56.140339	paid	0.00	6 Aylık Plan - 1. Taksit (6 taksit)	2025-06-16 15:00:26.804953	2025-06-16 15:00:56.140339
\.


--
-- Data for Name: membership_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.membership_plans (id, name, amount, period_months, description, is_active, created_by, created_at, updated_at) FROM stdin;
6	Koop Aidatı	200.00	1		t	2	2025-06-16 13:47:55.756109	2025-06-16 13:47:55.756109
7	Deneme	200.00	6		t	2	2025-06-16 13:52:30.935012	2025-06-16 13:52:30.935012
8	Test Planı	100.00	1	Test için oluşturulmuş plan	t	1	2025-06-16 13:57:33.065968	2025-06-16 13:57:33.065968
9	6 Aylık Plan	600.00	6	Test için 6 aylık plan	t	1	2025-06-16 14:46:40.537646	2025-06-16 14:46:40.537646
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, membership_fee_id, amount, payment_method, transaction_id, payment_date, processed_by, notes, created_at) FROM stdin;
2	5	100.00	bank_transfer	TEST123	2025-06-16 14:47:11.262869	1	6 taksit toplu ödeme	2025-06-16 14:47:11.262869
3	6	100.00	bank_transfer	TEST123	2025-06-16 14:47:11.262869	1	6 taksit toplu ödeme	2025-06-16 14:47:11.262869
4	7	100.00	bank_transfer	TEST123	2025-06-16 14:47:11.262869	1	6 taksit toplu ödeme	2025-06-16 14:47:11.262869
5	8	100.00	bank_transfer	TEST123	2025-06-16 14:47:11.262869	1	6 taksit toplu ödeme	2025-06-16 14:47:11.262869
6	9	100.00	bank_transfer	TEST123	2025-06-16 14:47:11.262869	1	6 taksit toplu ödeme	2025-06-16 14:47:11.262869
7	10	100.00	bank_transfer	TEST123	2025-06-16 14:47:11.262869	1	6 taksit toplu ödeme	2025-06-16 14:47:11.262869
9	18	100.00	bank_transfer	TEST123	2025-06-16 15:00:56.140339	1	\N	2025-06-16 15:00:56.140339
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, first_name, last_name, role, is_active, created_at, updated_at, phone_number, profession) FROM stdin;
2	erdurunabdulkerim@gmail.com	$2b$12$c41IPb/2QMPoPA3l4NRxF.jsWs6m.98s5aWNTH4.LPpeFXDWx9Ome	Abdulkerim	Erduru	admin	t	2025-06-11 15:45:49.50142	2025-06-11 15:46:55.645741	\N	\N
1	admin@koop.org	$2a$12$vqvdQW57fU1G9mTzi04QcuAiSV3sE1nKdtHMzjOdjRLqz5IrcYCJq	Admin	Kullanıcısı	admin	t	2025-06-11 15:45:13.13571	2025-06-16 13:40:49.457718	\N	\N
\.


--
-- Name: calendar_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.calendar_events_id_seq', 6, true);


--
-- Name: commission_links_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kerimoski
--

SELECT pg_catalog.setval('public.commission_links_id_seq', 3, true);


--
-- Name: commission_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.commission_members_id_seq', 3, true);


--
-- Name: commissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.commissions_id_seq', 3, true);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 1, true);


--
-- Name: fee_reminders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fee_reminders_id_seq', 1, false);


--
-- Name: mail_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mail_logs_id_seq', 3, true);


--
-- Name: membership_fees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.membership_fees_id_seq', 29, true);


--
-- Name: membership_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.membership_plans_id_seq', 9, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 9, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- Name: commission_links commission_links_pkey; Type: CONSTRAINT; Schema: public; Owner: kerimoski
--

ALTER TABLE ONLY public.commission_links
    ADD CONSTRAINT commission_links_pkey PRIMARY KEY (id);


--
-- Name: commission_members commission_members_commission_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commission_members
    ADD CONSTRAINT commission_members_commission_id_user_id_key UNIQUE (commission_id, user_id);


--
-- Name: commission_members commission_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commission_members
    ADD CONSTRAINT commission_members_pkey PRIMARY KEY (id);


--
-- Name: commissions commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: fee_reminders fee_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_reminders
    ADD CONSTRAINT fee_reminders_pkey PRIMARY KEY (id);


--
-- Name: mail_logs mail_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mail_logs
    ADD CONSTRAINT mail_logs_pkey PRIMARY KEY (id);


--
-- Name: membership_fees membership_fees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_fees
    ADD CONSTRAINT membership_fees_pkey PRIMARY KEY (id);


--
-- Name: membership_plans membership_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_plans
    ADD CONSTRAINT membership_plans_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_calendar_events_color; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendar_events_color ON public.calendar_events USING btree (color);


--
-- Name: idx_calendar_events_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendar_events_created_by ON public.calendar_events USING btree (created_by);


--
-- Name: idx_calendar_events_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendar_events_date ON public.calendar_events USING btree (start_date);


--
-- Name: idx_calendar_events_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendar_events_type ON public.calendar_events USING btree (event_type);


--
-- Name: idx_commission_links_commission_id; Type: INDEX; Schema: public; Owner: kerimoski
--

CREATE INDEX idx_commission_links_commission_id ON public.commission_links USING btree (commission_id);


--
-- Name: idx_commission_links_created_by; Type: INDEX; Schema: public; Owner: kerimoski
--

CREATE INDEX idx_commission_links_created_by ON public.commission_links USING btree (created_by);


--
-- Name: idx_commission_members_commission; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commission_members_commission ON public.commission_members USING btree (commission_id);


--
-- Name: idx_commission_members_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commission_members_user ON public.commission_members USING btree (user_id);


--
-- Name: idx_commissions_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commissions_active ON public.commissions USING btree (is_active);


--
-- Name: idx_fee_reminders_fee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fee_reminders_fee_id ON public.fee_reminders USING btree (membership_fee_id);


--
-- Name: idx_fee_reminders_sent_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fee_reminders_sent_date ON public.fee_reminders USING btree (sent_date);


--
-- Name: idx_fee_reminders_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fee_reminders_type ON public.fee_reminders USING btree (reminder_type);


--
-- Name: idx_mail_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mail_logs_created_at ON public.mail_logs USING btree (created_at);


--
-- Name: idx_mail_logs_recipient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mail_logs_recipient ON public.mail_logs USING btree (recipient_email);


--
-- Name: idx_mail_logs_sent_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mail_logs_sent_at ON public.mail_logs USING btree (sent_at);


--
-- Name: idx_mail_logs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mail_logs_status ON public.mail_logs USING btree (status);


--
-- Name: idx_mail_logs_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mail_logs_type ON public.mail_logs USING btree (mail_type);


--
-- Name: idx_membership_fees_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_membership_fees_due_date ON public.membership_fees USING btree (due_date);


--
-- Name: idx_membership_fees_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_membership_fees_status ON public.membership_fees USING btree (status);


--
-- Name: idx_membership_fees_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_membership_fees_user ON public.membership_fees USING btree (user_id);


--
-- Name: idx_payments_fee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_fee_id ON public.payments USING btree (membership_fee_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: commission_members commission_member_count_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER commission_member_count_trigger AFTER INSERT OR DELETE ON public.commission_members FOR EACH ROW EXECUTE FUNCTION public.update_commission_member_count();


--
-- Name: calendar_events update_calendar_events_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: commissions update_commissions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON public.commissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: membership_fees update_membership_fees_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_membership_fees_updated_at BEFORE UPDATE ON public.membership_fees FOR EACH ROW EXECUTE FUNCTION public.update_membership_updated_at();


--
-- Name: membership_plans update_membership_plans_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_membership_plans_updated_at BEFORE UPDATE ON public.membership_plans FOR EACH ROW EXECUTE FUNCTION public.update_membership_updated_at();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: calendar_events calendar_events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: commission_links commission_links_commission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kerimoski
--

ALTER TABLE ONLY public.commission_links
    ADD CONSTRAINT commission_links_commission_id_fkey FOREIGN KEY (commission_id) REFERENCES public.commissions(id) ON DELETE CASCADE;


--
-- Name: commission_links commission_links_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kerimoski
--

ALTER TABLE ONLY public.commission_links
    ADD CONSTRAINT commission_links_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: commission_members commission_members_commission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commission_members
    ADD CONSTRAINT commission_members_commission_id_fkey FOREIGN KEY (commission_id) REFERENCES public.commissions(id) ON DELETE CASCADE;


--
-- Name: commission_members commission_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commission_members
    ADD CONSTRAINT commission_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: commissions commissions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: documents documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: fee_reminders fee_reminders_membership_fee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_reminders
    ADD CONSTRAINT fee_reminders_membership_fee_id_fkey FOREIGN KEY (membership_fee_id) REFERENCES public.membership_fees(id) ON DELETE CASCADE;


--
-- Name: mail_logs mail_logs_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mail_logs
    ADD CONSTRAINT mail_logs_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: membership_fees membership_fees_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_fees
    ADD CONSTRAINT membership_fees_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.membership_plans(id);


--
-- Name: membership_fees membership_fees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_fees
    ADD CONSTRAINT membership_fees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: membership_plans membership_plans_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_plans
    ADD CONSTRAINT membership_plans_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: payments payments_membership_fee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_membership_fee_id_fkey FOREIGN KEY (membership_fee_id) REFERENCES public.membership_fees(id) ON DELETE CASCADE;


--
-- Name: payments payments_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

