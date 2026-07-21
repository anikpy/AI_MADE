from django.core.management.base import BaseCommand
from backend.models import User, Department, Role, Task, DailyLog
import datetime
import random


class Command(BaseCommand):
    help = "Seeds initial database records for development and testing."

    def handle(self, *args, **kwargs):
        self.stdout.write("Clearing old records...")
        DailyLog.objects.all().delete()
        Task.objects.all().delete()
        User.objects.all().delete()
        Department.objects.all().delete()

        self.stdout.write("Creating Users & Departments...")
        # 1. Super Admin
        super_admin = User.objects.create(
            name="Primary Super Admin",
            email="owner@company.com",
            role=Role.SUPER_ADMIN,
        )

        # 2. Shadow Admin
        admin_user = User.objects.create(
            name="Shadow Admin", email="admin@company.com", role=Role.ADMIN
        )

        # 3. Department: Engineering
        eng_dept = Department.objects.create(name="Engineering")
        eng_head = User.objects.create(
            name="Sarah (Tech Lead)",
            email="sarah@company.com",
            role=Role.DEPT_HEAD,
            department=eng_dept,
        )
        eng_dept.head = eng_head
        eng_dept.save()

        # Engineering employees
        dev_emp1 = User.objects.create(
            name="Alex Developer",
            email="alex@company.com",
            role=Role.EMPLOYEE,
            department=eng_dept,
        )
        
        dev_emp2 = User.objects.create(
            name="Michael Engineer",
            email="michael@company.com",
            role=Role.EMPLOYEE,
            department=eng_dept,
        )
        
        dev_emp3 = User.objects.create(
            name="Jennifer QA",
            email="jennifer@company.com",
            role=Role.EMPLOYEE,
            department=eng_dept,
        )

        # 4. Department: Marketing
        mkt_dept = Department.objects.create(name="Marketing")
        mkt_head = User.objects.create(
            name="John (Marketing Lead)",
            email="john@company.com",
            role=Role.DEPT_HEAD,
            department=mkt_dept,
        )
        mkt_dept.head = mkt_head
        mkt_dept.save()

        # Marketing employees
        mkt_emp1 = User.objects.create(
            name="Emma Marketer",
            email="emma@company.com",
            role=Role.EMPLOYEE,
            department=mkt_dept,
        )
        
        mkt_emp2 = User.objects.create(
            name="David Content",
            email="david@company.com",
            role=Role.EMPLOYEE,
            department=mkt_dept,
        )

        # 5. Department: Sales
        sales_dept = Department.objects.create(name="Sales")
        sales_head = User.objects.create(
            name="Robert (Sales Director)",
            email="robert@company.com",
            role=Role.DEPT_HEAD,
            department=sales_dept,
        )
        sales_dept.head = sales_head
        sales_dept.save()

        # Sales employees
        sales_emp1 = User.objects.create(
            name="Lisa Sales",
            email="lisa@company.com",
            role=Role.EMPLOYEE,
            department=sales_dept,
        )
        
        sales_emp2 = User.objects.create(
            name="Thomas Account",
            email="thomas@company.com",
            role=Role.EMPLOYEE,
            department=sales_dept,
        )

        # 6. Department: HR
        hr_dept = Department.objects.create(name="Human Resources")
        hr_head = User.objects.create(
            name="Sophia (HR Manager)",
            email="sophia@company.com",
            role=Role.DEPT_HEAD,
            department=hr_dept,
        )
        hr_dept.head = hr_head
        hr_dept.save()

        # HR employee
        hr_emp1 = User.objects.create(
            name="William Recruiter",
            email="william@company.com",
            role=Role.EMPLOYEE,
            department=hr_dept,
        )

        self.stdout.write("Creating Tasks & Daily Logs...")
        
        # Engineering Department Tasks
        eng_tasks = [
            Task.objects.create(
                title="Build Django REST API",
                description="Create complete backend endpoints for ERP system",
                department=eng_dept,
                assigned_to=dev_emp1,
                assigned_by=eng_head,
                status=Task.Status.IN_PROGRESS,
                due_date=datetime.date.today() + datetime.timedelta(days=3),
            ),
            Task.objects.create(
                title="Implement React Frontend",
                description="Build user interface for the ERP dashboard",
                department=eng_dept,
                assigned_to=dev_emp2,
                assigned_by=eng_head,
                status=Task.Status.TODO,
                due_date=datetime.date.today() + datetime.timedelta(days=7),
            ),
            Task.objects.create(
                title="Write Unit Tests",
                description="Create comprehensive test coverage for backend",
                department=eng_dept,
                assigned_to=dev_emp3,
                assigned_by=eng_head,
                status=Task.Status.TODO,
                due_date=datetime.date.today() + datetime.timedelta(days=5),
            ),
            Task.objects.create(
                title="Fix Authentication Bug",
                description="Resolve issue with session timeout",
                department=eng_dept,
                assigned_to=dev_emp1,
                assigned_by=admin_user,
                status=Task.Status.COMPLETED,
                due_date=datetime.date.today() - datetime.timedelta(days=1),
            ),
        ]
        
        # Marketing Department Tasks
        mkt_tasks = [
            Task.objects.create(
                title="Create Marketing Campaign",
                description="Plan Q3 product launch campaign",
                department=mkt_dept,
                assigned_to=mkt_emp1,
                assigned_by=mkt_head,
                status=Task.Status.IN_PROGRESS,
                due_date=datetime.date.today() + datetime.timedelta(days=10),
            ),
            Task.objects.create(
                title="Write Blog Posts",
                description="Create 5 technical blog posts",
                department=mkt_dept,
                assigned_to=mkt_emp2,
                assigned_by=mkt_head,
                status=Task.Status.TODO,
                due_date=datetime.date.today() + datetime.timedelta(days=14),
            ),
        ]
        
        # Sales Department Tasks
        sales_tasks = [
            Task.objects.create(
                title="Prepare Q3 Sales Report",
                description="Analyze sales data and create report",
                department=sales_dept,
                assigned_to=sales_emp1,
                assigned_by=sales_head,
                status=Task.Status.IN_PROGRESS,
                due_date=datetime.date.today() + datetime.timedelta(days=2),
            ),
            Task.objects.create(
                title="Contact New Leads",
                description="Follow up with 50 potential clients",
                department=sales_dept,
                assigned_to=sales_emp2,
                assigned_by=sales_head,
                status=Task.Status.COMPLETED,
                due_date=datetime.date.today() - datetime.timedelta(days=3),
            ),
        ]
        
        # HR Department Tasks
        hr_tasks = [
            Task.objects.create(
                title="Organize Team Building",
                description="Plan quarterly team building activity",
                department=hr_dept,
                assigned_to=hr_emp1,
                assigned_by=hr_head,
                status=Task.Status.TODO,
                due_date=datetime.date.today() + datetime.timedelta(days=21),
            ),
        ]
        
        self.stdout.write("Creating Daily Logs...")
        
        # Generate daily logs for past week
        today = datetime.date.today()
        
        # Engineering logs
        eng_logs_data = [
            (eng_tasks[0], dev_emp1, today, 8.0, "Completed API authentication module"),
            (eng_tasks[0], dev_emp1, today - datetime.timedelta(days=1), 6.5, "Implemented core models and views"),
            (eng_tasks[3], dev_emp1, today - datetime.timedelta(days=2), 4.0, "Fixed session timeout issue"),
            (eng_tasks[1], dev_emp2, today, 7.5, "Started React dashboard layout"),
            (eng_tasks[2], dev_emp3, today, 5.0, "Setup testing environment"),
        ]
        
        # Marketing logs
        mkt_logs_data = [
            (mkt_tasks[0], mkt_emp1, today, 7.0, "Created campaign strategy document"),
            (mkt_tasks[1], mkt_emp2, today - datetime.timedelta(days=1), 6.0, "Researched blog topics"),
        ]
        
        # Sales logs
        sales_logs_data = [
            (sales_tasks[0], sales_emp1, today, 8.5, "Analyzed sales data for Q2"),
            (sales_tasks[1], sales_emp2, today - datetime.timedelta(days=2), 8.0, "Contacted 35 potential clients"),
        ]
        
        # HR logs
        hr_logs_data = [
            (hr_tasks[0], hr_emp1, today, 6.0, "Researched team building venues"),
        ]
        
        # Create all logs
        all_logs_data = eng_logs_data + mkt_logs_data + sales_logs_data + hr_logs_data
        
        for task, user, log_date, hours, notes in all_logs_data:
            DailyLog.objects.create(
                task=task,
                user=user,
                log_date=log_date,
                hours_spent=hours,
                notes=notes,
            )

        self.stdout.write(
            self.style.SUCCESS("Database successfully seeded with demo data!")
        )
        
        # Summary
        total_users = User.objects.count()
        total_depts = Department.objects.count()
        total_tasks = Task.objects.count()
        total_logs = DailyLog.objects.count()
        
        self.stdout.write(f"Total Users Created: {total_users}")
        self.stdout.write(f"Total Departments: {total_depts}")
        self.stdout.write(f"Total Tasks: {total_tasks}")
        self.stdout.write(f"Total Daily Logs: {total_logs}")
        
        self.stdout.write("\nDemo Data Summary:")
        self.stdout.write("-" * 40)
        self.stdout.write("Super Admin: Primary Super Admin (owner@company.com)")
        self.stdout.write("Admin: Shadow Admin (admin@company.com)")
        self.stdout.write(f"Departments: Engineering, Marketing, Sales, HR")
        self.stdout.write(f"Department Heads: 4 (one for each department)")
        self.stdout.write(f"Employees: 7 total (Engineering: 3, Marketing: 2, Sales: 2, HR: 1)")
        self.stdout.write(f"Tasks: {total_tasks} across all departments")
        self.stdout.write(f"Daily Logs: {total_logs} historical entries")
        
        self.stdout.write("\nRole Distribution:")
        self.stdout.write(f"  SUPER_ADMIN: 1 user")
        self.stdout.write(f"  ADMIN: 1 user")
        self.stdout.write(f"  DEPT_HEAD: 4 users")
        self.stdout.write(f"  EMPLOYEE: {total_users - 6} users")
        
        self.stdout.write("\nTask Status Distribution:")
        todo_count = Task.objects.filter(status=Task.Status.TODO).count()
        in_progress_count = Task.objects.filter(status=Task.Status.IN_PROGRESS).count()
        completed_count = Task.objects.filter(status=Task.Status.COMPLETED).count()
        self.stdout.write(f"  TODO: {todo_count} tasks")
        self.stdout.write(f"  IN_PROGRESS: {in_progress_count} tasks")
        self.stdout.write(f"  COMPLETED: {completed_count} tasks")
