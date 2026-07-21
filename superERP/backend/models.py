from django.db import models

# Create your models here.
from django.core.exceptions import ValidationError
from django.db import models, transaction


class Role(models.TextChoices):
    SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"
    ADMIN = "ADMIN", "Admin (Shadow)"
    DEPT_HEAD = "DEPT_HEAD", "Department Head"
    EMPLOYEE = "EMPLOYEE", "Employee"

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True, db_index=True)
    head = models.OneToOneField('User', 
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name="managed_department",
        )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
    

class User(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField(unique=True, db_index=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.EMPLOYEE,
        db_index=True,
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employees",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.name} ({self.role})"

    def clean(self):
        super().clean()
        # Immutable Super Admin Guard Rule
        if self.pk:
            original = User.objects.get(pk=self.pk)
            if original.role == Role.SUPER_ADMIN and self.role != Role.SUPER_ADMIN:
                raise ValidationError(
                    {"role": "Super Admin role cannot be demoted or changed."}
                )

        # Department Head constraint
        if self.role == Role.DEPT_HEAD and not self.department:
            raise ValidationError(
                {"department": "A Department Head must be assigned to a department."}
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.role == Role.SUPER_ADMIN:
            raise ValidationError("Super Admin account cannot be deleted.")
        super().delete(*args, **kwargs)


class Task(models.Model):
    class Status(models.TextChoices):
        TODO = "TODO", "To Do"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="created_tasks",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TODO,
        db_index=True,
    )
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.assigned_to.name}"

    def clean(self):
        super().clean()
        # Ensure assigned_to belongs to the specified department
        if self.assigned_to and self.assigned_to.department != self.department:
            raise ValidationError(
                {
                    "assigned_to": f"Employee {self.assigned_to.name} does not belong to department '{self.department.name}'."
                }
            )



class DailyLog(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="daily_logs",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="daily_logs",
    )
    log_date = models.DateField(db_index=True)
    hours_spent = models.DecimalField(max_digits=4, decimal_places=2)
    notes = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-log_date", "-created_at"]
        unique_together = ["task", "user", "log_date"]

    def __str__(self):
        return f"Log by {self.user.name} on {self.log_date} ({self.hours_spent}h)"