import { useState, useEffect } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';

export function useGuestUser() {
    const { auth } = usePage().props as any;
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);

    useEffect(() => {
        // Try to reclaim guest session on mount
        const guestToken = localStorage.getItem('guest_token');
        if (guestToken && !auth.user) {
            reclaimGuestSession(guestToken);
        }
    }, []);

    const createGuestSession = async () => {
        try {
            const response = await axios.post(route('guest.create'));
            const { guest_token } = response.data;
            localStorage.setItem('guest_token', guest_token);
            return response.data.user;
        } catch (error) {
            console.error('Failed to create guest session:', error);
            return null;
        }
    };

    const reclaimGuestSession = async (token: string) => {
        try {
            const response = await axios.post(route('guest.reclaim'), {
                guest_token: token,
            });
            return response.data.user;
        } catch (error) {
            console.error('Failed to reclaim guest session:', error);
            localStorage.removeItem('guest_token');
            return null;
        }
    };

    const showConversionModal = () => {
        setIsGuestModalOpen(true);
    };

    const hideConversionModal = () => {
        setIsGuestModalOpen(false);
    };

    return {
        isGuestModalOpen,
        showConversionModal,
        hideConversionModal,
        createGuestSession,
        reclaimGuestSession,
    };
}
