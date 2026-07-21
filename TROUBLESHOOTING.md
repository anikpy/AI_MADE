# 🔧 Troubleshooting Guide

## Common Issues & Solutions

---

## 1. Frontend Not Loading (http://localhost:3000)

### Issue: Page shows "Cannot GET /"
**Solution:**
```bash
cd /home/anik/GitProject/ERP/AI_MADE/frontend
npm run dev
```

### Issue: Port 3000 already in use
**Solution:**
```bash
# Kill process on port 3000
sudo lsof -ti:3000 | xargs kill -9

# Or start on different port
cd /home/anik/GitProject/ERP/AI_MADE/frontend
npm run dev -- -p 3001
```

### Issue: "Cannot find module" errors
**Solution:**
```bash
cd /home/anik/GitProject/ERP/AI_MADE/frontend
npm install
npm run dev
```

---

## 2. Backend Not Responding (http://127.0.0.1:9000)

### Issue: "Connection refused" 
**Solution:**
```bash
cd /home/anik/GitProject/ERP/AI_MADE/superERP
python3 manage.py runserver 0.0.0.0:9000
```

### Issue: Port 9000 already in use
**Solution:**
```bash
# Kill process on port 9000
sudo fuser -k 9000/tcp

# Or use different port
cd /home/anik/GitProject/ERP/AI_MADE/superERP
python3 manage.py runserver 0.0.0.0:8001
# Then update NEXT_PUBLIC_API_BASE_URL in .env.local
```

### Issue: Database not found
**Solution:**
```bash
cd /home/anik/GitProject/ERP/AI_MADE/superERP

# Run migrations
python3 manage.py migrate

# Seed data
python3 manage.py seed_dev_data
```

---

## 3. API Errors

### Issue: 404 on API endpoints
**Cause:** Backend not running or wrong port
**Solution:**
1. Check backend is running: `ps aux | grep runserver`
2. Check port 9000: `curl http://127.0.0.1:9000/api/v1/users/`
3. Verify `.env.local` has correct URL

### Issue: CORS errors in browser console
**Cause:** Backend CORS not configured
**Solution:**
1. Backend has CORS enabled for all origins (check settings.py)
2. Check browser console for exact error
3. Clear browser cache (Ctrl+Shift+Delete)

### Issue: 500 Server Error
**Solution:**
1. Check Django console for error message
2. Review error traceback in terminal
3. Check database is migrated: `python3 manage.py migrate`

### Issue: Authentication errors
**Note:** Auth is **disabled** for development. No token required.
If getting 401 errors, this should not happen. Check:
1. Backend middleware.py doesn't have security enabled
2. Settings.py has CORS_ALLOW_ALL_ORIGINS = True

---

## 4. Frontend Issues

### Issue: User switcher not working
**Solution:**
1. Check browser console for errors (F12)
2. Verify users are loading in dropdown
3. Restart frontend: `npm run dev`

### Issue: Forms not submitting
**Cause:** Validation errors
**Solution:**
1. Check browser console for error details
2. Verify all required fields are filled
3. Check input values meet validation rules:
   - Name: min 2 characters
   - Email: valid format
   - Hours: 0-24 decimal

### Issue: Modal not showing
**Solution:**
1. Check browser console for JavaScript errors
2. Clear browser cache
3. Hard refresh: Ctrl+Shift+R

### Issue: Page shows loading forever
**Cause:** API call failing silently
**Solution:**
1. Open DevTools (F12) → Network tab
2. Look for failed API requests (red)
3. Check response for error details
4. Verify backend is running

### Issue: Dropdown not showing options
**Cause:** Data not loading
**Solution:**
1. Check Network tab in DevTools
2. Verify API endpoint returns data
3. Try: `curl http://127.0.0.1:9000/api/v1/departments/`

---

## 5. Database Issues

### Issue: "Database is locked"
**Solution:**
```bash
cd /home/anik/GitProject/ERP/AI_MADE/superERP

# Delete and recreate database
rm db.sqlite3

# Run migrations
python3 manage.py migrate

# Seed data
python3 manage.py seed_dev_data
```

### Issue: "Table does not exist"
**Solution:**
```bash
cd /home/anik/GitProject/ERP/AI_MADE/superERP
python3 manage.py migrate
python3 manage.py seed_dev_data
```

### Issue: Data not persisting
**Cause:** Database reset on each restart
**Solution:**
This is normal for development. Data is saved in `db.sqlite3`.
To persist between restarts, run seed data after each migration.

---

## 6. Permission Issues

### Issue: Can't delete Super Admin
**Expected Behavior:** This is correct!
Super Admins cannot be deleted. Try as SUPER_ADMIN role or use Admin role and verify it's blocked.

### Issue: Admin can't create Super Admin
**Expected Behavior:** This is correct!
Only Super Admin can create other Super Admins. Use SUPER_ADMIN role to test.

### Issue: Department Head can't create tasks
**Cause:** Might not be assigned to a department
**Solution:**
1. Verify Department Head has `department` field set
2. Check that employees are in the same department
3. Verify department_id in task form matches

### Issue: Employee can't see all tasks
**Expected Behavior:** This is correct!
Employees only see their assigned tasks. Switch to Super Admin or Admin to see all.

---

## 7. Browser Issues

