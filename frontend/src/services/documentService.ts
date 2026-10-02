import type { AppDocument, DocumentRequest, DocumentStatus, DocumentType, PageResponse } from '../types';
import { api, cleanParams } from './api';

export interface DocumentQuery {
  q?: string;
  type?: DocumentType;
  vehicleId?: number;
  driverId?: number;
  status?: DocumentStatus;
  page?: number;
  size?: number;
}

export const documentService = {
  list: (query: DocumentQuery = {}) =>
    api.get<PageResponse<AppDocument>>('/documents', { params: cleanParams(query) }).then((r) => r.data),
  create: (body: DocumentRequest) => api.post<AppDocument>('/documents', body).then((r) => r.data),
  update: (id: number, body: DocumentRequest) => api.put<AppDocument>(`/documents/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/documents/${id}`).then(() => undefined),
  uploadFile: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    // Let the browser set the multipart boundary.
    return api
      .post<AppDocument>(`/documents/${id}/file`, form, { headers: { 'Content-Type': undefined } })
      .then((r) => r.data);
  },
  /** Downloads through Axios so the login token is sent, then shows the file in a new tab. */
  async openFile(id: number): Promise<void> {
    const popup = window.open('', '_blank'); // opened first so the browser does not block it
    try {
      const response = await api.get<Blob>(`/documents/${id}/file`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      if (popup) popup.location.href = url;
      else window.open(url, '_blank');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      popup?.close();
      throw e;
    }
  },
};
