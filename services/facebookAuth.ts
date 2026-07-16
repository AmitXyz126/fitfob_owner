let LoginManager: any = null;
let AccessToken: any = null;

try {
  const FacebookModule = require("react-native-fbsdk-next");
  LoginManager = FacebookModule.LoginManager;
  AccessToken = FacebookModule.AccessToken;
} catch (e) {
  console.warn("Facebook native module not available (expected in Expo Go).");
}

export const facebookAuthService = {
  /**
   * Triggers the native Facebook Login flow and returns the Access Token and User ID.
   */
  signIn: async (): Promise<{ accessToken: string; userID: string }> => {
    if (!LoginManager || !AccessToken) {
      throw new Error(
        "Facebook Login is not supported in Expo Go. Please test this feature using an Expo Development Build (run:android / run:ios)."
      );
    }

    try {
      // Clear any existing Facebook SDK login sessions to prevent stale accounts
      try {
        LoginManager.logOut();
      } catch (logOutError: any) {
        console.warn("Facebook logOut failed due to unlinked native modules:", logOutError);
        throw new Error(
          "Facebook Login is not supported in Expo Go. Please test this feature using an Expo Development Build (run:android / run:ios)."
        );
      }

      // Request public profile and email permissions
      let result;
      try {
        result = await LoginManager.logInWithPermissions(["public_profile", "email"]);
      } catch (loginError: any) {
        console.warn("Facebook logInWithPermissions failed due to unlinked native modules:", loginError);
        throw new Error(
          "Facebook Login is not supported in Expo Go. Please test this feature using an Expo Development Build (run:android / run:ios)."
        );
      }

      if (result.isCancelled) {
        throw new Error("User cancelled the Facebook Login flow.");
      }

      // Obtain current access token details
      let data;
      try {
        data = await AccessToken.getCurrentAccessToken();
      } catch (tokenError: any) {
        console.warn("Facebook getCurrentAccessToken failed due to unlinked native modules:", tokenError);
        throw new Error(
          "Facebook Login is not supported in Expo Go. Please test this feature using an Expo Development Build (run:android / run:ios)."
        );
      }

      if (!data) {
        throw new Error("Failed to retrieve Facebook Access Token.");
      }

      const accessToken = data.accessToken.toString();
      const userID = data.userID;

      return { accessToken, userID };
    } catch (error: any) {
      console.error("Facebook SDK Login error details:", error);
      throw new Error(error.message || "An error occurred during Facebook authentication.");
    }
  },

  /**
   * Logs the user out of the Facebook SDK session.
   */
  signOut: async (): Promise<void> => {
    if (!LoginManager) return;
    try {
      LoginManager.logOut();
    } catch (error) {
      console.error("Facebook Sign-Out failed:", error);
    }
  },
};
