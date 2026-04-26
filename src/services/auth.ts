import * as Realm from 'realm-web';
import { realmApp, getDb, isMongoConfigured } from '../lib/mongodb';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  profileImage?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authService = {
  async signUp(data: SignUpData): Promise<{ success: boolean; message: string; user?: AuthUser; token?: string }> {
    if (!isMongoConfigured() || !realmApp) {
      return { success: false, message: 'MongoDB not configured. Running in offline mode.' };
    }

    try {
      // Register user with Realm email/password auth
      await realmApp.emailPasswordAuth.registerUser({ email: data.email, password: data.password });

      // Auto-login immediately after registration
      // NOTE: Requires "Automatically confirm users" enabled in Atlas App Services → Authentication → Email/Password
      const credentials = Realm.Credentials.emailPassword(data.email, data.password);
      const user = await realmApp.logIn(credentials);

      // Store user profile in MongoDB
      const profile = {
        realmUserId: user.id,
        name: data.name,
        email: data.email,
        role: data.role || 'operator',
        createdAt: new Date().toISOString(),
      };
      await getDb().collection('userProfiles').insertOne(profile);

      return {
        success: true,
        message: 'Account created successfully!',
        user: {
          id: user.id,
          email: data.email,
          name: data.name,
          role: data.role || 'operator',
        },
        token: user.accessToken || '',
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Registration failed.' };
    }
  },

  async signIn(data: SignInData): Promise<{ success: boolean; message: string; user?: AuthUser; token?: string }> {
    if (!isMongoConfigured() || !realmApp) {
      return { success: false, message: 'MongoDB not configured. Running in offline mode.' };
    }

    try {
      const credentials = Realm.Credentials.emailPassword(data.email, data.password);
      const user = await realmApp.logIn(credentials);

      // Fetch profile from MongoDB
      const profile = await getDb().collection('userProfiles').findOne({ realmUserId: user.id });

      const authUser: AuthUser = {
        id: user.id,
        email: data.email,
        name: profile?.name || data.email.split('@')[0],
        role: profile?.role || 'operator',
        profileImage: profile?.profileImage,
      };

      return {
        success: true,
        message: 'Signed in successfully!',
        user: authUser,
        token: user.accessToken || '',
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Sign in failed.' };
    }
  },

  async signOut(): Promise<{ success: boolean; message: string }> {
    if (!isMongoConfigured() || !realmApp) {
      return { success: true, message: 'Signed out (offline mode).' };
    }

    try {
      if (realmApp.currentUser) {
        await realmApp.currentUser.logOut();
      }
      return { success: true, message: 'Signed out successfully!' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Sign out failed.' };
    }
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!isMongoConfigured() || !realmApp) return null;

    try {
      const user = realmApp.currentUser;
      if (!user) return null;

      const profile = await getDb().collection('userProfiles').findOne({ realmUserId: user.id });
      if (!profile) return null;

      return {
        id: user.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        profileImage: profile.profileImage,
      };
    } catch {
      return null;
    }
  },

  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    if (!isMongoConfigured() || !realmApp) {
      return { success: false, message: 'MongoDB not configured.' };
    }

    try {
      await realmApp.emailPasswordAuth.sendResetPasswordEmail({ email });
      return { success: true, message: 'Password reset email sent! Please check your inbox.' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to send reset email.' };
    }
  },

  async updatePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!isMongoConfigured() || !realmApp) {
      return { success: false, message: 'MongoDB not configured.' };
    }

    try {
      // Realm does not support in-place password update via SDK directly.
      // This requires the user to use the reset password flow.
      return { success: false, message: 'Use the password reset email flow to change your password.' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to update password.' };
    }
  },
};
