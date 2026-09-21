import unittest

from task import Task


class TestTask(unittest.TestCase):

    # ==========================================
    # TEST TASK CREATION
    # ==========================================

    def test_task_creation(self):

        task = Task(
            title="Learn Python",
            description="Learn OOP",
            priority="High",
            task_id=1
        )

        self.assertEqual(
            task.id,
            1
        )

        self.assertEqual(
            task.title,
            "Learn Python"
        )

        self.assertEqual(
            task.description,
            "Learn OOP"
        )

        self.assertEqual(
            task.priority,
            "High"
        )

        self.assertEqual(
            task.status,
            "Pending"
        )

    # ==========================================
    # TEST TASK COMPLETION
    # ==========================================

    def test_complete_task(self):

        task = Task(
            title="Learn SQL",
            description="Practice SQL",
            priority="Medium"
        )

        self.assertEqual(
            task.status,
            "Pending"
        )

        task.complete()

        self.assertEqual(
            task.status,
            "Completed"
        )

    # ==========================================
    # TEST CATEGORY
    # ==========================================

    def test_task_category(self):

        task = Task(
            title="Learn PostgreSQL",
            description="Practice PostgreSQL",
            priority="High",
            task_id=5,
            category_id=2,
            category_name="Database"
        )

        self.assertEqual(
            task.category_id,
            2
        )

        self.assertEqual(
            task.category_name,
            "Database"
        )


if __name__ == "__main__":

    unittest.main()