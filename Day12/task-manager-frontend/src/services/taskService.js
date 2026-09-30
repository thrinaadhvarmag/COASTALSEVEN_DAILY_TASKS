import api from "./api";
export async function getTasks(params={}){return(await api.get("/tasks/",{params})).data}
export async function getTask(taskId){return(await api.get(`/tasks/${taskId}`)).data}
export async function createTask(data){return(await api.post("/tasks/",data)).data}
export async function updateTask(taskId,data){return(await api.put(`/tasks/${taskId}`,data)).data}
export async function deleteTask(taskId){await api.delete(`/tasks/${taskId}`)}
export async function createChecklistItem(taskId,data){return(await api.post(`/tasks/${taskId}/checklist`,data)).data}
export async function getChecklist(taskId){return(await api.get(`/tasks/${taskId}/checklist`)).data}
export async function updateChecklistItem(taskId,itemId,data){return(await api.patch(`/tasks/${taskId}/checklist/${itemId}`,data)).data}
export async function deleteChecklistItem(taskId,itemId){await api.delete(`/tasks/${taskId}/checklist/${itemId}`)}
export async function uploadTaskAttachment(taskId,file,onUploadProgress){const data=new FormData();data.append("file",file);return(await api.post(`/tasks/${taskId}/attachments`,data,{headers:{"Content-Type":"multipart/form-data"},onUploadProgress})).data}
export async function getTaskAttachments(taskId){return(await api.get(`/tasks/${taskId}/attachments`)).data}
