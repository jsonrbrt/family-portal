import api from './api';

export const documentService = {
    // Get all documents
    getAll: async (params = {}) => {
        const response = await api.get('./documents', { params });
        return response.data;
    },

    // Get single document
    getOne: async(id) => {
        const response = await api.get(`/docuuments/${id}`);
        return response.data;
    },

    // Upload document
    upload: async(formData) => {
        const response = await api.post('documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    // Delete document
    delete: async(id) => {
        const response = await api.delete(`/documents/${id}`);
        return response.data;
    }
};