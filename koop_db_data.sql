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

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users VALUES (2, 'erdurunabdulkerim@gmail.com', '$2b$12$c41IPb/2QMPoPA3l4NRxF.jsWs6m.98s5aWNTH4.LPpeFXDWx9Ome', 'Abdulkerim', 'Erduru', 'admin', true, '2025-06-11 15:45:49.50142', '2025-06-11 15:46:55.645741', NULL, NULL);
INSERT INTO public.users VALUES (1, 'admin@koop.org', '$2a$12$vqvdQW57fU1G9mTzi04QcuAiSV3sE1nKdtHMzjOdjRLqz5IrcYCJq', 'Admin', 'Kullanıcısı', 'admin', true, '2025-06-11 15:45:13.13571', '2025-06-16 13:40:49.457718', NULL, NULL);


--
-- Data for Name: calendar_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: commissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.commissions VALUES (1, 'Eğitim Komisyonu', 'Kooperatif üyelerinin eğitim faaliyetlerini planlayan ve yürüten komisyon', 15, 0, true, 1, '2025-06-11 15:45:13.136147', '2025-06-16 18:06:25.627203');
INSERT INTO public.commissions VALUES (2, 'Adelet', 'lkjndkjas', 15, 0, true, 2, '2025-06-13 14:38:29.692126', '2025-06-16 18:06:25.627203');
INSERT INTO public.commissions VALUES (3, 'Eğitim Komisyonu', 'Kooperatif üyelerinin eğitim faaliyetlerini planlayan ve yürüten komisyon', 15, 0, true, 1, '2025-06-24 14:48:10.594025', '2025-06-24 14:48:10.594025');


--
-- Data for Name: commission_links; Type: TABLE DATA; Schema: public; Owner: kerimoski
--

INSERT INTO public.commission_links VALUES (1, 1, 'deneme', 'https://youtube.com', NULL, 2, '2025-06-16 12:15:01.423729', '2025-06-16 12:15:01.423729');
INSERT INTO public.commission_links VALUES (2, 2, 'deneme', 'https://youtube.com', 'dajsdnad', 2, '2025-06-16 12:42:40.45036', '2025-06-16 12:42:40.45036');
INSERT INTO public.commission_links VALUES (3, 1, 'Google Drive', 'https://drive.google.com', 'Komisyon dökümanları', 1, '2025-06-16 12:44:42.288372', '2025-06-16 12:44:42.288372');


--
-- Data for Name: commission_members; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: membership_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.membership_plans VALUES (6, 'Koop Aidatı', 200.00, 1, '', true, 2, '2025-06-16 13:47:55.756109', '2025-06-16 13:47:55.756109');
INSERT INTO public.membership_plans VALUES (7, 'Deneme', 200.00, 6, '', true, 2, '2025-06-16 13:52:30.935012', '2025-06-16 13:52:30.935012');
INSERT INTO public.membership_plans VALUES (8, 'Test Planı', 100.00, 1, 'Test için oluşturulmuş plan', true, 1, '2025-06-16 13:57:33.065968', '2025-06-16 13:57:33.065968');
INSERT INTO public.membership_plans VALUES (9, '6 Aylık Plan', 600.00, 6, 'Test için 6 aylık plan', true, 1, '2025-06-16 14:46:40.537646', '2025-06-16 14:46:40.537646');


