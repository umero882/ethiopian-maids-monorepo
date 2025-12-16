/**
 * Notification Application Service
 * Wires all Notification use cases to GraphQL repository
 */

import { ApolloClient } from '@apollo/client';
import { GraphQLNotificationRepository } from '@ethio/infra-web-communications';
import {
  CreateNotificationUseCase,
  GetNotificationUseCase,
  GetUserNotificationsUseCase,
  GetUnreadNotificationsUseCase,
  MarkNotificationAsReadUseCase,
  MarkAllNotificationsAsReadUseCase,
  DeleteNotificationUseCase,
  DeleteAllReadNotificationsUseCase,
  SearchNotificationsUseCase,
  CreateNotificationDTO,
  SearchNotificationsDTO,
  Notification,
} from '@ethio/domain-communications';

export class NotificationService {
  private repository: GraphQLNotificationRepository;
  private createUseCase: CreateNotificationUseCase;
  private getUseCase: GetNotificationUseCase;
  private getUserNotificationsUseCase: GetUserNotificationsUseCase;
  private getUnreadUseCase: GetUnreadNotificationsUseCase;
  private markAsReadUseCase: MarkNotificationAsReadUseCase;
  private markAllReadUseCase: MarkAllNotificationsAsReadUseCase;
  private deleteUseCase: DeleteNotificationUseCase;
  private deleteAllReadUseCase: DeleteAllReadNotificationsUseCase;
  private searchUseCase: SearchNotificationsUseCase;

  constructor(apolloClient: ApolloClient<any>) {
    this.repository = new GraphQLNotificationRepository(apolloClient);

    // Initialize all use cases
    this.createUseCase = new CreateNotificationUseCase(this.repository);
    this.getUseCase = new GetNotificationUseCase(this.repository);
    this.getUserNotificationsUseCase = new GetUserNotificationsUseCase(this.repository);
    this.getUnreadUseCase = new GetUnreadNotificationsUseCase(this.repository);
    this.markAsReadUseCase = new MarkNotificationAsReadUseCase(this.repository);
    this.markAllReadUseCase = new MarkAllNotificationsAsReadUseCase(this.repository);
    this.deleteUseCase = new DeleteNotificationUseCase(this.repository);
    this.deleteAllReadUseCase = new DeleteAllReadNotificationsUseCase(this.repository);
    this.searchUseCase = new SearchNotificationsUseCase(this.repository);
  }

  async createNotification(dto: CreateNotificationDTO): Promise<Notification> {
    const result = await this.createUseCase.execute(dto);
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getNotification(id: string): Promise<Notification | null> {
    const result = await this.getUseCase.execute({ id });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getUserNotifications(userId: string, isRead?: boolean, limit?: number, offset?: number): Promise<Notification[]> {
    const result = await this.getUserNotificationsUseCase.execute({ userId, isRead, limit, offset });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getUnreadNotifications(userId: string, limit?: number): Promise<Notification[]> {
    const result = await this.getUnreadUseCase.execute({ userId, limit });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const result = await this.markAsReadUseCase.execute({ id });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const result = await this.markAllReadUseCase.execute({ userId });
    if (result.isFailure) {
      throw new Error(result.error);
    }
  }

  async deleteNotification(id: string): Promise<void> {
    const result = await this.deleteUseCase.execute({ id });
    if (result.isFailure) {
      throw new Error(result.error);
    }
  }

  async deleteAllReadNotifications(userId: string): Promise<void> {
    const result = await this.deleteAllReadUseCase.execute({ userId });
    if (result.isFailure) {
      throw new Error(result.error);
    }
  }

  async searchNotifications(dto: SearchNotificationsDTO): Promise<Notification[]> {
    const result = await this.searchUseCase.execute(dto);
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }
}
