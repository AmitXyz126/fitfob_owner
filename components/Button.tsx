import { forwardRef } from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

type ButtonProps = {
  title: string;
} & TouchableOpacityProps;

export const Button = forwardRef<View, ButtonProps>(({ title, ...touchableProps }, ref) => {
 
  const isDisabled = touchableProps.disabled;

  return (
    <TouchableOpacity
      ref={ref}
      activeOpacity={0.8}
      {...touchableProps}
 
      className={`items-center justify-center rounded-2xl p-4 ${
        isDisabled ? 'bg-[#E5E7EB] ' : 'bg-[#F6163C]'
      } ${touchableProps.className}`}>
      <Text className="text-center font-bold text-base text-white">{title}</Text>
    </TouchableOpacity>
  );
});

Button.displayName = 'Button';
