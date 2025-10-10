🎯 Project Overview
A Progressive Web App for construction site safety management, supporting offline usage, face recognition, and multi-project workflows.

1. Member Management (Updated & Expanded)
Face Recognition (TensorFlow.js (face-landmarks-detection))

Register multiple face angles per member (stored as descriptors)

Use face recognition for ID, attendance, and meeting sign-in

Support group face detection (multiple people per frame)

Photo Profile

Store member photos

Use profile photo on ID card, meeting reports, etc.

Multi-Project Support

One member can work on multiple projects (project list, switching)

Project status: Active/Closed

Member can be linked to many projects via project_members

Position & Role System

Global position (at registration, e.g. Safety Manager, Supervisor)

Per-project position (member can have a different role per project)

Track project role history

Member Types (with registration logic)

Internal: Staff (email auth required; pre-registered by system admin; self-register with photo and face)

External: (future) External company staff (email or LINE ID auth; company required)

Worker: (future) No login, added by admin/head; used for attendance only (face reg only)

Role System

system_admin: Can do everything, all projects

admin: Pre-register external staff, add workers, assign to own projects

member: Basic user, assigned by admin

Registration Authority

System admin: Pre-registers internal (current focus)

Admin: (future) Pre-registers external/adds workers

Team Head: (future) Adds workers under their own team only

Team Head Management

Workers have a teamHeadId

Team Heads can add workers only to their team; auto-select current user as head

Project Access

System admin: See/manage all projects

Admin/member: See only assigned projects; switch via UI

Status Workflow

New members: pending until email/LINE confirmed

Set to active after confirmation

2. Site Patrol Report (Current Focus)
Issue Management

Add patrol issue: topic, description, project, issuer

Assign responsible person

Status: Open/In Progress/Closed

Photo Documentation

Take and store "before" and "after" photos

Annotate/draw/markup photos before upload

Offline-First

All actions work offline (Dexie.js)

Sync to Supabase when reconnected

Photo storage and sync queue

Audit Trail

Track who reported/updated each issue

Track timestamps/status changes

3. Toolbox Meeting Record
Meeting Details

Area, tasks, number of workers

Headman and supervisor information

Topics & Safety

List of topics discussed, hazards, control measures

Attendance

Face detection for group attendance (one photo, many faces)

Auto-attendance via face recognition

Digital signature (touchscreen)

Documentation

Meeting photos, PDF summary

Link attendance to member database

4. Permit to Work System
Permit Types

Hot work, height, confined space, electrical

Workflow

Request → Approval → Active → Closed

Digital signatures for each step

Validity period and reminders

5. ID Card Generation
Features

Generate PDF ID card with photo, name, position, QR code

Emergency contact info and project link

6. Offline Mode
Capabilities

Create/edit records, take photos, run face recognition all offline

Local Dexie DB for members, projects, patrol, meetings, permits

Sync queue for all unsynced records; resolves conflicts on re-connect

7. PWA/UX Requirements
Installable (add to home screen)

Responsive (mobile, tablet, desktop)

App-like (full screen, fast nav)

Secure (HTTPS, auth)

Push notifications (future, for reminders, permit expiry, etc.)

Technical Stack
Frontend: React 18+ (TypeScript), Tailwind CSS, Redux Toolkit, React Router, TensorFlow.js (face-landmarks-detection), Dexie.js, React Hook Form, Headless UI

PWA: Workbox, Vite PWA Plugin

Backend: Hybrid Storage Architecture
- Supabase (PostgreSQL, authentication, data storage)
- Cloudflare R2 (file storage for images and documents)
- JWT auth (email/LINE)
- Custom sync queue mechanism for offline-first capabilities

Summary of What’s Live and What’s Next
NOW: Internal member registration, project/member management (internal only), site patrol (offline-first) is in focus.

PLANNED: External member and worker flows, Toolbox/Meeting, Permit, ID card, advanced sync, and notifications.