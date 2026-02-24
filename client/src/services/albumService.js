import api from './api';

export const albumService = {
    // Get all albums
    getAll: async () => {
        const response = await api.get('/albums');
        return response.data;
    },

    // Get single album with photos
    getOne: async (id) => {
        const response = await api.get(`/albums/${id}`);
        return response.data;
    },

    // Create album
    create: async (albumData) => {
        const response = await api.post('/albums', albumData);
        return response.data;
    },

    // Delete album
    delete: async (id) => {
        const response = await api.delete(`/albums/${id}`);
        return response.data;
    }
};