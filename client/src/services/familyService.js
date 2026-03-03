import api from './api';

export const familyService = {
    // Get family info
    getMyFamily: async () => {
        const response = await api.get('families/my-family');
        return response.data;
    },

    // Join family with invite code
    joinFamily: async (inviteCode) => {
        const response = await api.post('families/join', { inviteCode });
        return response.data;
    },

    // Delete a family
    deleteFamily: async (id) => {
        const response = await api.delete(`families/${id}`);
        return response.data;
    }
};