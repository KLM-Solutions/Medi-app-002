import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { colors } from '@/constants/colors';

export interface FormattedTextProps {
  text: string;
  style?: TextStyle;
  boldStyle?: TextStyle;
  highlightStyle?: TextStyle;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ 
  text,
  style,
  boldStyle,
  highlightStyle
}) => {
  // Split the text into lines
  const lines = text.split('\n');
  
  return (
    <Text style={[styles.text, style]}>
      {lines.map((line, index) => {
        // Check for lines with colons (like "Category: Healthy")
        if (line.includes(':') && !line.trim().startsWith('•')) {
          const [header, content] = line.split(':', 2);
          return (
            <Text key={index}>
              <Text style={[styles.boldText, highlightStyle || boldStyle]}>{header}:</Text>
              <Text>{content || ''}</Text>
              {'\n\n'}
            </Text>
          );
        }
        // Check for bullet points
        else if (line.trim().startsWith('•')) {
          return (
            <Text key={index}>
              <Text style={[styles.boldText, highlightStyle || boldStyle]}>• </Text>
              <Text>{line.trim().substring(1).trim()}</Text>
              {'\n'}
            </Text>
          );
        }
        // Check for manual bold markers
        else if (line.includes('**')) {
          const parts = line.split(/(\*\*.*?\*\*)/g);
          return (
            <Text key={index}>
              {parts.map((part, partIndex) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <Text key={partIndex} style={[styles.boldText, boldStyle]}>
                      {part.slice(2, -2)}
                    </Text>
                  );
                }
                return part;
              })}
              {'\n'}
            </Text>
          );
        }
        // Regular text
        else {
          return (
            <Text key={index}>
              {line}
              {'\n'}
            </Text>
          );
        }
      })}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    textAlign: 'justify',
  },
  boldText: {
    fontWeight: 'bold',
  },
}); 