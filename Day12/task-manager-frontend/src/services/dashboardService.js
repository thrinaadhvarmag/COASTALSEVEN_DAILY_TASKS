import api from "./api";

export async function getDashboardSummary() {
    const response = await api.get("/dashboard/");
    return response.data;
}
