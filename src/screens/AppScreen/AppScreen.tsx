import React, { useCallback } from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { APP_CONSTS, WEBVIEW_CONSTS } from '@constants';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenRouteParamList } from '@screens';
import {
  useAppStateActiveEffect,
  useAsyncEffect,
  useFirebaseMessage,
  useWebView,
} from '@hooks';
import { FcmTokenStorage, requestCameraPermission } from '@tools';

const AppScreen: React.FC<AppScreenProps> = ({ route }) => {
  const { url = '/' } = route.params;
  const WEBVIEW_URL = APP_CONSTS.WEB_VIEW_URL + url;
  const { ref, onMessage, postMessage, injectCookieScript, tokens } =
    useWebView();

  const { registerOrUpdatePushToken, hasPermission, requestPermissionIfNot } =
    useFirebaseMessage();

  const syncPushNotiPermission = useCallback(async () => {
    hasPermission().then(async (enabled) => {
      postMessage('SET_NOTI_PERMISSION', { value: enabled });
      const { fcmToken: pushToken } = await FcmTokenStorage.getToken();
      if (enabled) {
        // 중복 호출을 막기 위해 storage에 pushToken이 없을 때만 호출
        // TODO: 만약 서버 DB에 deprecated된 토큰이 많이 생겨 문제 발생시 이 부분 수정 필요
        // if (pushToken) return;
        return await registerOrUpdatePushToken(true);
      } else {
        return await registerOrUpdatePushToken(false);
      }
    });
  }, []);

  // 푸시 권한 허용 변경 후 다시 앱으로 돌아왔을 때
  useAppStateActiveEffect(syncPushNotiPermission);
  useAsyncEffect(syncPushNotiPermission, []);

  useAsyncEffect(async () => {
    await requestPermissionIfNot();
  }, []);

  useAsyncEffect(async () => {
    // 안드로이드의 경우 처음 로드 이후 로그인 성공시 카메라 권한 최초 요청
    // 로그인 성공 여부는 쿠키 존재 여부로 판단
    const isLoggedIn = !!tokens.access_token && !!tokens.csrftoken;
    if (Platform.OS === 'android' && isLoggedIn) {
      await requestCameraPermission();
    }
  }, [tokens]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <WebView
        ref={ref}
        onMessage={onMessage}
        source={{
          uri: WEBVIEW_URL,
        }}
        injectedJavaScriptBeforeContentLoaded={injectCookieScript(
          tokens.csrftoken,
          tokens.access_token,
        )}
        allowsBackForwardNavigationGestures
        decelerationRate="normal"
        javaScriptEnabled
        injectedJavaScript={WEBVIEW_CONSTS.WEB_VIEW_DEBUGGING_SCRIPT}
        originWhitelist={['*']}
        scalesPageToFit={false}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        mediaPlaybackRequiresUserAction={false}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        domStorageEnabled
        onLoadEnd={async () => {
          syncPushNotiPermission();
        }}
        onContentProcessDidTerminate={() => {
          ref.current?.reload();
        }}
        cacheEnabled={false}
        incognito={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

type AppScreenProps = NativeStackScreenProps<ScreenRouteParamList, 'AppScreen'>;

export type AppScreenRoute = {
  AppScreen: {
    url: string | null;
  };
};

export default AppScreen;
