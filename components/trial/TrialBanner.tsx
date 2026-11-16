import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface TrialBannerProps {
  isTrialEnabled: boolean;
  dailyTrialLimit: number;
  onToggle: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  isUpdating?: boolean;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({
  isTrialEnabled,
  dailyTrialLimit,
  onToggle,
  onIncrement,
  onDecrement,
  isUpdating = false,
}) => {
  return (
    <View style={styles.cardWrapper}>
      <LinearGradient
        colors={['#FF3B56', '#EF1D43', '#E11D48']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}>
        {/* Top Row: Title & Switch */}
        <View style={styles.topRow}>
          <View style={styles.titleWrapper}>
            <Text style={styles.titleText}>Accept free trials</Text>
            <Text style={styles.subtitleText}>
              Visible to customers in the Fitfob app
            </Text>
          </View>

          <Switch
            value={isTrialEnabled}
            onValueChange={onToggle}
            disabled={isUpdating}
            trackColor={{ false: '#FDA4AF', true: '#FFFFFF' }}
            thumbColor={isTrialEnabled ? '#E23744' : '#FFFFFF'}
            ios_backgroundColor="rgba(255,255,255,0.4)"
          />
        </View>

        {/* Counter Widget */}
        <View style={styles.counterContainer}>
          {/* Decrement Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onDecrement}
            disabled={dailyTrialLimit <= 0 || isUpdating}
            style={[
              styles.counterButton,
              dailyTrialLimit <= 0 && styles.disabledButton,
            ]}>
            <Ionicons name="remove" size={20} color="#E23744" />
          </TouchableOpacity>

          {/* Number & Label */}
          <View style={styles.counterCenter}>
            <Text style={styles.counterNumber}>{dailyTrialLimit}</Text>
            <Text style={styles.counterLabel}>slots per day</Text>
          </View>

          {/* Increment Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onIncrement}
            disabled={isUpdating}
            style={styles.counterButton}>
            <Ionicons name="add" size={20} color="#E23744" />
          </TouchableOpacity>
        </View>

        {/* Footnote text */}
        <Text style={styles.footnoteText}>
          Busy floor? Lower today's slots. New bookings move to the next open day.
        </Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#E23744',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  gradientCard: {
    padding: 20,
    borderRadius: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrapper: {
    flex: 1,
    marginRight: 12,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.88)',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginVertical: 16,
  },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  counterCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-Bold',
    lineHeight: 32,
  },
  counterLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.92)',
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 2,
  },
  footnoteText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'PlusJakartaSans-Regular',
    lineHeight: 17,
  },
});
