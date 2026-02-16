import { SafeAreaView } from "react-native-safe-area-context";
import { ViewStyle } from "react-native";

interface ContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;  
}

export const Container = ({ children, style }: ContainerProps) => {
  return (
    <SafeAreaView 
      className={styles.container} 
      style={style} 
    >
      {children}
    </SafeAreaView>
  );
};

const styles = {
   container: 'flex flex-1 px-6 pb-5 ios:pb-1 bg-[#FFF]',
};