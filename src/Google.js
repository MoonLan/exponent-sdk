// @flow

import {
  NativeModules,
} from 'react-native';

import * as Constants from './Constants';

const Google = NativeModules.ExponentGoogle;

type LogInConfig = {
  webClientId: string,
  iosClientId?: string,
  behavior?: 'system' | 'web',
  scopes?: Array<string>,
};

type LogInResult = {
  type: 'cancel',
} | {
  type: 'success',
  accessToken?: ?string,
  idToken?: ?string,
  serverAuthCode?: ?string,
  user: {
    id: string,
    name: string,
    givenName: string,
    familyName: string,
    photoUrl?: ?string,
    email?: ?string,
  },
};

export async function logInAsync(
  config: LogInConfig
): Promise<LogInResult> {
  let behavior = config.behavior;
  if (!behavior) {
    behavior = 'system';
  }
  // Only standalone apps can use system login.
  if (behavior === 'system' && Constants.appOwnership !== 'standalone') {
    behavior = 'web';
  }

  let scopes = config.scopes;
  if (!scopes) {
    scopes = ['profile', 'email'];
  }

  const logInResult = await Google.logInAsync({
    ...config,
    behavior,
    scopes,
  });

  if (behavior === 'web') {
    // Web login only returns an accessToken so use it to fetch the same info
    // as the native login does.
    let userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${logInResult.accessToken}`},
    });
    userInfoResponse = await userInfoResponse.json();
    return {
      ...logInResult,
      user: {
        id: userInfoResponse.id,
        name: userInfoResponse.name,
        givenName: userInfoResponse.given_name,
        familyName: userInfoResponse.family_name,
        photoUrl: userInfoResponse.picture,
        email: userInfoResponse.email,
      },
    };
  } else {
    return logInResult;
  }
}
