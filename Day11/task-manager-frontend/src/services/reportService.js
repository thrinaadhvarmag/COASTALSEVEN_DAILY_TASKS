import api from "./api";

export async function generateReport() {
    const response = await api.post("/reports/generate");
    return response.data;
}
