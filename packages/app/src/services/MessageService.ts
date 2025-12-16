/**
 * Message Application Service
 * Wires all Message use cases to GraphQL repository
 */

import { ApolloClient } from '@apollo/client';
import { GraphQLMessageRepository } from '@ethio/infra-web-communications';
import {
  SendMessageUseCase,
  GetMessageUseCase,
  GetConversationUseCase,
  GetUserConversationsUseCase,
  GetUnreadMessagesUseCase,
  MarkMessageAsReadUseCase,
  MarkConversationAsReadUseCase,
  DeleteMessageUseCase,
  SearchMessagesUseCase,
  SendMessageDTO,
  GetConversationDTO,
  SearchMessagesDTO,
  Message,
  ConversationSummary,
} from '@ethio/domain-communications';

export class MessageService {
  private repository: GraphQLMessageRepository;
  private sendUseCase: SendMessageUseCase;
  private getUseCase: GetMessageUseCase;
  private getConversationUseCase: GetConversationUseCase;
  private getUserConversationsUseCase: GetUserConversationsUseCase;
  private getUnreadUseCase: GetUnreadMessagesUseCase;
  private markAsReadUseCase: MarkMessageAsReadUseCase;
  private markConversationReadUseCase: MarkConversationAsReadUseCase;
  private deleteUseCase: DeleteMessageUseCase;
  private searchUseCase: SearchMessagesUseCase;

  constructor(apolloClient: ApolloClient<any>) {
    this.repository = new GraphQLMessageRepository(apolloClient);

    // Initialize all use cases
    this.sendUseCase = new SendMessageUseCase(this.repository);
    this.getUseCase = new GetMessageUseCase(this.repository);
    this.getConversationUseCase = new GetConversationUseCase(this.repository);
    this.getUserConversationsUseCase = new GetUserConversationsUseCase(this.repository);
    this.getUnreadUseCase = new GetUnreadMessagesUseCase(this.repository);
    this.markAsReadUseCase = new MarkMessageAsReadUseCase(this.repository);
    this.markConversationReadUseCase = new MarkConversationAsReadUseCase(this.repository);
    this.deleteUseCase = new DeleteMessageUseCase(this.repository);
    this.searchUseCase = new SearchMessagesUseCase(this.repository);
  }

  async sendMessage(dto: SendMessageDTO): Promise<Message> {
    const result = await this.sendUseCase.execute(dto);
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getMessage(id: string): Promise<Message | null> {
    const result = await this.getUseCase.execute({ id });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getConversation(dto: GetConversationDTO): Promise<Message[]> {
    const result = await this.getConversationUseCase.execute(dto);
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getUserConversations(userId: string, limit?: number, offset?: number): Promise<ConversationSummary[]> {
    const result = await this.getUserConversationsUseCase.execute({ userId, limit, offset });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getUnreadMessages(userId: string, limit?: number): Promise<Message[]> {
    const result = await this.getUnreadUseCase.execute({ userId, limit });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async markMessageAsRead(id: string): Promise<Message> {
    const result = await this.markAsReadUseCase.execute({ id });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async markConversationAsRead(userId1: string, userId2: string): Promise<void> {
    const result = await this.markConversationReadUseCase.execute({ userId1, userId2 });
    if (result.isFailure) {
      throw new Error(result.error);
    }
  }

  async deleteMessage(id: string): Promise<void> {
    const result = await this.deleteUseCase.execute({ id });
    if (result.isFailure) {
      throw new Error(result.error);
    }
  }

  async searchMessages(dto: SearchMessagesDTO): Promise<Message[]> {
    const result = await this.searchUseCase.execute(dto);
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }
}
