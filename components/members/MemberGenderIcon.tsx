import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MemberGenderIconProps {
  gender?: string;
  size?: number;
  showBackground?: boolean;
}

/**
 * Reusable gender icon component that renders gender visually instead of text.
 */
export const MemberGenderIcon: React.FC<MemberGenderIconProps> = ({
  gender,
  size = 14,
  showBackground = true,
}) => {
  const clean = gender?.toLowerCase()?.trim() || '';

  let iconName: 'male' | 'female' | 'male-female' | 'person' = 'person';
  let iconColor = '#64748B';
  let bgColor = '#F1F5F9';

  if (clean === 'male') {
    iconName = 'male';
    iconColor = '#2563EB'; // Blue
    bgColor = '#EFF6FF';
  } else if (clean === 'female') {
    iconName = 'female';
    iconColor = '#DB2777'; // Pink
    bgColor = '#FDF2F8';
  } else if (clean === 'other' || clean === 'transgender') {
    iconName = 'male-female';
    iconColor = '#7C3AED'; // Purple
    bgColor = '#F5F3FF';
  }

  if (!showBackground) {
    return <Ionicons name={iconName} size={size} color={iconColor} />;
  }

  return (
    <View
      style={[
        styles.iconBadge,
        {
          backgroundColor: bgColor,
          borderColor: `${iconColor}20`,
          width: size + 10,
          height: size + 10,
          borderRadius: (size + 10) / 2,
        },
      ]}>
      <Ionicons name={iconName} size={size} color={iconColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  iconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
