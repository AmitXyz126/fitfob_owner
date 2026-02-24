import { forwardRef, ReactNode } from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

type ButtonProps = {
  title: string;
  variant?: 'primary' | 'secondary';
  icon?: ReactNode;  
} & TouchableOpacityProps;

export const Button = forwardRef<View, ButtonProps>(
  ({ title, variant = 'primary', icon, ...touchableProps }, ref) => {
    
    const isDisabled = touchableProps.disabled;
    const isSecondary = variant === 'secondary';

    return (
      <TouchableOpacity
        ref={ref}
        activeOpacity={0.7}
        {...touchableProps} 
         className={`flex-row items-center justify-center rounded-2xl p-4 w-full ${
          isDisabled 
            ? 'bg-[#E5E7EB]' 
            : isSecondary 
              ? 'bg-slate-50 border border-slate-100' 
              : 'bg-[#F6163C]'
        } ${touchableProps.className}`}
      >
         {icon && (
          <View className="mr-2">
            {icon}
          </View>
        )}

        <Text className={`text-center font-bold text-base ${
          isDisabled || isSecondary ? 'text-slate-400' : 'text-white'
        }`}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';