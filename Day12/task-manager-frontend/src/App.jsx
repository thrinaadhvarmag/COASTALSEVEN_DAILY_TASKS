import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TaskDetails from "./pages/TaskDetails";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Tasks from "./pages/dashboard/Tasks";
import Projects from "./pages/dashboard/Projects";
import Profile from "./pages/dashboard/Profile";
import Reports from "./pages/dashboard/Reports";
import Users from "./pages/dashboard/Users";
import { ToastProvider } from "./components/ui/Toast";

function App() {
    return (
        <ToastProvider>
        <BrowserRouter>
            <Navbar />

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardLayout />}>
                        <Route index element={<Overview />} />
                        <Route path="tasks" element={<Tasks />} />
                        <Route path="projects" element={<Projects />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="reports" element={<Reports />} />
                        <Route path="users" element={<Users />} />
                    </Route>

                    <Route path="/tasks/:taskId" element={<TaskDetails />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
        </ToastProvider>
    );
}

export default App;
