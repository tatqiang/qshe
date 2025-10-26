# UI Mockups for QSHE PWA

## 1. Authentication & Onboarding

```
┌─────────────────────────────┐
│                             │
│          QSHE logo          │
│                             │
├─────────────────────────────┤
│                             │
│    [Email Input Field]      │
│                             │
│    [Password Input Field]   │
│                             │
│    [Sign In Button]         │
│                             │
│    Register | Forgot Pass   │
│                             │
└─────────────────────────────┘
```

## 2. User Dashboard (Project Selection)

```
┌─────────────────────────────┐
│ QSHE   [User] ▼    [⚙️]     │
├─────────────────────────────┤
│                             │
│     Select Active Project   │
│                             │
│  ┌─────────────────────┐    │
│  │ Project Alpha       │    │
│  │ Active | 24 Members │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ Project Beta        │    │
│  │ Active | 18 Members │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ Project Gamma       │    │
│  │ Closed | 32 Members │    │
│  └─────────────────────┘    │
│                             │
└─────────────────────────────┘
```

## 3. Project Dashboard

```
┌─────────────────────────────┐
│ ◀ Project Alpha    [⚙️]     │
├─────────────────────────────┤
│                             │
│  📊 Project Overview        │
│  -------------------------  │
│  24 Members                 │
│  12 Open Issues             │
│  3 Scheduled Meetings       │
│                             │
│  📱 Quick Actions           │
│  -------------------------  │
│  [👤 Members]  [🛠 Issues]  │
│  [📝 Patrols]  [📅 Meetings]│
│                             │
│  🔔 Recent Activity         │
│  -------------------------  │
│  • New issue reported       │
│  • Meeting scheduled        │
│  • 2 issues closed          │
│                             │
└─────────────────────────────┘
```

## 4. User Management

```
┌─────────────────────────────┐
│ ◀ Users           [➕ New]  │
├─────────────────────────────┤
│ [🔍 Search users...]        │
├─────────────────────────────┤
│                             │
│  ┌─────────────────────┐    │
│  │ 👤 John Smith       │    │
│  │ Safety Manager      │    │
│  │ Internal • Active   │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ 👤 Jane Doe         │    │
│  │ Supervisor          │    │
│  │ Internal • Active   │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ 👤 Mark Johnson     │    │
│  │ Worker              │    │
│  │ External • Pending  │    │
│  └─────────────────────┘    │
│                             │
└─────────────────────────────┘
```

## 5. User Registration (Face Capture)

```
┌─────────────────────────────┐
│ ◀ Register Face            │
├─────────────────────────────┤
│                             │
│     ┌─────────────┐         │
│     │             │         │
│     │   Camera    │         │
│     │   Preview   │         │
│     │             │         │
│     └─────────────┘         │
│                             │
│  Position your face in the  │
│  frame and follow prompts   │
│                             │
│  Progress: ○○○○○            │
│           Front angle       │
│                             │
│        [Capture]            │
│                             │
└─────────────────────────────┘
```

## 6. Project Member Assignment

```
┌─────────────────────────────┐
│ ◀ Assign to Project        │
├─────────────────────────────┤
│ User: John Smith            │
├─────────────────────────────┤
│                             │
│  Select Projects:           │
│                             │
│  [✓] Project Alpha          │
│      Role: Safety Officer   │
│                             │
│  [ ] Project Beta           │
│      Role: [Select Role ▼]  │
│                             │
│  [✓] Project Delta          │
│      Role: Observer         │
│                             │
│                             │
│  [Save Assignments]         │
│                             │
└─────────────────────────────┘
```

## 7. Safety Patrol - Issue List

```
┌─────────────────────────────┐
│ ◀ Safety Patrol   [➕ New]  │
├─────────────────────────────┤
│ Project: Alpha    [Filter ▼]│
├─────────────────────────────┤
│                             │
│  ┌─────────────────────┐    │
│  │ 🔴 Electrical Hazard│    │
│  │ Area: Block B       │    │
│  │ Status: Open        │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ 🟠 Missing Signage  │    │
│  │ Area: Main Entrance │    │
│  │ Status: In Progress │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ 🟢 Spill Cleaned    │    │
│  │ Area: Cafeteria     │    │
│  │ Status: Closed      │    │
│  └─────────────────────┘    │
│                             │
└─────────────────────────────┘
```

