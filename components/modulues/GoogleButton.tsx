import React from "react";
import { TouchableOpacity, Text, Image, ActivityIndicator, StyleSheet, View } from "react-native";


interface GoogleButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  text?: string;
  disabled?: boolean;
}

export default function GoogleButton({
  onPress,
  isLoading = false,
  text = "Continue with Google",
  disabled = false,
}: GoogleButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, (disabled || isLoading) && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={'#111111'} size="small" />
      ) : (
        <View style={styles.content}>
          <Image
            source={require("../../assets/images/Google.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.text}>{text}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    height: 48,
  },
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: "#F5F5F5",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  text: {
    color: "#1F2937",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
});
