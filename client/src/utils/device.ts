const DEVICE_ID_KEY = "kalikalam_device_id";
const UNLOCKED_KEY = "kalikalam_unlocked_ids";

export const getDeviceId = (): string => {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
};

export const getUnlockedIds = (): string[] => {
    const data = localStorage.getItem(UNLOCKED_KEY);
    return data ? JSON.parse(data) : [];
};

export const markAsUnlocked = (id: string) => {
    const ids = getUnlockedIds();
    if (!ids.includes(id)) {
        localStorage.setItem(UNLOCKED_KEY, JSON.stringify([...ids, id]));
    }
};
