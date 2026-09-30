import { useEffect, useState } from "react";
import { getAllUsers } from "../../services/authService";

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getAllUsers()
            .then(setUsers)
            .catch((requestError) => setError(requestError.response?.data?.detail || "Admin access is required to view users."))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <div className="page-header"><div><span className="eyebrow">ADMIN</span><h1>Users</h1><p>GET /auth/users requires an admin account.</p></div></div>
            {error && <div className="alert alert-error">{error}</div>}
            {loading ? <div className="loading-state">Loading users...</div> : !error && <section className="card table-card"><div className="table-wrap"><table><thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Created</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td>#{user.id}</td><td>{user.username}</td><td>{user.email}</td><td><span className="role-pill">{user.role}</span></td><td>{new Date(user.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div></section>}
        </div>
    );
}

export default Users;
