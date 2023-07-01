import { useNavigation } from '@hooks';
import { TokenStorage, redirectSetting } from '@tools';
import { useCallback, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { WebViewMessageEvent, WebView } from 'react-native-webview';
import { WebViewProgressEvent } from 'react-native-webview/lib/WebViewTypes';
import { ScreenRouteParamList } from '@screens';

const useWebView = () => {
  const [loadProgress, setLoadProgress] = useState(0);
  const ref = useRef<WebView>(null);
  const navigation = useNavigation(); // useNavigation 훅을 사용하여 navigation 객체를 가져옴

  const postMessage = useCallback((key: string, data: any) => {
    ref.current?.postMessage(JSON.stringify({ key, data }));
  }, []);

  /**
   * 웹뷰에서 오는 요청 처리
   */
  const onMessage = useCallback(async (event: WebViewMessageEvent) => {
    const data = JSON.parse(event.nativeEvent.data);
    console.log(data);
    if (!('actionType' in data)) return;

    switch (data.actionType) {
      case 'CONSOLE':
        console.log('[WEBVIEW CONSOLE]', data.data);
        return;
      case 'OPEN_BROWSER':
        //TODO(Gina): 나중에 가능하다면 openBrowserAsync 사용해보기
        await Linking.openURL(data.url);
        return;
      case 'SET_TOKEN':
        const { refresh = '', access = '' } = data.token;
        await TokenStorage.setToken({
          refresh,
          access,
        });
        return;
      case 'REMOVE_TOKEN': {
        await TokenStorage.removeToken();
        return;
      }
      case 'NAVIGATE': {
        if (!data.screenName) return;
        return navigation.navigate(
          data.screenName as keyof ScreenRouteParamList,
          { ...data.params },
        );
      }
      case 'OPEN_SETTING':
        return redirectSetting();
      default:
        return;
    }
  }, []);

  const onLoadProgress = useCallback((e: WebViewProgressEvent) => {
    setLoadProgress(e.nativeEvent.progress);
  }, []);

  return {
    ref,
    loadProgress,
    onMessage,
    onLoadProgress,
    postMessage,
  };
};

export default useWebView;
