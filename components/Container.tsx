import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { ViewStyle } from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface ContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Container = ({ children, style }: ContainerProps) => {
  const edges: Edge[] = ['top', 'left', 'right'];

  return (
    <SafeAreaView edges={edges} className={styles.container} style={style}>
      <StatusBar style="dark" animated />
      {children}
    </SafeAreaView>
  );
};

const styles = {
  container: 'flex flex-1 px-4 bg-[#FFF]',
};