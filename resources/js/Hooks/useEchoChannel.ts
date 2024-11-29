import { useEffect } from 'react';

interface WebSocketEvents {
    [key: string]: (data: any) => void;
}

const useEchoChannel = (channel: string, events: WebSocketEvents) => {
    useEffect(() => {
        // Subscribe to the channel
        const channelInstance = window.Echo.join(channel);

        // Register event handlers
        Object.entries(events).forEach(([event, handler]) => {
            channelInstance.listen(`.${event}`, handler);
        });

        // Handle presence events if needed
        channelInstance.here((users: any[]) => {
            console.log('Users currently in the channel:', users);
        });

        channelInstance.joining((user: any) => {
            console.log('User joined:', user);
        });

        channelInstance.leaving((user: any) => {
            console.log('User left:', user);
        });

        // Cleanup on unmount
        return () => {
            window.Echo.leave(channel);
        };
    }, [channel, events]);
};

export default useEchoChannel;
