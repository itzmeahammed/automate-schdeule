import * as Realm from 'realm-web';

const appId = import.meta.env.VITE_MONGODB_APP_ID || '';
export const mongoDbName = import.meta.env.VITE_MONGODB_DB_NAME || 'manufacturing_pro';

// Only create the App instance when an App ID is configured
export const realmApp = appId ? new Realm.App({ id: appId }) : null;

export const isMongoConfigured = () => Boolean(appId);

export const getDb = () => {
  if (!realmApp) throw new Error('MongoDB App ID not configured. Set VITE_MONGODB_APP_ID in your .env file.');
  const user = realmApp.currentUser;
  if (!user) throw new Error('User not authenticated. Please sign in.');
  return user.mongoClient('mongodb-atlas').db(mongoDbName);
};
