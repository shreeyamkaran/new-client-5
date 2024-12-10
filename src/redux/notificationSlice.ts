import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const fetchAllNotifications = createAsyncThunk("fetchAllNotifications", async (receiverId: number) => {
    const response = await fetchWithAuth(`http://localhost:8080/api/v1/notifications/${ receiverId }`);
    const data = await response.json();
    return data;
});

interface Notification {
    id: number,
    senderId: number,
    receiverId: number,
    subjectId: number,
    readStatus: boolean,
    title: String,
    description: String,
    taskId: number
}

interface NotificationState {
    notifications: Notification[],
    count: number,
    loading: boolean,
    error: boolean
}

const initialState: NotificationState = {
    notifications: [],
    count: 0,
    loading: false,
    error: false
}

export const notificationSlice = createSlice({
    name: "notification",
    initialState,
    reducers: {
        // Reducer to add a notification
        addNotification: (state, action) => {
            const notification = action.payload as Notification;
            state.notifications.push(notification);
            state.count += 1; // Increase the count as a new notification is added
        },
        removeNotification: (state, action) => {
            const notificationId = action.payload;
            state.notifications = state.notifications.filter(n => n.id != notificationId);
            state.count -= 1;
        }
    },
    extraReducers: (builder) => {
        builder.addCase(fetchAllNotifications.pending, (state, action) => {
            state.loading = true;
        });
        builder.addCase(fetchAllNotifications.fulfilled, (state, action) => {
            state.loading = false;
            state.error = false;
            const notifications = action.payload as Notification[];
            const filteredNotifications = notifications.filter(n => n.readStatus == false);
            state.notifications = filteredNotifications;
            state.count = filteredNotifications.length;
        });
        builder.addCase(fetchAllNotifications.rejected, (state, action) => {
            state.loading = false;
            state.error = true;
            console.log(action.payload);
        });
    }
});

export const { addNotification, removeNotification } = notificationSlice.actions;
export default notificationSlice.reducer;