--
-- Data for Name: membership_fees; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.membership_fees VALUES (5, 1, 9, 100.00, '2025-01-01', '2025-06-16 14:47:11.262869', 'paid', 0.00, '6 Aylık Plan - 1. Taksit (6 taksit) - 6 aylık test', '2025-06-16 14:46:51.1151', '2025-06-16 14:47:11.262869');
INSERT INTO public.membership_fees VALUES (6, 1, 9, 100.00, '2025-02-01', '2025-06-16 14:47:11.262869', 'paid', 0.00, '6 Aylık Plan - 2. Taksit (6 taksit) - 6 aylık test', '2025-06-16 14:46:51.1151', '2025-06-16 14:47:11.262869');
INSERT INTO public.membership_fees VALUES (7, 1, 9, 100.00, '2025-03-01', '2025-06-16 14:47:11.262869', 'paid', 0.00, '6 Aylık Plan - 3. Taksit (6 taksit) - 6 aylık test', '2025-06-16 14:46:51.1151', '2025-06-16 14:47:11.262869');
INSERT INTO public.membership_fees VALUES (8, 1, 9, 100.00, '2025-04-01', '2025-06-16 14:47:11.262869', 'paid', 0.00, '6 Aylık Plan - 4. Taksit (6 taksit) - 6 aylık test', '2025-06-16 14:46:51.1151', '2025-06-16 14:47:11.262869');
INSERT INTO public.membership_fees VALUES (9, 1, 9, 100.00, '2025-05-01', '2025-06-16 14:47:11.262869', 'paid', 0.00, '6 Aylık Plan - 5. Taksit (6 taksit) - 6 aylık test', '2025-06-16 14:46:51.1151', '2025-06-16 14:47:11.262869');
INSERT INTO public.membership_fees VALUES (10, 1, 9, 100.00, '2025-06-01', '2025-06-16 14:47:11.262869', 'paid', 0.00, '6 Aylık Plan - 6. Taksit (6 taksit) - 6 aylık test', '2025-06-16 14:46:51.1151', '2025-06-16 14:47:11.262869');
INSERT INTO public.membership_fees VALUES (19, 2, 9, 100.00, '2025-01-01', NULL, 'pending', 0.00, '6 Aylık Plan - 2. Taksit (6 taksit)', '2025-06-16 15:00:26.804953', '2025-06-16 15:00:26.804953');
INSERT INTO public.membership_fees VALUES (20, 2, 9, 100.00, '2025-02-01', NULL, 'pending', 0.00, '6 Aylık Plan - 3. Taksit (6 taksit)', '2025-06-16 15:00:26.804953', '2025-06-16 15:00:26.804953');
INSERT INTO public.membership_fees VALUES (21, 2, 9, 100.00, '2025-03-01', NULL, 'pending', 0.00, '6 Aylık Plan - 4. Taksit (6 taksit)', '2025-06-16 15:00:26.804953', '2025-06-16 15:00:26.804953');
INSERT INTO public.membership_fees VALUES (22, 2, 9, 100.00, '2025-04-01', NULL, 'pending', 0.00, '6 Aylık Plan - 5. Taksit (6 taksit)', '2025-06-16 15:00:26.804953', '2025-06-16 15:00:26.804953');
INSERT INTO public.membership_fees VALUES (18, 2, 9, 100.00, '2024-12-01', '2025-06-16 15:00:56.140339', 'paid', 0.00, '6 Aylık Plan - 1. Taksit (6 taksit)', '2025-06-16 15:00:26.804953', '2025-06-16 15:00:56.140339');


--
-- Data for Name: fee_reminders; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: mail_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.mail_logs VALUES (1, 2, 'erdurunabdulkerim@gmail.com', 'deneme', 'deneme', 'failed', NULL, 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to
535 5.7.8  https://support.google.com/mail/?p=BadCredentials ffacd0b85a97d-3a6e8051f58sm1857864f8f.12 - gsmtp', 'announcement', '2025-06-24 15:09:48.049459');
INSERT INTO public.mail_logs VALUES (2, 2, 'erdurunabdulkerim@gmail.com', 'deneme', 'deneme', 'sent', '2025-06-24 15:23:19.883788', NULL, 'announcement', '2025-06-24 15:23:19.883788');
INSERT INTO public.mail_logs VALUES (3, 2, 'erdurunabdulkerim@gmail.com', 'deneme', 'dneme3', 'sent', '2025-06-25 10:19:37.676281', NULL, 'announcement', '2025-06-25 10:19:37.676281');


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.payments VALUES (2, 5, 100.00, 'bank_transfer', 'TEST123', '2025-06-16 14:47:11.262869', 1, '6 taksit toplu ödeme', '2025-06-16 14:47:11.262869');
INSERT INTO public.payments VALUES (3, 6, 100.00, 'bank_transfer', 'TEST123', '2025-06-16 14:47:11.262869', 1, '6 taksit toplu ödeme', '2025-06-16 14:47:11.262869');
INSERT INTO public.payments VALUES (4, 7, 100.00, 'bank_transfer', 'TEST123', '2025-06-16 14:47:11.262869', 1, '6 taksit toplu ödeme', '2025-06-16 14:47:11.262869');
INSERT INTO public.payments VALUES (5, 8, 100.00, 'bank_transfer', 'TEST123', '2025-06-16 14:47:11.262869', 1, '6 taksit toplu ödeme', '2025-06-16 14:47:11.262869');
INSERT INTO public.payments VALUES (6, 9, 100.00, 'bank_transfer', 'TEST123', '2025-06-16 14:47:11.262869', 1, '6 taksit toplu ödeme', '2025-06-16 14:47:11.262869');
INSERT INTO public.payments VALUES (7, 10, 100.00, 'bank_transfer', 'TEST123', '2025-06-16 14:47:11.262869', 1, '6 taksit toplu ödeme', '2025-06-16 14:47:11.262869');
INSERT INTO public.payments VALUES (9, 18, 100.00, 'bank_transfer', 'TEST123', '2025-06-16 15:00:56.140339', 1, NULL, '2025-06-16 15:00:56.140339');


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
-- PostgreSQL database dump complete
--

