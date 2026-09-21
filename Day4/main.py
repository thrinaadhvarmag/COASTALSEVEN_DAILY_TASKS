from task_manager import TaskManager


# ==========================================
# DISPLAY TASKS
# ==========================================

def display_tasks(tasks):

    if not tasks:

        print("\nNo tasks found.")

        return

    print("\n========== TASKS ==========")

    for task in tasks:

        print("\nID          :", task.id)
        print("Title       :", task.title)
        print("Description :", task.description)
        print("Status      :", task.status)
        print("Priority    :", task.priority)

        if task.category_name:
            print(
                "Category    :",
                task.category_name
            )
        else:
            print(
                "Category    : Uncategorized"
            )

        print(
            "Created At  :",
            task.created_at
        )

        print("---------------------------")


# ==========================================
# SELECT CATEGORY
# ==========================================

def select_category(manager):

    categories = manager.get_categories()

    if not categories:

        print("\nNo categories available.")

        return None

    print("\n========== CATEGORIES ==========")

    for category in categories:

        print(
            category[0],
            ".",
            category[1]
        )

    print("==============================")

    try:

        category_id = int(
            input("Enter category ID: ")
        )

    except ValueError:

        print(
            "\nInvalid category ID."
        )

        return None

    if not manager.category_exists(category_id):

        print(
            "\nCategory not found."
        )

        return None

    return category_id


# ==========================================
# ADD TASK
# ==========================================

def add_task(manager):

    title = input(
        "Enter task title: "
    ).strip()

    if not title:

        print(
            "\nTitle cannot be empty."
        )

        return

    description = input(
        "Enter task description: "
    ).strip()

    priority = input(
        "Enter priority (Low/Medium/High): "
    ).strip()

    if priority not in [
        "Low",
        "Medium",
        "High"
    ]:

        print(
            "\nInvalid priority."
        )

        return

    category_id = select_category(manager)

    if category_id is None:

        return

    added = manager.add_task(
        title,
        description,
        priority,
        category_id
    )

    if added:

        print(
            "\nTask added successfully!"
        )


# ==========================================
# UPDATE TASK
# ==========================================

def update_task(manager):

    try:

        task_id = int(
            input("Enter task ID to update: ")
        )

    except ValueError:

        print(
            "\nInvalid task ID."
        )

        return

    title = input(
        "Enter new title: "
    ).strip()

    if not title:

        print(
            "\nTitle cannot be empty."
        )

        return

    description = input(
        "Enter new description: "
    ).strip()

    priority = input(
        "Enter new priority (Low/Medium/High): "
    ).strip()

    if priority not in [
        "Low",
        "Medium",
        "High"
    ]:

        print(
            "\nInvalid priority."
        )

        return

    category_id = select_category(manager)

    if category_id is None:

        return

    updated = manager.update_task(
        task_id,
        title,
        description,
        priority,
        category_id
    )

    if updated:

        print(
            "\nTask updated successfully!"
        )

    else:

        print(
            "\nTask not found."
        )


# ==========================================
# DELETE TASK
# ==========================================

def delete_task(manager):

    try:

        task_id = int(
            input("Enter task ID to delete: ")
        )

    except ValueError:

        print(
            "\nInvalid task ID."
        )

        return

    confirmation = input(
        "Are you sure you want to delete this task? (y/n): "
    ).strip().lower()

    if confirmation != "y":

        print(
            "\nDelete cancelled."
        )

        return

    deleted = manager.delete_task(
        task_id
    )

    if deleted:

        print(
            "\nTask deleted successfully!"
        )

    else:

        print(
            "\nTask not found."
        )


# ==========================================
# COMPLETE TASK
# ==========================================

def complete_task(manager):

    try:

        task_id = int(
            input("Enter task ID to complete: ")
        )

    except ValueError:

        print(
            "\nInvalid task ID."
        )

        return

    completed = manager.complete_task(
        task_id
    )

    if completed:

        print(
            "\nTask completed successfully!"
        )

    else:

        print(
            "\nTask not found."
        )


# ==========================================
# VIEW TASKS BY CATEGORY
# ==========================================

def view_tasks_by_category(manager):

    category_id = select_category(manager)

    if category_id is None:

        return

    tasks = manager.view_tasks_by_category(
        category_id
    )

    display_tasks(tasks)


# ==========================================
# CATEGORY SUMMARY
# ==========================================

def show_category_summary(manager):

    results = manager.category_summary()

    if not results:

        print(
            "\nNo category data found."
        )

        return

    print(
        "\n========== CATEGORY SUMMARY =========="
    )

    for category, total in results:

        print(
            f"{category:<20} : {total} task(s)"
        )


# ==========================================
# HAVING REPORT
# ==========================================

def show_categories_with_multiple_tasks(
    manager
):

    results = (
        manager.categories_with_multiple_tasks()
    )

    if not results:

        print(
            "\nNo categories have 2 or more tasks."
        )

        return

    print(
        "\n===== CATEGORIES WITH 2+ TASKS ====="
    )

    for category, total in results:

        print(
            f"{category:<20} : {total} task(s)"
        )


# ==========================================
# MAIN MENU
# ==========================================

def main():

    manager = TaskManager()

    while True:

        print("\n")
        print("==============================")
        print("         TASK MANAGER")
        print("==============================")

        print("1. Add Task")
        print("2. View Tasks")
        print("3. Update Task")
        print("4. Delete Task")
        print("5. Complete Task")
        print("6. View Tasks by Category")
        print("7. Category Summary")
        print("8. Categories with 2+ Tasks")
        print("9. Export Tasks to JSON")
        print("10. Exit")

        print("==============================")

        choice = input(
            "Enter your choice: "
        ).strip()

        # ----------------------------------
        # ADD
        # ----------------------------------

        if choice == "1":

            add_task(manager)

        # ----------------------------------
        # VIEW
        # ----------------------------------

        elif choice == "2":

            tasks = manager.view_tasks()

            display_tasks(tasks)

        # ----------------------------------
        # UPDATE
        # ----------------------------------

        elif choice == "3":

            update_task(manager)

        # ----------------------------------
        # DELETE
        # ----------------------------------

        elif choice == "4":

            delete_task(manager)

        # ----------------------------------
        # COMPLETE
        # ----------------------------------

        elif choice == "5":

            complete_task(manager)

        # ----------------------------------
        # VIEW BY CATEGORY
        # ----------------------------------

        elif choice == "6":

            view_tasks_by_category(manager)

        # ----------------------------------
        # CATEGORY SUMMARY
        # ----------------------------------

        elif choice == "7":

            show_category_summary(manager)

        # ----------------------------------
        # HAVING
        # ----------------------------------

        elif choice == "8":

            show_categories_with_multiple_tasks(
                manager
            )

        # ----------------------------------
        # JSON
        # ----------------------------------

        elif choice == "9":

            exported = (
                manager.export_to_json()
            )

            if exported:

                print(
                    "\nTasks exported successfully "
                    "to tasks.json!"
                )

        # ----------------------------------
        # EXIT
        # ----------------------------------

        elif choice == "10":

            print(
                "\nThank you for using "
                "Task Manager!"
            )

            break

        # ----------------------------------
        # INVALID
        # ----------------------------------

        else:

            print(
                "\nInvalid choice. "
                "Please enter a number "
                "between 1 and 10."
            )


# ==========================================
# PROGRAM START
# ==========================================

if __name__ == "__main__":
    main()