import { APP_CONSTS } from '../constants';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import LocalNotification from './LocalNotification';
import { Alert, Linking } from 'react-native';
import { redirectSetting } from '@tools';
import { TFunction } from 'i18next';

export default (() => {
  let isInitialized = false;
  let token: null | string = null;

  /**
   * getToken
   */
  const getToken = async () => {
    token = await messaging().getToken();
    return token;
  };

  /**
   * checkToken
   */
  const checkToken = async () => {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      console.log(`[FirebaseNotification] your token is ${fcmToken}`);
    }
  };

  /**
   * initialize
   */
  const initialize = async () => {
    if (isInitialized) return;

    if (!messaging().isDeviceRegisteredForRemoteMessages) {
      console.log('[FirebaseNotification] registerDeviceForRemoteMessages');
      messaging().registerDeviceForRemoteMessages();
    }

    messaging().onMessage(handleOnForegroundMessage);
    messaging().setBackgroundMessageHandler(handleOnBackgroundMessage);
  };

  /**
   * handleOnForegroundMessage
   * IOS: foreground인 경우에는 local noti를 복사해서 보여줘야 함
   * ANDROID: foreground인 경우에는 local noti를 복사해서 보여줘야 함
   */
  const handleOnForegroundMessage = async (
    event: FirebaseMessagingTypes.RemoteMessage,
  ) => {
    console.log('[FirebaseNotification] handle on foreground message', event);

    const { notification, data } = event;

    const granted = await LocalNotification.getIsNotificationGranted();
    if (!granted) return;

    if (!notification) return;
    const { body, title } = notification;

    return LocalNotification.immediate({
      title: title || '',
      body: body || '',
      data,
    });
  };

  /**
   * handleOnBackgroundMessage
   * IOS: background인 경우에는 local noti를 복사할 필요 없음
   * ANDROID: background인 경우에는 local noti를 복사할 필요 없음
   */
  const handleOnBackgroundMessage = async (
    event: FirebaseMessagingTypes.RemoteMessage,
  ) => {
    console.log('[FirebaseNotification] handle on background message', event);

    const { data } = event;

    const granted = await LocalNotification.getIsNotificationGranted();
    if (!granted) return;

    if (!data) return;
  };

  /**
   * getInitialNotification
   */
  const getInitialNotification = () => messaging().getInitialNotification();

  /**
   * getPermissionEnabled
   */
  const getPermissionEnabled = async () => {
    const permission = await messaging().requestPermission();
    const enabled =
      permission === messaging.AuthorizationStatus.AUTHORIZED ||
      permission === messaging.AuthorizationStatus.PROVISIONAL;
    return enabled;
  };

  /**
   * requestPermission
   */
  const requestPermission = async (t: TFunction) => {
    Alert.alert(String(t('title')), String(t('description')), [
      {
        text: String(t('close')),
        style: 'cancel',
      },
      {
        text: String(t('redirect_setting')),
        onPress: redirectSetting,
        style: 'default',
      },
    ]);
  };

  return {
    initialize,
    getToken,
    checkToken,
    getInitialNotification,
    requestPermission,
    getPermissionEnabled,
  };
})();
