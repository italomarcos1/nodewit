export class UpdateNotificationService {
  notificationsRepository;

  constructor(notificationsRepository) {
    this.notificationsRepository = notificationsRepository;
  }

  async execute({ user_id, notification_id }) {
    const notification = await this.notificationsRepository.updateNotification({
      user_id, notification_id
    })

    if (!notification)
      throw Error("Erro ao atualizar notificação")

    return notification
  }
}
