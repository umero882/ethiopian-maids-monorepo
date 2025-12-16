/**
 * Message Entity
 *
 * Represents a message in a conversation between users.
 * Messages are immutable once sent.
 */

export interface MessageProps {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'system';
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  metadata: Record<string, any>;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: MessageProps) {
    this.id = props.id;
    this.conversationId = props.conversationId;
    this.senderId = props.senderId;
    this.recipientId = props.recipientId;
    this.content = props.content;
    this.messageType = props.messageType || 'text';
    this.metadata = props.metadata || {};
    this.isRead = props.isRead;
    this.readAt = props.readAt || null;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim() === '') {
      throw new Error('Message ID is required');
    }
    if (!this.conversationId || this.conversationId.trim() === '') {
      throw new Error('Conversation ID is required');
    }
    if (!this.senderId || this.senderId.trim() === '') {
      throw new Error('Sender ID is required');
    }
    if (!this.recipientId || this.recipientId.trim() === '') {
      throw new Error('Recipient ID is required');
    }
    if (!this.content || this.content.trim() === '') {
      throw new Error('Message content is required');
    }
  }

  /**
   * Mark message as read
   */
  markAsRead(): void {
    if (this.isRead) {
      throw new Error('Message is already marked as read');
    }

    this.isRead = true;
    this.readAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Check if message is from a specific user
   */
  isFromUser(userId: string): boolean {
    return this.senderId === userId;
  }

  /**
   * Check if message is for a specific user
   */
  isForUser(userId: string): boolean {
    return this.recipientId === userId;
  }

  /**
   * Check if message is a system message
   */
  isSystemMessage(): boolean {
    return this.messageType === 'system';
  }

  /**
   * Create a new message
   */
  static create(props: Omit<MessageProps, 'id' | 'createdAt' | 'updatedAt'>): Message {
    return new Message({
      ...props,
      id: crypto.randomUUID(),
      isRead: false,
      readAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
