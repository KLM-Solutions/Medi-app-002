import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Platform, ViewStyle, TextStyle } from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { FormattedText } from './FormattedText';

interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress: () => void;
}

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  buttons?: AlertButton[];
}

export function AlertModal({ visible, title, message, onClose, buttons }: AlertModalProps) {
  const defaultButtons: AlertButton[] = [
    { text: 'OK', style: 'default', onPress: onClose }
  ];

  const renderButtons = buttons || defaultButtons;

  const getButtonStyle = (style?: string): ViewStyle => {
    switch (style) {
      case 'destructive':
        return { backgroundColor: colors.danger };
      case 'cancel':
        return { backgroundColor: colors.border };
      default:
        return { backgroundColor: colors.primary };
    }
  };

  const getButtonTextStyle = (style?: string): TextStyle => {
    switch (style) {
      case 'cancel':
        return { color: colors.text };
      default:
        return { color: colors.background };
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.contentContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <X size={20} color={colors.text} />
              </Pressable>
            </View>
            
            <View style={styles.messageWrapper}>
              <View style={styles.messageContainer}>
                <FormattedText text={message} />
              </View>
            </View>
            
            <View style={styles.buttonContainer}>
              {renderButtons.map((button, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.button,
                    getButtonStyle(button.style)
                  ]}
                  onPress={button.onPress}
                >
                  <Text style={[
                    styles.buttonText,
                    getButtonTextStyle(button.style)
                  ]}>
                    {button.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  } as ViewStyle,
  modalContainer: {
    width: '100%',
    maxWidth: Platform.select({
      web: 400,
      default: 320
    }),
    backgroundColor: colors.background,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    ...Platform.select({
      web: {
        minWidth: 380,
        minHeight: 180
      },
      default: {}
    })
  } as ViewStyle,
  contentContainer: {
    padding: Platform.select({
      web: 24,
      default: 16
    }),
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Platform.select({
      web: 16,
      default: 12
    }),
  } as ViewStyle,
  title: {
    fontSize: Platform.select({
      web: 18,
      default: 16
    }),
    fontWeight: '600',
    color: colors.text,
  } as TextStyle,
  closeButton: {
    padding: 4,
  } as ViewStyle,
  messageWrapper: {
    marginBottom: Platform.select({
      web: 24,
      default: 16
    }),
  } as ViewStyle,
  messageContainer: {
    width: '100%',
  } as ViewStyle,
  message: {
    fontSize: Platform.select({
      web: 16,
      default: 14
    }),
    color: colors.text,
    lineHeight: Platform.select({
      web: 24,
      default: 20
    }),
  } as TextStyle,
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  } as ViewStyle,
  button: {
    paddingVertical: Platform.select({
      web: 10,
      default: 8
    }),
    paddingHorizontal: Platform.select({
      web: 20,
      default: 16
    }),
    borderRadius: 4,
    minWidth: Platform.select({
      web: 80,
      default: 64
    }),
  } as ViewStyle,
  buttonText: {
    fontSize: Platform.select({
      web: 15,
      default: 14
    }),
    fontWeight: '500',
    textAlign: 'center',
  } as TextStyle,
});