### Issue: Nothing loads, white page
**Solution:**
1. Clear browser cache: Ctrl+Shift+Delete
2. Hard refresh: Ctrl+Shift+R
3. Check console for errors (F12)
4. Try different browser
5. Check frontend is running

### Issue: Console shows many warnings
**Cause:** Normal for development
**Solution:**
Warnings are expected. Errors are what matter. Look for red errors.

### Issue: Dark mode not working
**Solution:**
1. Check body has `bg-slate-950` class
2. Verify Tailwind CSS is loaded
3. Clear cache and hard refresh

---

## 8. Development Mode Issues

### Issue: Hot reload not working
**Solution:**
```bash
# Restart frontend
cd /home/anik/GitProject/ERP/AI_MADE/frontend
npm run dev
```

### Issue: .env.local changes not reflecting
**Solution:**
1. Restart frontend server
2. Environment variables are read at startup

### Issue: Tailwind styles not updating
**Solution:**
```bash
# Rebuild CSS
cd /home/anik/GitProject/ERP/AI_MADE/frontend
rm -rf .next
npm run dev
```

---

## 9. Performance Issues

### Issue: Page loading slowly
**Cause:** Large API responses or backend overload
**Solution:**
1. Check backend is not stuck
2. Verify database queries are fast
3. Check network tab for slow requests

### Issue: Form submission takes too long
**Solution:**
1. Check backend processing
2. Verify database is not locked
3. Monitor Django logs for slow queries

---

## 10. Reset Everything

### Complete Fresh Start
```bash
# Kill all servers
pkill -f "python3 manage.py runserver"
pkill -f "npm run dev"

# Backend: Clean reset
cd /home/anik/GitProject/ERP/AI_MADE/superERP
rm db.sqlite3
python3 manage.py migrate
python3 manage.py seed_dev_data

# Frontend: Clean reset
cd /home/anik/GitProject/ERP/AI_MADE/frontend
rm -rf .next node_modules
npm install

# Restart both
# Terminal 1:
cd /home/anik/GitProject/ERP/AI_MADE/superERP
python3 manage.py runserver 0.0.0.0:9000

# Terminal 2:
cd /home/anik/GitProject/ERP/AI_MADE/frontend
npm run dev
```

---

## 11. Debugging Checklist

When something doesn't work:

1. ✅ Check both servers are running
2. ✅ Open browser DevTools (F12)
3. ✅ Check Console tab for errors
4. ✅ Check Network tab for failed requests
5. ✅ Verify backend responses: `curl http://127.0.0.1:9000/api/v1/users/`
6. ✅ Check frontend .env.local has correct API URL
7. ✅ Hard refresh browser: Ctrl+Shift+R
8. ✅ Check user role has permission
9. ✅ Verify database is not locked
10. ✅ Restart both servers

---

## 12. Getting Help

### Check Logs
```bash
# Backend logs are in terminal
# Frontend logs are in terminal

# Check Django logs for errors
tail -f /tmp/django.log  # If redirected
```

### Test API Directly
```bash
# Get users
curl http://127.0.0.1:9000/api/v1/users/

# Get departments
curl http://127.0.0.1:9000/api/v1/departments/

# Get tasks
curl http://127.0.0.1:9000/api/v1/tasks/

# Check schema
curl http://127.0.0.1:9000/api/v1/schema/
```

### Browser DevTools
1. Press F12 to open
2. Go to Console tab for errors
3. Go to Network tab to see API calls
4. Go to Application tab to check local storage
5. Go to Elements tab to inspect HTML

---

## 13. Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| Cannot GET / | Frontend not running | `npm run dev` |
| Connection refused | Backend not running | `python3 manage.py runserver 0.0.0.0:9000` |
| Port already in use | Another process using port | Kill process or use different port |
| Cannot find module | Dependencies not installed | `npm install` |
| Database locked | Multiple processes accessing DB | Restart backend |
| 404 Not Found | Wrong API endpoint | Check .env.local URL |
| 500 Server Error | Backend error | Check Django logs in terminal |
| CORS error | Cross-origin issue | Check backend CORS settings |
| Form validation error | Invalid input | Check validation rules |

---

## 14. Quick Reference

### Ports
- Frontend: 3000
- Backend: 9000
- Database: SQLite (embedded)

### Key Files
- Frontend config: `/home/anik/GitProject/ERP/AI_MADE/frontend/.env.local`
- Backend config: `/home/anik/GitProject/ERP/AI_MADE/superERP/superERP/settings.py`
- Database: `/home/anik/GitProject/ERP/AI_MADE/superERP/db.sqlite3`

### Important Directories
- Frontend: `/home/anik/GitProject/ERP/AI_MADE/frontend/`
- Backend: `/home/anik/GitProject/ERP/AI_MADE/superERP/`
- Docs: `/home/anik/GitProject/ERP/AI_MADE/`

---

## 15. Still Stuck?

1. Review the error message carefully
2. Check the relevant section in this guide
3. Run the recommended commands
4. Check browser console and network tab
5. Verify both servers are running
6. Try the "Reset Everything" section
7. Check documentation files:
   - QUICKSTART.md
   - FRONTEND_SETUP.md
   - BUILD_SUMMARY.md

---

**Most issues are solved by:**
- Restarting the server
- Clearing browser cache
- Checking if the other server is running
- Reading the error message carefully

Good luck! 🚀