## 8. Safety Patrol - New Issue

```
┌─────────────────────────────┐
│ ◀ New Issue                │
├─────────────────────────────┤
│                             │
│  Title:                     │
│  [Tripping Hazard]          │
│                             │
│  Location:                  │
│  [Storage Area]             │
│                             │
│  Description:               │
│  [Materials left on...]     │
│                             │
│  Severity:                  │
│  [○ Low ● Medium ○ High]    │
│                             │
│  Assign To:                 │
│  [Select Person ▼]          │
│                             │
│  Evidence:                  │
│  [📷 Take Photo]            │
│                             │
│  [Save Issue]               │
│                             │
└─────────────────────────────┘
```

## 9. Photo Annotation

```
┌─────────────────────────────┐
│ ◀ Annotate Photo           │
├─────────────────────────────┤
│                             │
│     ┌─────────────┐         │
│     │             │         │
│     │    Photo    │         │
│     │    with     │         │
│     │  annotation │         │
│     │             │         │
│     └─────────────┘         │
│                             │
│  Tools:                     │
│  [✏️] [⭕] [⬜] [⬅️] [➡️]    │
│                             │
│  Color:                     │
│  [🔴] [🟡] [🟢] [⚪]        │
│                             │
│  [Save Annotation]          │
│                             │
└─────────────────────────────┘
```

## 10. Offline Status Indicator

```
┌─────────────────────────────┐
│ QSHE   [User] ▼    [⚙️]     │
│ 🔄 Syncing... (3 items)     │
├─────────────────────────────┤
│                             │
│           ...               │
│                             │
└─────────────────────────────┘

or

┌─────────────────────────────┐
│ QSHE   [User] ▼    [⚙️]     │
│ 📴 Offline Mode              │
├─────────────────────────────┤
│                             │
│           ...               │
│                             │
└─────────────────────────────┘
```

## 11. Desktop Layout with Left Navigation

```
┌────────┬────────────────────────────────────┐
│        │                                    │
│  QSHE  │  Project Alpha         [User ▼]   │
│        │                                    │
├────────┼────────────────────────────────────┤
│        │                                    │
│  📊    │  📊 Project Overview              │
│ Home   │  ---------------------------       │
│        │  24 Members                        │
├────────┤  12 Open Issues                    │
│        │  3 Scheduled Meetings              │
│  🔍    │                                    │
│ Patrol │  📱 Quick Actions                  │
│        │  ---------------------------       │
├────────┤  [👤 Members]  [🛠 Issues]        │
│        │  [📝 Patrols]  [📅 Meetings]      │
│  📝    │                                    │
│  PTW   │  🔔 Recent Activity               │
│        │  ---------------------------       │
├────────┤  • New issue reported              │
│        │  • Meeting scheduled               │
│  📋    │  • 2 issues closed                 │
│Toolbox │                                    │
│        │                                    │
├────────┤                                    │
│        │                                    │
│  👥    │                                    │
│ Users  │                                    │
│        │                                    │
├────────┤                                    │
│        │                                    │
│  ⚙️    │                                    │
│Settings│                                    │
│        │                                    │
└────────┴────────────────────────────────────┘
```

## 12. Mobile Layout with Bottom Navigation

```
┌─────────────────────────────┐
│ Project Alpha    [☰]        │
├─────────────────────────────┤
│                             │
│                             │
│                             │
│                             │
│     (Content Area)          │
│                             │
│                             │
│                             │
│                             │
│                             │
├─────────────────────────────┤
│ 📊    🔍    📝    📋    👥  │
│ Home  Patrol  PTW  Toolbox More│
└─────────────────────────────┘
```

## 13. Responsive Navigation Strategy

For the QSHE PWA, we'll implement a responsive navigation system:

### Desktop View (>= 1024px)
- Left sidebar with both icons and text labels
- Always visible navigation menu
- Expandable/collapsible for more screen space
- Main content area adapts to sidebar state

### Tablet View (768px - 1023px)
- Collapsible left sidebar (icons only by default)
- Expandable on hover/click
- Shows tooltip labels on hover

### Mobile View (< 768px)
- Bottom navigation bar with icons and minimal text
- Limited to 5 primary navigation items
- "More" option for additional features
- Touch-optimized tap targets
