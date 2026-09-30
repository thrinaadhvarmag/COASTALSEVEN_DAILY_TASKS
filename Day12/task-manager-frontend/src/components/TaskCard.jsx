import { Link } from "react-router-dom";

function TaskCard({ task, onDelete }) {
    return (
        <article className="card task-card">
            <div className="task-card-top">
                <div>
                    <h3>{task.title}</h3>
                    <p className="muted">Task #{task.id}</p>
                </div>
                <span className={`badge badge-${task.status.toLowerCase().replaceAll(" ", "-")}`}>
                    {task.status}
                </span>
            </div>

            {task.description && (
                <p className="task-description">{task.description}</p>
            )}

            <div className="task-meta">
                <span>Task ID: <strong>#{task.id}</strong></span>
                <span>Priority: <strong>{task.priority}</strong></span>
                <span>Project: <strong>#{task.project_id}</strong></span>
                {task.assignee_id && (
                    <span>Assignee ID: <strong>#{task.assignee_id}</strong></span>
                )}
                {task.due_date && (
                    <span>Due: <strong>{new Date(task.due_date).toLocaleString()}</strong></span>
                )}
            </div>

            <div className="card-actions">
                <Link className="button button-secondary" to={`/tasks/${task.id}`}>
                    View Task #{task.id}
                </Link>
                {onDelete && (
                    <button
                        className="button button-danger-outline"
                        onClick={() => onDelete(task.id)}
                    >
                        Delete
                    </button>
                )}
            </div>
        </article>
    );
}

export default TaskCard;
