import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidChannel,
  NotificationAndroid,
} from '@notifee/react-native';
import { APP_CONSTS } from '@constants';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

export const androidChannelId = async (): Promise<string> => {
  const channel: AndroidChannel = {
    id: 'WhoAmI Today',
    name: 'WhoAmI Today',
    vibration: true,
    visibility: AndroidVisibility.PUBLIC,
    importance: AndroidImportance.HIGH,
  };

  return await notifee.createChannel(channel);
};

export const getSettingsForAndroid = async (): Promise<NotificationAndroid> => {
  return {
    channelId: await androidChannelId(),
    pressAction: {
      id: 'default',
      launchActivity: 'default',
    },
    smallIcon: 'ic_launcher',
  };
};

export const displayNotification = async (
  message: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> => {
  const { notification, data } = message;

  if (!notification) return;
  const { title, body } = notification;

  if (data?.type === 'cancel') {
    const displayedNotifications = await notifee.getDisplayedNotifications();
    const noti = displayedNotifications.find(
      (noti) => noti.notification?.data?.tag === data.tag,
    );
    if (noti && noti.id) {
      return await notifee.cancelNotification(noti.id);
    }
    return;
  }

  await notifee.displayNotification({
    title,
    body,
    data,
    ...(APP_CONSTS.IS_ANDROID
      ? {
          android: await getSettingsForAndroid(),
        }
      : {}),
  });
};
