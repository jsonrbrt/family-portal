import api from './api';

export const photoService = {
    // Get all photos
    getAll: async (params = {}) => {
        const response = await api.get('/photos', { params });
        return response.data;
    },

    // Get single photo
    getOne: async (id) => {
        const response = await api.get(`/photos/${id}`);
        return response.data;
    },

    // Upload photo
    upload: async (formData) => {
        const response = await api.post('/photos/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    // Delete photo
    delete: async (id) => {
        const response = await api.delete(`/photos/${id}`);
        return response.data;
    }
};