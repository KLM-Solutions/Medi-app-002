import { Alert, Platform } from 'react-native';

interface ShowAlertProps {
  title: string;
  message: string;
  onClose?: () => void;
}

// Store the web alert state and callback
let webAlertState = {
  setVisible: (value: boolean) => {},
  setTitle: (value: string) => {},
  setMessage: (value: string) => {},
  setCallback: (cb: (() => void) | undefined) => {},
};

export const setWebAlertState = (state: typeof webAlertState) => {
  webAlertState = state;
};

export const showAlert = ({ title, message, onClose }: ShowAlertProps) => {
  if (Platform.OS === 'web') {
    webAlertState.setTitle(title);
    webAlertState.setMessage(message);
    webAlertState.setCallback(onClose);
    webAlertState.setVisible(true);
  } else {
    Alert.alert(title, message, [{ text: 'OK', onPress: onClose }]);
  }
};