import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
import { Container } from '@/components/Container';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { ResponseType } from 'expo-auth-session';
import { GoogleAuthProvider, FacebookAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Google Auth Request
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
   clientId: '1026944446347-4gpshovr4kn56afecqsevj7o0assovht.apps.googleusercontent.com', 
    iosClientId: '1026944446347-0cmronpk9hvtp7faf5dqcgsv84l2e9ns.apps.googleusercontent.com',
    androidClientId: '1026944446347-2bvmj2smroh6efc72m47kohegpoosloq.apps.googleusercontent.com',
  });

  // Facebook Auth Request
  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: '2349725998870415',
    responseType: ResponseType.Token,
  });

  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => {
           // Navigate or show success
           router.replace('/(tabs)'); // Assuming tabs is main
        })
        .catch((error) => {
           console.error("Google Sign-In Error", error);
           alert(error.message);
        });
    }
  }, [googleResponse]);

  React.useEffect(() => {
    if (fbResponse?.type === 'success') {
      const { access_token } = fbResponse.params;
      const credential = FacebookAuthProvider.credential(access_token);
      signInWithCredential(auth, credential)
        .then(() => {
           router.replace('/(tabs)');
        })
        .catch((error) => {
           console.error("Facebook Sign-In Error", error);
           alert(error.message);
        });
    }
  }, [fbResponse]);

  return (
    <Container>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        {/* Logo Section */}
        <View className="mt-12 items-center">
          <Image
            source={require('../../assets/images/Vector.png')}
            className="h-[54px] w-[54px]"
            resizeMode="contain"
          />
          <Text className="mt-6 font-bold text-4xl leading-4xl text-darkText">Get Started Now</Text>
          <Text className="mt-2 px-4 text-center font-medium text-sm leading-sm text-secondaryText">
            Create an account or log in to explore about our app
          </Text>
        </View>

        {/* Form Section */}
        <View className="mt-10 space-y-4">
          {/* Email Field */}
          <View>
            <Text className="mb-2 ml-1 font-sans text-sm leading-sm text-secondaryText">
              Email or Phone number
            </Text>
            <View className="h-14 justify-center rounded-2xl border border-border bg-white px-4 shadow-sm shadow-border">
              <TextInput
                placeholder="Email or Phone number"
                placeholderTextColor="text-darkText"
                className="h-full text-darkText"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Field */}
          <View>
            <Text className="mb-2 ml-1 mt-2 font-sans text-sm leading-sm text-secondaryText">
              Password
            </Text>
            <View className="h-14 flex-row items-center rounded-2xl border border-border bg-white px-4 shadow-sm shadow-border">
              <TextInput
                placeholder="*******"
                placeholderTextColor="text-darkText"
                secureTextEntry={!isPasswordVisible}
                className="h-full flex-1 text-darkText"
              />
              <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                <Ionicons
                  name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me & Forgot Password */}
          <View className="flex-row items-center justify-between pt-2">
            <TouchableOpacity
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
              className="flex-row items-center">
              <View
                className={`h-5 w-5 items-center justify-center rounded border ${
                  rememberMe ? 'border-primary bg-primary' : 'border-secondaryText bg-white'
                }`}>
                {rememberMe && <Ionicons name="checkmark" size={14} color="white" />}
              </View>
              <Text className="ml-2 text-sm text-secondaryText">Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text className="font-bold text-sm text-primary">Forgot Password ?</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Button */}
        <View className="mt-8">
          <Button className="rounded-xl" title="Log In" onPress={() => router.push('/(tabs)')} />
        </View>

        <View className="mb-6 mt-8 flex-row items-center px-4">
          {/* Left Line: Transparent to Black */}
          <LinearGradient
            colors={['rgba(0,0,0,0)', '#000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 1.5, flex: 1 }}
          />

          <Text className="mx-4 font-medium text-xs text-darkText">OR</Text>

          {/* Right Line: Black to Transparent */}
          <LinearGradient
            colors={['#000000', 'rgba(0,0,0,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 1.5, flex: 1 }}
          />
        </View>

        {/* Social Buttons */}
        <View className="flex-row justify-between">
          <TouchableOpacity 
            onPress={() => googlePromptAsync()}
            className="h-14 flex-[0.47] items-center justify-center rounded-2xl bg-[#F2F2F2]">
            <Image
              source={require('../../assets/images/Google.png')}
              className="h-6 w-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => fbPromptAsync()}
            className="h-14 flex-[0.47] items-center justify-center rounded-2xl bg-[#F2F2F2]">
            <Image
              source={require('../../assets/images/Facebook.png')}
              className="h-6 w-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Footer Link */}
        <View className="mb-6 flex-row justify-center py-6">
          <Text className="text-secondaryText">Don&apos;t have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/SignUp')}>
            <Text className="font-bold text-primary">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
}
