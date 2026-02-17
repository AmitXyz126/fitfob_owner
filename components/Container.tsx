import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { ViewStyle, Platform } from 'react-native';

interface ContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Container = ({ children, style }: ContainerProps) => {
  const edges: Edge[] =
    Platform.OS === 'android' ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right'];

  return (
    <SafeAreaView edges={edges} className={styles.container} style={style}>
      {children}
    </SafeAreaView>
  );
};

const styles = {
  container: 'flex flex-1 px-6 pb-5 ios:pb-1 bg-[#FFF]',
};
