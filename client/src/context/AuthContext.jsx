/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const authContext = createContext();

export const useAuth = () => useContext(authContext);

// Köhnə formatın (massiv) və tokensin qalıqların təmizlənməsi.
function readStoredUser() {
    try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("token");
        if (!user || !token || Array.isArray(user)) {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            return null;
        };
        return user;
    } catch {
        return null
    };
};

function AuthContext({ children }) {

    const [userJson , setUser] = useState(readStoredUser);
    const navigate = useNavigate();

    function login({ user, token }){
        localStorage.setItem("token" , token);
        localStorage.setItem("user" , JSON.stringify(user));
        setUser(user);
    };

    function logout() {
        navigate("/Thomann");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    };

    const isAdmin = userJson?.role === "ADMIN";

    return (
        <>
            <authContext.Provider value={{ userJson , isAdmin, login, logout}}>
                {children}
            </authContext.Provider>
        </>
    )
}

export default AuthContext
