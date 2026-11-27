import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminRoute({ children }) {
    const { userJson, isAdmin } = useAuth();
    if (!userJson) return <Navigate to="/register/sign-in" replace />
    if (!isAdmin) return <Navigate to="/Thomann" replace />
    return children;
};

export default AdminRoute;