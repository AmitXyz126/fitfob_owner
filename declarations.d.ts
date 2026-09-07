declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

declare module '@react-native-community/datetimepicker' {
  import React from 'react';
  import { ViewStyle } from 'react-native';

  export interface DateTimePickerEvent {
    type: 'set' | 'dismissed' | 'neutralButtonPressed';
    nativeEvent: {
      timestamp: number;
      utcOffset: number;
    };
  }

  export interface DateTimePickerProps {
    value: Date;
    mode?: 'date' | 'time' | 'datetime' | 'countdown';
    display?: 'default' | 'spinner' | 'clock' | 'calendar' | 'compact' | 'inline';
    onChange?: (event: DateTimePickerEvent, date?: Date) => void;
    is24Hour?: boolean;
    style?: ViewStyle;
    textColor?: string;
    accentColor?: string;
    minimumDate?: Date;
    maximumDate?: Date;
    [key: string]: any;
  }

  const DateTimePicker: React.ComponentType<DateTimePickerProps>;
  export default DateTimePicker;
}