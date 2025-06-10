import axios from "axios";
import { Task } from "./types";

const API_URL = "http://localhost:8080/tasks";

export const getTasks = () => axios.get<Task[]>(API_URL);
export const createTask = (task: Omit<Task, "id" | "taskExecutions">) => axios.post(API_URL, task);
export const deleteTask = (id: string) => axios.delete(`${API_URL}/${id}`);
export const searchTasks = (name: string) => axios.get<Task[]>(`${API_URL}/search?name=${name}`);
export const executeTask = (id: string) => axios.put(`${API_URL}/${id}/execute`);
