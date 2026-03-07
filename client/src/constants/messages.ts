export const MESSAGES = {
    // Success
    UPLOAD_SUCCESS: "Audio uploaded successfully!",
    UPDATE_SUCCESS: "Audio updated successfully!",
    DELETE_SUCCESS: "Audio deleted.",

    // Errors
    UPLOAD_ERROR: "Failed to upload audio. Please try again.",
    UPDATE_ERROR: "Failed to update audio. Please try again.",
    DELETE_ERROR: "Failed to delete audio. Please try again.",
    FETCH_ERROR: "Could not load audios. Check your connection.",

    // Validation
    NAME_REQUIRED: "Name is required.",
    IMAGE_REQUIRED: "Please select a photo for this person.",
    AUDIO_REQUIRED: "Please select an audio file.",

    // UI
    CONFIRM_DELETE: "This will permanently delete the clip and all its files.",
    EMPTY_STATE: "No comedy clips yet. Be the first to add one!",
    LOADING: "Loading clips...",
} as const;
