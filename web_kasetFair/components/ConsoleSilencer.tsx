"use client";

import { useEffect } from "react";

export function ConsoleSilencer() {
    useEffect(() => {
        // Save original methods just in case (optional, but good practice if we needed to restore)
        // const originalLog = console.log;
        // const originalWarn = console.warn;
        // const originalError = console.error;

        // Override with empty functions
        console.log = () => { };
        console.warn = () => { };
        console.error = () => { };

        // Restore on unmount (optional, but usually we want it silenced permanently in this session)
        // return () => {
        //   console.log = originalLog;
        //   console.warn = originalWarn;
        //   console.error = originalError;
        // };
    }, []);

    return null;
}
