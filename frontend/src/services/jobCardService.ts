import { api } from "@/lib/api"
import type { AddPartRequest, JobCard, JobCardPart, JobCardRequest, JobCardStatus } from "@/types"

export const jobCardService = {
  getAll: () => api.get<JobCard[]>("/job-cards"),
  getById: (id: number) => api.get<JobCard>(`/job-cards/${id}`),
  create: (data: JobCardRequest) => api.post<JobCard>("/job-cards", data),
  update: (id: number, data: JobCardRequest) => api.put<JobCard>(`/job-cards/${id}`, data),
  updateTechnicalReport: (id: number, report: string) =>
    api.put<JobCard>(`/job-cards/${id}/technical-report`, { report }),
  updateWorkCompleted: (id: number, work: string) =>
    api.put<JobCard>(`/job-cards/${id}/work-completed`, { work }),
  updateStatus: (id: number, status: JobCardStatus) =>
    api.put<JobCard>(`/job-cards/${id}/status`, { status }),
  addPart: (id: number, data: AddPartRequest) => api.post<JobCardPart>(`/job-cards/${id}/parts`, data),
  getParts: (id: number) => api.get<JobCardPart[]>(`/job-cards/${id}/parts`),
}
