import unittest

from task_manager import TaskManager


class TestTaskManager(unittest.TestCase):

    @classmethod
    def setUpClass(cls):

        cls.manager = TaskManager()

    # ==========================================
    # TEST GET CATEGORIES
    # ==========================================

    def test_get_categories(self):

        categories = (
            self.manager.get_categories()
        )

        self.assertIsInstance(
            categories,
            list
        )

        self.assertGreater(
            len(categories),
            0
        )

    # ==========================================
    # TEST CATEGORY EXISTS
    # ==========================================

    def test_category_exists(self):

        result = (
            self.manager.category_exists(1)
        )

        self.assertTrue(result)

    # ==========================================
    # TEST INVALID CATEGORY
    # ==========================================

    def test_invalid_category(self):

        result = (
            self.manager.category_exists(99999)
        )

        self.assertFalse(result)

    # ==========================================
    # TEST VIEW TASKS
    # ==========================================

    def test_view_tasks(self):

        tasks = (
            self.manager.view_tasks()
        )

        self.assertIsInstance(
            tasks,
            list
        )

        if tasks:

            task = tasks[0]

            self.assertIsNotNone(
                task.id
            )

            self.assertIsNotNone(
                task.title
            )

    # ==========================================
    # TEST CATEGORY SUMMARY
    # ==========================================

    def test_category_summary(self):

        summary = (
            self.manager.category_summary()
        )

        self.assertIsInstance(
            summary,
            list
        )

    # ==========================================
    # TEST HAVING QUERY
    # ==========================================

    def test_categories_with_multiple_tasks(
        self
    ):

        results = (
            self.manager
            .categories_with_multiple_tasks()
        )

        self.assertIsInstance(
            results,
            list
        )


if __name__ == "__main__":

    unittest.main()