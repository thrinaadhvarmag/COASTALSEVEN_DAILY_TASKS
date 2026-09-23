import json
import psycopg2

from database import get_connection
from task import Task
from logger import logger


class TaskManager:

    def __init__(self):
        pass

    # ==========================================
    # GET CATEGORIES
    # ==========================================

    def get_categories(self):

        connection = None
        cursor = None

        try:

            connection = get_connection()
            cursor = connection.cursor()

            query = """
                SELECT id, name
                FROM categories
                ORDER BY id
            """

            cursor.execute(query)

            categories = cursor.fetchall()

            return categories

        except psycopg2.Error as error:

            logger.error(
                f"Database error while getting categories: {error}"
            )

            print(
                "\nDatabase error. "
                "Could not retrieve categories."
            )

            return []

        except Exception as error:

            logger.exception(
                f"Unexpected error while getting categories: {error}"
            )

            print("\nUnexpected error occurred.")

            return []

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # ==========================================
    # CHECK CATEGORY
    # ==========================================

    def category_exists(self, category_id):

        connection = None
        cursor = None

        try:

            connection = get_connection()
            cursor = connection.cursor()

            query = """
                SELECT id
                FROM categories
                WHERE id = %s
            """

            cursor.execute(
                query,
                (category_id,)
            )

            result = cursor.fetchone()

            return result is not None

        except psycopg2.Error as error:

            logger.error(
                f"Database error while checking category: {error}"
            )

            return False

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # ==========================================
    # ADD TASK
    # ==========================================

    def add_task(
        self,
        title,
        description,
        priority,
        category_id
    ):

        connection = None
        cursor = None

        try:

            connection = get_connection()
            cursor = connection.cursor()

            query = """
                INSERT INTO tasks
                (
                    title,
                    description,
                    priority,
                    category_id
                )
                VALUES (%s, %s, %s, %s)
            """

            cursor.execute(
                query,
                (
                    title,
                    description,
                    priority,
                    category_id
                )
            )

            connection.commit()

            logger.info(
                f"Task added: {title}"
            )

            return True

        except psycopg2.Error as error:

            if connection:
                connection.rollback()

            logger.error(
                f"Database error while adding task: {error}"
            )

            print(
                "\nDatabase error. "
                "Task could not be added."
            )

            return False

        except Exception as error:

            if connection:
                connection.rollback()

            logger.exception(
                f"Unexpected error while adding task: {error}"
            )

            print("\nUnexpected error occurred.")

            return False

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # ==========================================
    # VIEW ALL TASKS
    # ==========================================

    def view_tasks(self):

        connection = None
        cursor = None

        try:

            connection = get_connection()
            cursor = connection.cursor()

            query = """
                SELECT
                    tasks.id,
                    tasks.title,
                    tasks.description,
                    tasks.status,
                    tasks.priority,
                    tasks.created_at,
                    tasks.category_id,
                    categories.name
                FROM tasks
                LEFT JOIN categories
                    ON tasks.category_id = categories.id
                ORDER BY tasks.id
            """

            cursor.execute(query)

            rows = cursor.fetchall()

            tasks = []

            for row in rows:

                task = Task(
                    task_id=row[0],
                    title=row[1],
                    description=row[2],
                    status=row[3],
                    priority=row[4],
                    created_at=row[5],
                    category_id=row[6],
                    category_name=row[7]
                )

                tasks.append(task)

            return tasks

        except psycopg2.Error as error:

            logger.error(
                f"Database error while viewing tasks: {error}"
            )

            print(
                "\nDatabase error. "
                "Could not retrieve tasks."
            )

            return []

        except Exception as error:

            logger.exception(
                f"Unexpected error while viewing tasks: {error}"
            )

            print("\nUnexpected error occurred.")

            return []

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # ==========================================
    # UPDATE TASK
    # ==========================================

    def update_task(
        self,
        task_id,
        title,
        description,
        priority,
        category_id
    ):

        connection = None
        cursor = None

        try:

            connection = get_connection()
            cursor = connection.cursor()

            query = """
                UPDATE tasks
                SET
                    title = %s,
                    description = %s,
                    priority = %s,
                    category_id = %s
                WHERE id = %s
            """

            cursor.execute(
                query,
                (
                    title,
                    description,
                    priority,
                    category_id,
                    task_id
                )
            )

            connection.commit()

            updated = cursor.rowcount > 0

            if updated:

                logger.info(
                    f"Task updated: ID {task_id}"
                )

            else:

                logger.warning(
                    f"Task not found for update: ID {task_id}"
                )

            return updated

        except psycopg2.Error as error:

            if connection:
                connection.rollback()

            logger.error(
                f"Database error while updating task "
                f"{task_id}: {error}"
            )

            print(
                "\nDatabase error. "
                "Task could not be updated."
            )

            return False

        except Exception as error:

            if connection:
                connection.rollback()

            logger.exception(
                f"Unexpected error while updating task "
                f"{task_id}: {error}"
            )

            print("\nUnexpected error occurred.")

            return False

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # ==========================================
    # DELETE TASK
    # ==========================================

    def delete_task(self, task_id):

        connection = None
        cursor = None

        try:

            connection = get_connection()
            cursor = connection.cursor()

            query = """
                DELETE FROM tasks
                WHERE id = %s
            """

            cursor.execute(
                query,
                (task_id,)
            )

            connection.commit()

            deleted = cursor.rowcount > 0

            if deleted:

                logger.info(
                    f"Task deleted: ID {task_id}"
                )

            else:

                logger.warning(
                    f"Task not found for deletion: ID {task_id}"
                )

            return deleted

        except psycopg2.Error as error:

            if connection:
                connection.rollback()

            logger.error(
                f"Database error while deleting task "
                f"{task_id}: {error}"
            )

            print(
                "\nDatabase error. "
                "Task could not be deleted."
            )

            return False

        except Exception as error:

            if connection:
                connection.rollback()

            logger.exception(
                f"Unexpected error while deleting task "
                f"{task_id}: {error}"
            )

            print("\nUnexpected error occurred.")

            return False

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # ==========================================
    # COMPLETE TASK
    # ==========================================

    def complete_task(self, task_id):

        connection = None
        cursor = None

        try:

            connection = get_connection()
            cursor = connection.cursor()

            query = """
                UPDATE tasks
                SET status = 'Completed'
                WHERE id = %s
            """

            cursor.execute(
                query,
                (task_id,)
            )

            connection.commit()

            completed = cursor.rowcount > 0

            if completed:

                logger.info(
                    f"Task completed: ID {task_id}"
                )

            else:

                logger.warning(
                    f"Task not found for completion: ID {task_id}"
                )

            return completed

        except psycopg2.Error as error:

            if connection:
                connection.rollback()

            logger.error(
                f"Database error while completing task "
                f"{task_id}: {error}"
            )

            print(
                "\nDatabase error. "
                "Task could not be completed."
            )

            return False

        except Exception as error:

            if connection:
                connection.rollback()

            logger.exception(
                f"Unexpected error while completing task "
                f"{task_id}: {error}"
            )

            print("\nUnexpected error occurred.")

            return False

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # ==========================================
    # VIEW TASKS BY CATEGORY
    # ==========================================

    def view_tasks_by_category(self, category_id):

        connection = None
        cursor = None

        try:

            connection = get_connection()
            cursor = connection.cursor()

            query = """
                SELECT
                    tasks.id,
                    tasks.title,
                    tasks.description,
                    tasks.status,
                    tasks.priority,
                    tasks.created_at,
                    categories.name
                FROM tasks
                JOIN categories
                    ON tasks.category_id = categories.id
                WHERE categories.id = %s
                ORDER BY tasks.id
            """

            cursor.execute(
                query,
                (category_id,)
            )

            rows = cursor.fetchall()

            tasks = []

            for row in rows:

                task = Task(
                    task_id=row[0],
                    title=row[1],
                    description=row[2],
                    status=row[3],
                    priority=row[4],
                    created_at=row[5],
                    category_id=category_id,
                    category_name=row[6]
                )

                tasks.append(task)

            return tasks

        except psycopg2.Error as error:

            logger.error(
                f"Database error while filtering by category: {error}"
            )

            print(
                "\nDatabase error."
            )

            return []

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # ==========================================
    # CATEGORY SUMMARY
    # ==========================================

    def category_summary(self):

        connection = None
        cursor = None

        try:

            connection = get_connection()
            cursor = connection.cursor()

            query = """
                SELECT
                    categories.name AS category,
                    COUNT(tasks.id) AS total_tasks
                FROM categories
                LEFT JOIN tasks
                    ON tasks.category_id = categories.id
                GROUP BY categories.name
                ORDER BY total_tasks DESC
            """

            cursor.execute(query)

            return cursor.fetchall()

        except psycopg2.Error as error:

            logger.error(
                f"Database error while generating category summary: {error}"
            )

            print(
                "\nDatabase error."
            )

            return []

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # ==========================================
    # CATEGORIES WITH MULTIPLE TASKS
    # ==========================================

    def categories_with_multiple_tasks(self):

        connection = None
        cursor = None

        try:

            connection = get_connection()
            cursor = connection.cursor()

            query = """
                SELECT
                    categories.name AS category,
                    COUNT(tasks.id) AS total_tasks
                FROM categories
                JOIN tasks
                    ON tasks.category_id = categories.id
                GROUP BY categories.name
                HAVING COUNT(tasks.id) >= 2
                ORDER BY total_tasks DESC
            """

            cursor.execute(query)

            return cursor.fetchall()

        except psycopg2.Error as error:

            logger.error(
                f"Database error while using HAVING: {error}"
            )

            print(
                "\nDatabase error."
            )

            return []

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # ==========================================
    # EXPORT TASKS TO JSON
    # ==========================================

    def export_to_json(
        self,
        filename="tasks.json"
    ):

        try:

            tasks = self.view_tasks()

            task_data = []

            for task in tasks:

                task_data.append({
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "status": task.status,
                    "priority": task.priority,
                    "category_id": task.category_id,
                    "category": task.category_name,
                    "created_at": str(
                        task.created_at
                    )
                })

            with open(
                filename,
                "w"
            ) as file:

                json.dump(
                    task_data,
                    file,
                    indent=4
                )

            logger.info(
                f"Tasks exported to {filename}"
            )

            return True

        except Exception as error:

            logger.exception(
                f"Error while exporting tasks to JSON: {error}"
            )

            print(
                "\nError exporting tasks to JSON."
            )

            return False