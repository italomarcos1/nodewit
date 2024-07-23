export class FetchNotificationsByUserIdService {
  notificationsRepository;

  constructor(notificationsRepository) {
    this.notificationsRepository = notificationsRepository;
  }

  async execute(user_id) {
    const notifications = await this.notificationsRepository.findManyByUserId(user_id);
    
    return notifications;
  }
}
