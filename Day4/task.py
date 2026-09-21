class Task:

    def __init__(
        self,
        title,
        description,
        priority="Medium",
        task_id=None,
        status="Pending",
        created_at=None,
        category_id=None,
        category_name=None
    ):

        self.id = task_id
        self.title = title
        self.description = description
        self.status = status
        self.priority = priority
        self.created_at = created_at
        self.category_id = category_id
        self.category_name = category_name

    def complete(self):

        self.status = "Completed"