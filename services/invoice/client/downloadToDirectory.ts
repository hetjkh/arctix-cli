// Variables
import { LOCAL_STORAGE_DOWNLOAD_DIRECTORY_KEY } from "@/lib/variables";

// Store directory handle in memory (session-based)
let directoryHandle: FileSystemDirectoryHandle | null = null;
let directoryHandlePromise: Promise<FileSystemDirectoryHandle | null> | null = null;

/**
 * Get or request directory handle for downloads
 * @param silent - If true, don't prompt user if no handle exists, just return null
 * @returns Promise<FileSystemDirectoryHandle | null>
 */
export async function getDownloadDirectory(silent: boolean = false): Promise<FileSystemDirectoryHandle | null> {
    if (typeof window === "undefined" || !("showDirectoryPicker" in window)) {
        return null;
    }

    // If we already have a handle in this session, return it
    if (directoryHandle) {
        return directoryHandle;
    }

    // If there's already a pending request, wait for it
    if (directoryHandlePromise) {
        return directoryHandlePromise;
    }

    // Check if user has a saved preference
    const saved = localStorage.getItem(LOCAL_STORAGE_DOWNLOAD_DIRECTORY_KEY);
    if (saved && !silent) {
        // Create a promise for the directory picker
        directoryHandlePromise = (async () => {
            try {
                // Request directory again (we can't persist the handle)
                // @ts-ignore - File System Access API types may not be available
                const handle = await window.showDirectoryPicker({
                    mode: "readwrite",
                });
                directoryHandle = handle;
                directoryHandlePromise = null;
                return handle;
            } catch (error: any) {
                directoryHandlePromise = null;
                // User cancelled - clear the preference
                if (error.name === "AbortError") {
                    localStorage.removeItem(LOCAL_STORAGE_DOWNLOAD_DIRECTORY_KEY);
                }
                return null;
            }
        })();
        return directoryHandlePromise;
    }

    return null;
}

/**
 * Save a file to the selected directory
 * @param blob - The file blob to save
 * @param filename - The filename
 * @returns Promise<boolean> - true if saved successfully, false otherwise
 */
export async function saveFileToDirectory(
    blob: Blob,
    filename: string
): Promise<boolean> {
    try {
        // Try to get directory handle (will prompt if preference exists)
        const handle = await getDownloadDirectory(false);
        
        if (!handle) {
            // No directory selected or user cancelled - fallback to default browser download
            return false;
        }

        // Create or get the file handle
        const fileHandle = await handle.getFileHandle(filename, { create: true });
        
        // Create a writable stream
        const writable = await fileHandle.createWritable();
        
        // Write the blob to the file
        await writable.write(blob);
        
        // Close the file
        await writable.close();
        
        return true;
    } catch (error) {
        console.error("Error saving file to directory:", error);
        // If error occurs, fallback to default download
        return false;
    }
}

/**
 * Set the directory handle directly (used by settings modal)
 * @param handle - The directory handle to set
 */
export function setDownloadDirectory(handle: FileSystemDirectoryHandle | null) {
    directoryHandle = handle;
    directoryHandlePromise = null;
}

/**
 * Clear the directory handle (for testing or reset)
 */
export function clearDirectoryHandle() {
    directoryHandle = null;
}

