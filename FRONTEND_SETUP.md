# 🚀 Workforce ERP Frontend - Complete Setup Guide

## ✅ Project Status
**The Next.js frontend is fully built and running!**

---

## 📋 What's Been Built

### Pages & Features:
1. **Dashboard** (`/`) - Executive metrics and quick actions
2. **Users** (`/users`) - User directory with add/delete functionality
3. **Departments** (`/departments`) - Department management with grid view
4. **Tasks** (`/tasks`) - Kanban board with drag-friendly status updates
5. **Daily Logs** (`/daily-logs`) - Activity feed with work logging

### Components:
- ✅ `Navbar.jsx` - Top navigation with dev user switcher
- ✅ `Modal.jsx` - Reusable modal component
- ✅ `Toast.jsx` - Toast notifications
- ✅ `Loading.jsx` - Loading spinners
- ✅ `DevUserContext.js` - Role-based context provider
- ✅ `utils.js` - Helper functions and validators
- ✅ `api.js` - API client with all endpoints

---

## 🎮 Running the Application

### Backend (Django/DRF)
Backend is running on port **9000**:
```bash
# The backend server is already running at:
http://127.0.0.1:9000/api/v1
```

### Frontend (Next.js)
Frontend is running on port **3000**:
```bash
# Access the frontend at:
http://localhost:3000
```

### To Restart Frontend (if needed):
```bash
cd /home/anik/GitProject/ERP/AI_MADE/frontend
npm run dev
```

---

## 🔑 Dev User Switcher

The Navbar includes a dropdown to switch between mock users:

1. **Primary Super Admin** (ID: 1) - Full access to all features
2. **Shadow Admin** (ID: 2) - Manages departments & employees (except Super Admin)
3. **Sarah (Tech Lead)** (ID: 3) - Department Head - can create tasks for their dept
4. **Alex Developer** (ID: 4) - Employee - can see assigned tasks and log work

---

## 🎯 Feature Breakdown

### Dashboard
- Displays total employees, departments, and active tasks
- Quick action buttons to create tasks, add employees, or log work
- Task status breakdown with visual progress bars

### Users Management
- List all users with roles and departments
- **Super Admin & Admin only:** Add new users
- **Super Admin & Admin only:** Delete users
- Role-based restrictions (Admins can't create Super Admins)

### Departments
- Grid view of all departments
- Shows Department Head name and employee count
- **Super Admin & Admin only:** Create new departments
- Must select eligible department heads

### Tasks Kanban Board
- 3-column layout: To Do | In Progress | Completed
- Drag-friendly status dropdowns
- Shows task details: title, description, assigned employee, due date
- **Department Heads:** Can only see tasks in their department
- **Employees:** Can only see tasks assigned to them
- **Super Admin & Admin:** See all tasks

### Daily Logs
- Activity feed sorted by most recent first
- Shows task, hours spent, notes, logged by, and timestamp
- **Employees:** Can log work only on assigned tasks
- Form validation for hours (0-24) and notes (min 5 chars)

---

## 🎨 Design & Styling

- **Dark Theme:** Slate-950 background with slate-800 cards
- **Icons:** Lucide React for all UI icons
- **Responsive:** Full mobile, tablet, and desktop support
- **Color Scheme:**
  - SUPER_ADMIN: Red badges
  - ADMIN: Orange badges
  - DEPT_HEAD: Blue badges
  - EMPLOYEE: Slate badges

---

## 🔌 API Integration

All API calls use the `api.js` client:

```javascript
import { api } from '@/lib/api';

// Users
api.getUsers()
api.createUser(data)
api.updateUser(id, data)
api.deleteUser(id)

// Departments
api.getDepartments()
api.createDepartment(data)
api.updateDepartment(id, data)

// Tasks
api.getTasks()
api.createTask(data)
api.updateTask(id, data)

// Daily Logs
api.getDailyLogs()
api.createDailyLog(data)

// Dashboard
api.getDashboardMetrics()
```

---

## 🧪 Testing

### Quick Test Flow:
1. Open http://localhost:3000
2. View dashboard metrics
3. Switch to "Sarah (Tech Lead)" via dropdown
4. Go to Tasks and create a new task
5. Switch to "Alex Developer"
6. See assigned task and log work
7. View daily logs

---

## 📁 File Structure

```
frontend/
├── app/
│   ├── layout.js           # Root layout with DevUserProvider
│   ├── globals.css         # Tailwind imports
│   ├── page.js             # Dashboard
│   ├── users/
│   │   └── page.js         # Users management
│   ├── departments/
│   │   └── page.js         # Departments management
│   ├── tasks/
│   │   └── page.js         # Kanban board
│   └── daily-logs/
│       └── page.js         # Daily logs
├── components/
│   ├── Navbar.jsx          # Top navigation
│   ├── Modal.jsx           # Modal wrapper
│   ├── Toast.jsx           # Toast notifications
│   └── Loading.jsx         # Loading spinners
├── context/
│   └── DevUserContext.js   # User state & role logic
├── lib/
│   ├── api.js              # API client
│   └── utils.js            # Helpers & validators
├── .env.local              # Environment config
└── package.json
```

---

## 🔐 Role-Based Access Control

| Feature | Super Admin | Admin | Dept Head | Employee |
|---------|:-----:|:----:|:--------:|:--------:|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| Manage Users | ✅ | ✅ | ❌ | ❌ |
| Create Super Admin | ✅ | ❌ | ❌ | ❌ |
| Manage Departments | ✅ | ✅ | ❌ | ❌ |
| Create Tasks | ✅ | ✅ | ✅* | ❌ |
| View All Tasks | ✅ | ✅ | ❌ | ❌ |
| Log Work | ✅ | ✅ | ✅ | ✅ |

*Department Heads can only create tasks for their own department

---

## 🐛 Debugging

### Check Network Requests:
1. Open DevTools (F12)
2. Go to Network tab
3. Look for failed API requests
4. Check console for error messages

### Common Issues:
- **404 on API calls:** Ensure backend is running on port 9000
- **CORS errors:** Backend has CORS enabled for all origins
- **User not switching:** Check if user ID exists in backend
- **Modal not closing:** Check browser console for JavaScript errors

---

## 📚 Documentation

### Environment Variables
```
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:9000/api/v1
```

### Context API
`DevUserContext` provides:
- `currentUser` - Currently active user object
- `allUsers` - List of all users
- `switchUser(userId)` - Change active user
- `canManageUsers` - Boolean for user management access
- `canCreateTasks` - Boolean for task creation access
- `isDeptHead` - Is current user a department head?
- `isDepartmentOf(deptId)` - Does user belong to department?

---

## 🚀 Ready to Use!

The frontend is **100% complete** and **fully functional**. All pages are interactive and connected to the backend API.

### Access the App:
- **Frontend:** http://localhost:3000
- **Backend API Docs:** http://127.0.0.1:9000/api/v1/docs/
- **Backend:** http://127.0.0.1:9000/api/v1

---

## 📞 Support

If you encounter any issues, check:
1. Backend is running on port 9000
2. Frontend is running on port 3000
3. Browser console for error messages
4. Network tab for failed API calls
