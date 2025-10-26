-- Migration: 19 users from Supabase to Azure SQL
-- Generated on 2025-10-10T17:10:59.067Z
-- Total users: 19

-- Clear existing users (CAREFUL!)
-- DELETE FROM dbo.users WHERE email NOT IN ('nithat.su@th.jec.com');

-- Insert migrated users
INSERT INTO dbo.users (
  id, email, full_name, thai_first_name, thai_last_name, position_title, 
  phone_number, employee_id, department, authority_level, user_type, 
  verification_date, profile_photo_url, is_active, created_at, updated_at,
  primary_company_id, worker_type, verification_status, external_worker_id,
  nationality, passport_number, work_permit_number
) VALUES ('3ae45b3d-3c7d-416b-8a08-3a59a4b2748b', 'nithat.su@th.jec.com', 'Nithat Su', 'นิทัศน์', 'สุขสมบูรณ์เลิศ', 'Staff', NULL, 'EMP0001', 'General', 'system_admin', 'admin', '2025-10-02T05:51:18.031+00:00', 'https://pub-d3f404bae8a34e40b8834dd3ab490187.r2.dev/profiles/3ae45b3d-3c7d-416b-8a08-3a59a4b2748b/1757936045091-b6jp9h.jpg', 1, '2025-09-10T07:08:37.179896+00:00', '2025-10-02T05:51:18.031+00:00', '550e8400-e29b-41d4-a716-446655440100', 'internal', 'verified', NULL, 'Thai', NULL, NULL);
INSERT INTO dbo.users (
  id, email, full_name, thai_first_name, thai_last_name, position_title, 
  phone_number, employee_id, department, authority_level, user_type, 
  verification_date, profile_photo_url, is_active, created_at, updated_at,
  primary_company_id, worker_type, verification_status, external_worker_id,
  nationality, passport_number, work_permit_number
) VALUES ('29a51712-ca8a-494e-bdcd-73ee7cb666bc', 'snithat@gmail.com', 'Nithat Kondee', 'นิทัศน์', 'คนดี', 'Staff', NULL, 'EMP0002', 'General', 'user', 'registrant', '2025-10-02T05:52:24.91+00:00', 'https://pub-79e4b0dc661242159b0d79ab81ffd428.r2.dev/profiles/29a51712-ca8a-494e-bdcd-73ee7cb666bc/1759300447923-d4w7m4.jpg', 1, '2025-09-15T10:55:24.899+00:00', '2025-10-02T05:52:24.91+00:00', NULL, 'contractor', 'verified', 'EXT0002', 'Thai', NULL, NULL);
INSERT INTO dbo.users (
  id, email, full_name, thai_first_name, thai_last_name, position_title, 
  phone_number, employee_id, department, authority_level, user_type, 
  verification_date, profile_photo_url, is_active, created_at, updated_at,
  primary_company_id, worker_type, verification_status, external_worker_id,
  nationality, passport_number, work_permit_number
) VALUES ('ecdb4e44-e7ba-4234-9c5b-d0fb90683097', 'suchart_1759307853471_4085n@external.temp', 'Suchart Rakchart', 'สุชาติ', 'รักชาติ', 'Staff', NULL, 'EMP0003', 'General', 'user', 'registrant', '2025-10-02T06:43:26.719+00:00', 'https://pub-79e4b0dc661242159b0d79ab81ffd428.r2.dev/profiles/ecdb4e44-e7ba-4234-9c5b-d0fb90683097/1759387405318-f117hl.jpg', 1, '2025-10-01T08:37:33.306286+00:00', '2025-10-02T06:43:26.719+00:00', NULL, 'contractor', 'verified', 'EXT0003', 'Thai', NULL, NULL);
INSERT INTO dbo.users (
  id, email, full_name, thai_first_name, thai_last_name, position_title, 
  phone_number, employee_id, department, authority_level, user_type, 
  verification_date, profile_photo_url, is_active, created_at, updated_at,
  primary_company_id, worker_type, verification_status, external_worker_id,
  nationality, passport_number, work_permit_number
) VALUES ('edb83a8e-1910-4c7a-a0e6-4cec64fc3e4f', 'ado_1759340554779_17vnv@external.temp', 'Ado Rbee', 'อโด', 'อาบี', 'Staff', NULL, 'EMP0004', 'General', 'user', 'registrant', NULL, NULL, 0, '2025-10-01T17:42:34.87647+00:00', '2025-10-01T17:42:34.87647+00:00', NULL, 'contractor', 'unverified', 'EXT0004', 'Thai', NULL, NULL);
INSERT INTO dbo.users (
  id, email, full_name, thai_first_name, thai_last_name, position_title, 
  phone_number, employee_id, department, authority_level, user_type, 
  verification_date, profile_photo_url, is_active, created_at, updated_at,
  primary_company_id, worker_type, verification_status, external_worker_id,
  nationality, passport_number, work_permit_number
) VALUES ('b3ecdd43-6076-4071-9c09-e27e95724e82', 'edu_1759371640595_f3zum@external.temp', 'Edu Akita', 'เอดู', 'เอกิตา', 'Staff', NULL, 'EMP0005', 'General', 'user', 'registrant', '2025-10-06T06:20:01.129+00:00', 'https://pub-79e4b0dc661242159b0d79ab81ffd428.r2.dev/profiles/b3ecdd43-6076-4071-9c09-e27e95724e82/1759731599908-utn25n.jpg', 1, '2025-10-02T02:20:40.942733+00:00', '2025-10-06T06:20:01.129+00:00', NULL, 'contractor', 'verified', 'EXT0005', 'Singaporean', NULL, NULL);
INSERT INTO dbo.users (
  id, email, full_name, thai_first_name, thai_last_name, position_title, 
  phone_number, employee_id, department, authority_level, user_type, 
  verification_date, profile_photo_url, is_active, created_at, updated_at,
  primary_company_id, worker_type, verification_status, external_worker_id,
  nationality, passport_number, work_permit_number
) VALUES ('c8d24bf7-d2b9-4f05-bdf5-6c2ee3c606e0', 'csdas_1759456117933_054ia@external.temp', 'cSdas asfsdf', NULL, NULL, 'Staff', NULL, 'EMP0006', 'General', 'user', 'registrant', '2025-10-03T01:51:05.3+00:00', 'https://pub-79e4b0dc661242159b0d79ab81ffd428.r2.dev/profiles/c8d24bf7-d2b9-4f05-bdf5-6c2ee3c606e0/1759456264340-t4vva6.jpg', 1, '2025-10-03T01:48:38.251672+00:00', '2025-10-03T01:51:05.3+00:00', NULL, 'contractor', 'verified', 'EXT0006', 'Thai', NULL, NULL);
INSERT INTO dbo.users (
  id, email, full_name, thai_first_name, thai_last_name, position_title, 
  phone_number, employee_id, department, authority_level, user_type, 
  verification_date, profile_photo_url, is_active, created_at, updated_at,
  primary_company_id, worker_type, verification_status, external_worker_id,
  nationality, passport_number, work_permit_number
) VALUES ('93e63ca5-b0e2-461e-814e-f5132a28ec23', 'adad_1759456327245_osqsp@external.temp', 'adAd adfASFAf', 'aDAD', 'adaD', 'Staff', NULL, 'EMP0007', 'General', 'user', 'registrant', '2025-10-03T01:53:04.498+00:00', 'https://pub-79e4b0dc661242159b0d79ab81ffd428.r2.dev/profiles/93e63ca5-b0e2-461e-814e-f5132a28ec23/1759456383796-b075c9.jpg', 1, '2025-10-03T01:52:07.507595+00:00', '2025-10-03T01:53:04.498+00:00', NULL, 'contractor', 'verified', 'EXT0007', 'Myanmar', NULL, NULL);
INSERT INTO dbo.users (
  id, email, full_name, thai_first_name, thai_last_name, position_title, 
  phone_number, employee_id, department, authority_level, user_type, 
  verification_date, profile_photo_url, is_active, created_at, updated_at,
  primary_company_id, worker_type, verification_status, external_worker_id,
  nationality, passport_number, work_permit_number
) VALUES ('74e10a31-ce2f-4af3-bf14-e94c5774072b', 'saranya.ki@th.jec.com', 'Saranya Kiawdang', NULL, NULL, 'Staff', NULL, 'EMP0008', 'General', 'user', 'admin', '2025-10-06T01:54:55.205+00:00', 'https://pub-79e4b0dc661242159b0d79ab81ffd428.r2.dev/profiles/74e10a31-ce2f-4af3-bf14-e94c5774072b/1759477538607-rra3iq.jpg', 1, '2025-10-03T07:43:45.295005+00:00', '2025-10-06T01:54:55.205+00:00', '550e8400-e29b-41d4-a716-446655440100', 'internal', 'verified', NULL, 'Thai', NULL, NULL);
INSERT INTO dbo.users (
  id, email, full_name, thai_first_name, thai_last_name, position_title, 
  phone_number, employee_id, department, authority_level, user_type, 
  verification_date, profile_photo_url, is_active, created_at, updated_at,
  primary_company_id, worker_type, verification_status, external_worker_id,
  nationality, passport_number, work_permit_number
) VALUES ('4f209bc2-70c7-4346-9663-ba6a377d6d83', 'donratorn.ta@th.jec.com', 'Donratron Tanakulapharat', 'ดลธร', 'ธนกุลภารัชต์', 'Staff', NULL, 'EMP0009', 'General', 'system_admin', 'admin', '2025-10-03T09:20:53.664+00:00', 'https://pub-79e4b0dc661242159b0d79ab81ffd428.r2.dev/profiles/4f209bc2-70c7-4346-9663-ba6a377d6d83/1759483252181-lwb7c5.jpg', 1, '2025-10-03T08:52:35.493088+00:00', '2025-10-03T09:20:53.664+00:00', '550e8400-e29b-41d4-a716-446655440100', 'internal', 'verified', NULL, 'Thai', NULL, NULL);
INSERT INTO dbo.users (
  id, email, full_name, thai_first_name, thai_last_name, position_title, 
  phone_number, employee_id, department, authority_level, user_type, 
  verification_date, profile_photo_url, is_active, created_at, updated_at,
  primary_company_id, worker_type, verification_status, external_worker_id,
  nationality, passport_number, work_permit_number
) VALUES ('812ff0b0-337f-4873-9409-6d49e9ee14f5', 'susana.ch@th.jec.com', 'Susana Cheteh', NULL, 'susana.ch', 'Staff', NULL, 'EMP0010', 'General', 'system_admin', 'admin', '2025-10-06T05:48:20.315+00:00', 'https://pub-79e4b0dc661242159b0d79ab81ffd428.r2.dev/profiles/812ff0b0-337f-4873-9409-6d49e9ee14f5/1759729699177-ilu0yp.jpg', 1, '2025-10-06T01:46:23.430954+00:00', '2025-10-06T05:48:20.315+00:00', '550e8400-e29b-41d4-a716-446655440100', 'internal', 'verified', NULL, 'Thai', NULL, NULL);
INSERT INTO dbo.users (
  id, email, full_name, thai_first_name, thai_last_name, position_title, 
  phone_number, employee_id, department, authority_level, user_type, 
  verification_date, profile_photo_url, is_active, created_at, updated_at,
  primary_company_id, worker_type, verification_status, external_worker_id,
  nationality, passport_number, work_permit_number
) VALUES ('6d7e5822-3634-460e-8a16-7848e9ad7e0e', 'pathavee.ta@th.jec.com', 'Pathavee Taengjok', NULL, NULL, 'Staff', NULL, 'EMP0011', 'General', 'system_admin', 'admin', NULL, NULL, 0, '2025-10-06T04:10:53.239225+00:00', '2025-10-06T04:10:53.239225+00:00', '550e8400-e29b-41d4-a716-446655440100', 'internal', 'unverified', NULL, 'Thai', NULL, NULL);
INSERT INTO dbo.users (
  id, email, full_name, thai_first_name, thai_last_name, position_title, 
  phone_number, employee_id, department, authority_level, user_type, 
  verification_date, profile_photo_url, is_active, created_at, updated_at,
  primary_company_id, worker_type, verification_status, external_worker_id,
  nationality, passport_number, work_permit_number
) VALUES ('b3cd738f-574b-4563-9538-eef9075361dd', 'pipat.ke@th.jec.com', 'Pipat Keawprasert', 'พิพัฒน์', 'แก้วประเสริฐ', 'Staff', NULL, 'EMP0012', 'General', 'user', 'admin', '2025-10-09T02:04:41.087+00:00', 'https://pub-79e4b0dc661242159b0d79ab81ffd428.r2.dev/profiles/b3cd738f-574b-4563-9538-eef9075361dd/1759975479611-3l7hih.jpg', 1, '2025-10-09T01:47:50.714911+00:00', '2025-10-09T02:04:41.087+00:00', '550e8400-e29b-41d4-a716-446655440100', 'internal', 'verified', NULL, 'Thai', NULL, NULL);
INSERT INTO dbo.users (
  id, email, full_name, thai_first_name, thai_last_name, position_title, 
  phone_number, employee_id, department, authority_level, user_type, 
  verification_date, profile_photo_url, is_active, created_at, updated_at,
  primary_company_id, worker_type, verification_status, external_worker_id,
  nationality, passport_number, work_permit_number
) VALUES ('e27a563e-3a1c-4026-8629-6e006029af05', 'sukanda.ro@th.jec.com', 'Sukanda Roongrueang', NULL, NULL, 'Staff', NULL, 'EMP0013', 'General', 'user', 'admin', '2025-10-09T01:56:52.027+00:00', 'https://pub-79e4b0dc661242159b0d79ab81ffd428.r2.dev/profiles/e27a563e-3a1c-4026-8629-6e006029af05/1759975010417-jm2fgm.jpg', 1, '2025-10-09T01:49:03.776647+00:00', '2025-10-09T01:56:52.027+00:00', '550e8400-e29b-41d4-a716-446655440100', 'internal', 'verified', NULL, 'Thai', NULL, NULL);
INSERT INTO dbo.users (
  id, email, full_name, thai_first_name, thai_last_name, position_title, 
  phone_number, employee_id, department, authority_level, user_type, 
  verification_date, profile_photo_url, is_active, created_at, updated_at,
  primary_company_id, worker_type, verification_status, external_worker_id,
  nationality, passport_number, work_permit_number
) VALUES ('366e5f74-d191-4153-90f5-341abfb35779', 'prasert.yo@th.jec.com', 'Prasert Youngoun', NULL, NULL, 'Staff', NULL, 'EMP0014', 'General', 'user', 'admin', '2025-10-09T02:05:14.595+00:00', 'https://pub-79e4b0dc661242159b0d79ab81ffd428.r2.dev/profiles/366e5f74-d191-4153-90f5-341abfb35779/1759975513114-ycc9mb.jpg', 1, '2025-10-09T01:54:03.779083+00:00', '2025-10-09T02:05:14.595+00:00', '550e8400-e29b-41d4-a716-446655440100', 'internal', 'verified', NULL, 'Thai', NULL, NULL);
INSERT INTO dbo.users (
  id, email, full_name, thai_first_name, thai_last_name, position_title, 
  phone_number, employee_id, department, authority_level, user_type, 
  verification_date, profile_photo_url, is_active, created_at, updated_at,
  primary_company_id, worker_type, verification_status, external_worker_id,
  nationality, passport_number, work_permit_number
) VALUES ('1854fbc6-2ac1-4cb2-a2f2-3b626dd24bdb', 'wasan.ar@th.jec.com', 'Wasan Arthan', NULL, NULL, 'Staff', NULL, 'EMP0015', 'General', 'user', 'admin', '2025-10-09T02:23:25.932+00:00', 'https://pub-79e4b0dc661242159b0d79ab81ffd428.r2.dev/profiles/1854fbc6-2ac1-4cb2-a2f2-3b626dd24bdb/1759976601628-mjef8e.jpg', 1, '2025-10-09T02:17:27.967691+00:00', '2025-10-09T02:23:25.932+00:00', '550e8400-e29b-41d4-a716-446655440100', 'internal', 'verified', NULL, 'Thai', NULL, NULL);
INSERT INTO dbo.users (
  id, email, full_name, thai_first_name, thai_last_name, position_title, 
  phone_number, employee_id, department, authority_level, user_type, 
  verification_date, profile_photo_url, is_active, created_at, updated_at,
  primary_company_id, worker_type, verification_status, external_worker_id,
  nationality, passport_number, work_permit_number
) VALUES ('de2e82b8-44d4-4183-9ce6-6783cd451f7a', 'kan_v@th.jec.com', 'Kan Viyatat', 'กัญจน์', 'วิยะทัศน์', 'Staff', NULL, 'EMP0016', 'General', 'user', 'admin', '2025-10-09T05:14:49.428+00:00', 'https://pub-79e4b0dc661242159b0d79ab81ffd428.r2.dev/profiles/de2e82b8-44d4-4183-9ce6-6783cd451f7a/1759986885917-4yhppi.jpg', 1, '2025-10-09T04:43:59.666583+00:00', '2025-10-09T05:14:49.428+00:00', '550e8400-e29b-41d4-a716-446655440100', 'internal', 'verified', NULL, 'Thai', NULL, NULL);
INSERT INTO dbo.users (
  id, email, full_name, thai_first_name, thai_last_name, position_title, 
  phone_number, employee_id, department, authority_level, user_type, 
  verification_date, profile_photo_url, is_active, created_at, updated_at,
  primary_company_id, worker_type, verification_status, external_worker_id,
  nationality, passport_number, work_permit_number
) VALUES ('3e5eff47-16f3-4cbd-8085-a91b5107cf8a', 'davit.po@th.jec.com', 'Davit Pooseedin', NULL, NULL, 'Staff', NULL, 'EMP0017', 'General', 'user', 'admin', NULL, NULL, 0, '2025-10-09T06:31:50.049099+00:00', '2025-10-09T06:31:50.049099+00:00', '550e8400-e29b-41d4-a716-446655440100', 'internal', 'unverified', NULL, 'Thai', NULL, NULL);
INSERT INTO dbo.users (
  id, email, full_name, thai_first_name, thai_last_name, position_title, 
  phone_number, employee_id, department, authority_level, user_type, 
  verification_date, profile_photo_url, is_active, created_at, updated_at,
  primary_company_id, worker_type, verification_status, external_worker_id,
  nationality, passport_number, work_permit_number
) VALUES ('49413699-7de1-4503-a0d2-30555ca5c045', 'pakwan.th@th.jec.com', 'Pakwan Thongkao', NULL, NULL, 'Staff', NULL, 'EMP0018', 'General', 'user', 'admin', NULL, NULL, 0, '2025-10-09T06:35:00.502448+00:00', '2025-10-09T06:35:00.502448+00:00', '550e8400-e29b-41d4-a716-446655440100', 'internal', 'unverified', NULL, 'Thai', NULL, NULL);
INSERT INTO dbo.users (
  id, email, full_name, thai_first_name, thai_last_name, position_title, 
  phone_number, employee_id, department, authority_level, user_type, 
  verification_date, profile_photo_url, is_active, created_at, updated_at,
  primary_company_id, worker_type, verification_status, external_worker_id,
  nationality, passport_number, work_permit_number
) VALUES ('d3dc5ea0-3933-4221-ba6f-276a3fe94048', 'suwat.bu@th.jec.com', 'Suwat Bunromyen', NULL, NULL, 'Staff', NULL, 'EMP0019', 'General', 'user', 'admin', NULL, NULL, 0, '2025-10-10T06:33:48.78274+00:00', '2025-10-10T06:33:48.78274+00:00', '550e8400-e29b-41d4-a716-446655440100', 'internal', 'unverified', NULL, 'Thai', NULL, NULL);
