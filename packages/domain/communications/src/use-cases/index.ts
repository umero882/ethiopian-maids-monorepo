/**
 * Communications Use Cases
 *
 * These represent all the operations that can be performed on messages and notifications.
 * Each use case is a single business operation with clear input and output.
 */

// Message Use Cases
export { SendMessageUseCase } from './SendMessage.js';
export { GetConversationUseCase } from './GetConversation.js';
export { GetUserConversationsUseCase } from './GetUserConversations.js';
export { MarkMessageAsReadUseCase } from './MarkMessageAsRead.js';
export { MarkConversationAsReadUseCase } from './MarkConversationAsRead.js';
export { DeleteMessageUseCase } from './DeleteMessage.js';

// Notification Use Cases
export { CreateNotificationUseCase } from './CreateNotification.js';
export { GetUserNotificationsUseCase } from './GetUserNotifications.js';
export { MarkNotificationAsReadUseCase } from './MarkNotificationAsRead.js';
export { MarkAllNotificationsAsReadUseCase } from './MarkAllNotificationsAsRead.js';
export { DeleteNotificationUseCase } from './DeleteNotification.js';
export { GetUnreadCountUseCase } from './GetUnreadCount.js';
