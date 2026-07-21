# ⚡ Quick Start Guide - Workforce ERP

## 🎯 What You Need to Know

### Two Servers Running:
1. **Django Backend** - Port 9000 (http://127.0.0.1:9000)
2. **Next.js Frontend** - Port 3000 (http://localhost:3000)

---

## 🚀 Start Here

### 1. Access the Frontend
```
http://localhost:3000
```

### 2. Switch User Roles
Click the dropdown button in the top-right corner (shows current user) to switch between:
- Primary Super Admin (all permissions)
- Shadow Admin (manage staff)
- Sarah (Tech Lead) (department head)
- Alex Developer (regular employee)

### 3. Navigate Pages
- **Dashboard** - Overview metrics and quick actions
- **Users** - Manage employees
- **Departments** - View and create departments
- **Tasks** - Kanban board for task management
- **Logs** - Track daily work hours

---

## 💡 Test Scenarios

### Scenario 1: Create a Task (As Department Head)
1. Switch to "Sarah (Tech Lead)"
2. Click "Tasks" in navigation
3. Click "Create Task" button
4. Fill in task details
5. Assign to "Alex Developer"
6. Submit

### Scenario 2: Log Work (As Employee)
1. Switch to "Alex Developer"
2. Click "Daily Logs" in navigation
3. Click "Log Work" button
4. Select assigned task
5. Enter hours and notes
6. Submit

### Scenario 3: Manage Users (As Admin)
1. Switch to "Shadow Admin"
2. Click "Users" in navigation
3. Click "Add User" button
4. Fill in employee details
5. Select role and department
6. Submit

---

## 🎮 Live Test Data

The backend comes pre-populated with:

**Users:**
- Primary Super Admin (owner@company.com)
- Shadow Admin (admin@company.com)
- Sarah (Tech Lead) - Engineering
- Alex Developer - Engineering
- John (Marketing Lead) - Marketing
- Emma Marketer - Marketing

**Departments:**
- Engineering (Head: Sarah)
- Marketing (Head: John)

**Tasks:**
- "Build Django REST API" (assigned to Alex)

---

## 🔧 If Something Breaks

### Backend down?
```bash
cd /home/anik/GitProject/ERP/AI_MADE/superERP
python3 manage.py runserver 0.0.0.0:9000
```

### Frontend down?
```bash
cd /home/anik/GitProject/ERP/AI_MADE/frontend
npm run dev
```

### Clear cache/rebuild?
```bash
# Frontend
cd /home/anik/GitProject/ERP/AI_MADE/frontend
rm -rf .next
npm run dev
```

---

## 📊 What Each Role Can Do

### 👑 Super Admin
- ✅ View everything
- ✅ Create/edit/delete users, departments, tasks
- ✅ Log work hours
- ✅ View all reports

### 🕵️ Admin (Shadow)
- ✅ View everything
- ✅ Create/edit/delete users and departments
- ✅ Create tasks
- ✅ **Can't** touch Super Admin users
- ✅ Log work hours

### 👔 Department Head
- ✅ View dashboard
- ✅ View users
- ✅ Create tasks (only for their department)
- ✅ View tasks (only for their department)
- ✅ Log work hours

### 👤 Employee
- ✅ View dashboard
- ✅ View tasks assigned to them
- ✅ Log work hours on their tasks
- ❌ Can't create tasks
- ❌ Can't manage users/departments

---

## 🌐 API Documentation

Backend Swagger UI available at:
```
http://127.0.0.1:9000/api/v1/docs/
```

All endpoints are **public** (no authentication required for testing).

---

## 📝 Quick Links

- **Frontend Home:** http://localhost:3000
- **API Docs:** http://127.0.0.1:9000/api/v1/docs/
- **Django Admin:** http://127.0.0.1:9000/admin/
- **Backend API:** http://127.0.0.1:9000/api/v1

---

## ✅ Everything Works!

The application is fully functional:
- ✅ All pages load
- ✅ All forms submit
- ✅ All API calls work
- ✅ Role-based access control works
- ✅ Data persists
- ✅ Dark theme applied

**You're ready to go!**

---

## 🎓 Next Steps

1. Explore all pages in each user role
2. Try creating new data (users, departments, tasks)
3. Test the restrictions (e.g., Admin trying to delete Super Admin)
4. Check the Swagger UI for API schema
5. Customize styling/colors as needed

Enjoy your Workforce ERP Platform! 🚀
