import api from "./api";

export async function loginUser(email, password) {
    const response = await api.post("/auth/login", {
        email,
        password,
    });

    const { access_token, token_type } = response.data;

    localStorage.setItem("access_token", access_token);
    localStorage.setItem("token_type", token_type);

    return response.data;
}

export async function registerUser(username, email, password) {
    const response = await api.post("/auth/register", {
        username,
        email,
        password,
    });

    return response.data;
}

export async function getCurrentUser() {
    const response = await api.get("/auth/me");
    return response.data;
}

export async function getAllUsers() {
    const response = await api.get("/auth/users");
    return response.data;
}

export async function getAdminSummary() {
    const response = await api.get("/auth/admin-only");
    return response.data;
}

export function logoutUser() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
}

export function getAccessToken() {
    return localStorage.getItem("access_token");
}

export function isAuthenticated() {
    return Boolean(getAccessToken());
}

export async function updateCurrentUser(profileData) {
    const response = await api.put("/auth/me", profileData);
    return response.data;
}


export async function uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post(
        "/auth/me/profile-picture",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data;
}

export async function deleteProfilePicture() {
    const response = await api.delete("/auth/me/profile-picture");
    return response.data;
}
