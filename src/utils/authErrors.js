const messages = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password is too weak. Use at least 8 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please try again in a few minutes.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/popup-closed-by-user': 'Sign-in window was closed before finishing.',
  'auth/cancelled-popup-request': 'Sign-in window was closed before finishing.',
  'auth/popup-blocked': 'Your browser blocked the sign-in window. Allow popups and retry.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled for this project.',
  'auth/invalid-api-key': 'Firebase is not configured. Add your project keys to the .env file.',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'Firebase is not configured. Add your project keys to the .env file.',
};

export function authErrorMessage(error) {
  if (error?.code && messages[error.code]) return messages[error.code];
  if (error?.code?.startsWith('auth/')) {
    return error.code.replace('auth/', '').replaceAll('-', ' ') + '.';
  }
  return 'Something went wrong. Please try again.';
}
