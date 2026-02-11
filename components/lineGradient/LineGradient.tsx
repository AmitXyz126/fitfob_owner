import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const LineGradient = ({ isWhite = false }: { isWhite?: boolean }) => {
  // White color ki opacity 0.5 se badha kar 0.8 kar di hai taaki dark dikhe
  const colors = (isWhite 
    ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0)'] 
    : ['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']) as readonly [string, string, ...string[]];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.line}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 2, 
  },
  line: {
    width: '100%',
    height: 1.5,  
  },
});

export default LineGradient;