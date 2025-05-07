import { AppConfig, UserSession, showConnect } from '@stacks/connect';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export const authenticateUser = async () => {
  if (!userSession.isUserSignedIn()) {
    await new Promise<void>((resolve) => {
      showConnect({
        appDetails: {
          name: 'Your App Name',
          icon: '/path/to/icon.png',
        },
        onFinish: () => {
          resolve();
        },
        userSession,
      });
    });
  }
};

export const getUserWallet = () => {
  if (!userSession.isUserSignedIn()) {
    throw new Error('User is not signed in');
  }

  const userData = userSession.loadUserData();
  return userData;
};
