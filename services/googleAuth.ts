let GoogleSignin: any = null;
let googleStatusCodes: any = {};

try {
  const GoogleSigninModule = require("@react-native-google-signin/google-signin");
  GoogleSignin = GoogleSigninModule.GoogleSignin;
  googleStatusCodes = GoogleSigninModule.statusCodes;
} catch (e) {
  console.warn("Google Sign-In native module not available (expected in Expo Go).");
}

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";

// Configure Google Sign-In if available
if (GoogleSignin) {
  if (webClientId) {
    GoogleSignin.configure({
      webClientId,
      offlineAccess: true,
    });
  } else {
    console.warn(
      "Warning: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not configured. Google Sign-In calls will fail until configured."
    );
  }
}

export const googleAuthService = {
  /**
   * Triggers the native Google Sign-In flow and returns the ID Token.
   */
  signIn: async (): Promise<string> => {
    if (!GoogleSignin) {
      throw new Error(
        "Google Sign-In is not supported in Expo Go. Please test this feature using an Expo Development Build (run:android / run:ios)."
      );
    }

    if (!webClientId) {
      throw new Error(
        "Google Sign-In is misconfigured: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing in your environment (.env.local) file."
      );
    }

    try {
      // Configure on-demand if it wasn't configured at load time
      if (webClientId && !GoogleSignin.hasPlayServices()) {
        GoogleSignin.configure({ webClientId, offlineAccess: true });
      }

      // Force the account selection screen to show by signing out of local session first
      try {
        await GoogleSignin.signOut();
      } catch (err) {
        // Ignore if user was not logged in
      }

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      
      const idToken = (userInfo as any).data?.idToken || (userInfo as any).idToken;

      if (!idToken) {
        throw new Error("No ID Token obtained from Google.");
      }

      return idToken;
    } catch (error: any) {
      if (error.code === googleStatusCodes.SIGN_IN_CANCELLED) {
        throw new Error("User cancelled the Google Sign-In flow.");
      } else if (error.code === googleStatusCodes.IN_PROGRESS) {
        throw new Error("Google Sign-In is already in progress.");
      } else if (error.code === googleStatusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error("Google Play Services are not available or outdated on this device.");
      } else {
        console.error("Google Sign-In service error details:", error);
        // Include the error code (e.g. Code 10 / 12500 Developer Error) in the message for easier console debugging
        const codeText = error.code ? ` (Error Code: ${error.code})` : "";
        throw new Error((error.message || "An error occurred during Google authentication.") + codeText);
      }
    }
  },

  /**
   * Signs the user out of Google on the device.
   */
  signOut: async (): Promise<void> => {
    if (!GoogleSignin) return;
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error("Google Sign-Out failed:", error);
    }
  },
};
