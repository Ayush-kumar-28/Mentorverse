import React, { useEffect, useRef } from 'react';

// Declare the JitsiMeetExternalAPI constructor to avoid TypeScript errors
// as it's loaded from a script tag and not a module.
declare var JitsiMeetExternalAPI: any;

interface VideoCallPageProps {
  roomName: string;
  onEndCall: () => void;
}

export const VideoCallPage: React.FC<VideoCallPageProps> = ({ roomName, onEndCall }) => {
    const jitsiContainerRef = useRef<HTMLDivElement>(null);
    const jitsiApiRef = useRef<any>(null);

    useEffect(() => {
        // Ensure the container is ready and Jitsi API script is loaded.
        if (jitsiContainerRef.current && typeof JitsiMeetExternalAPI !== 'undefined') {
            const domain = 'meet.jit.si';
            
            const options = {
                roomName: roomName,
                width: '100%',
                height: '100%',
                parentNode: jitsiContainerRef.current,
                configOverwrite: {
                    // Disables the pre-join page for a smoother, quicker entry into the call.
                    prejoinPageEnabled: false,
                },
                interfaceConfigOverwrite: {
                    // Hides Jitsi's branding to give a more integrated feel.
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    SHOW_BRAND_WATERMARK: false,
                    // Hide the chrome extension banner
                    SHOW_CHROME_EXTENSION_BANNER: false,
                },
            };

            const api = new JitsiMeetExternalAPI(domain, options);
            jitsiApiRef.current = api;
            
            // Add a listener to automatically handle the user leaving the call.
            // When the local user clicks the 'hangup' button in the Jitsi interface, 
            // this event is fired, triggering our onEndCall logic.
            api.addEventListener('videoConferenceLeft', () => {
                // Ensure cleanup and state transition happens only once.
                if (jitsiApiRef.current) {
                    jitsiApiRef.current.dispose();
                    jitsiApiRef.current = null;
                    onEndCall();
                }
            });
        }

        // Cleanup function to be called when the component unmounts.
        // This is crucial for preventing memory leaks.
        return () => {
            if (jitsiApiRef.current) {
                jitsiApiRef.current.dispose();
                jitsiApiRef.current = null;
            }
        };
        // The effect should re-run if the room name changes or the onEndCall function reference changes.
    }, [roomName, onEndCall]);
    
    return (
        // This container will expand to fill the available space provided by its parent in App.tsx.
        // The Jitsi iframe will be rendered inside this div.
        <div ref={jitsiContainerRef} className="h-full w-full animate-fade-in" />
    );
};