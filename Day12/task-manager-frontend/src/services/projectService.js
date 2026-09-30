import api from "./api";

export async function getProjects() {
    const response = await api.get("/projects/");
    return response.data;
}

export async function getProject(projectId) {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
}

export async function createProject(projectData) {
    const response = await api.post("/projects/", projectData);
    return response.data;
}

export async function updateProject(projectId, projectData) {
    const response = await api.put(
        `/projects/${projectId}`,
        projectData
    );
    return response.data;
}

export async function uploadProjectImage(projectId, file) {
    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post(
        `/projects/${projectId}/image`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data;
}

export async function deleteProjectImage(projectId) {
    const response = await api.delete(`/projects/${projectId}/image`);
    return response.data;
}

export async function deleteProject(projectId) {
    await api.delete(`/projects/${projectId}`);
}
