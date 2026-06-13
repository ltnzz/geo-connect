import { useEffect, useRef, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BrandMark from '../../components/common/BrandMark';
import { useAuthStore } from '../../stores/authStore';
import {
  googleAuthConfig,
  isGoogleAuthConfigured,
} from '../../config/googleAuth';
import { colors, radius, spacing } from '../../utils/theme';

WebBrowser.maybeCompleteAuthSession();

const AUTH_MODES = {
  login: 'login',
  register: 'register',
};

const initialForm = {
  displayName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const validateForm = (form, isRegister) => {
  if (isRegister && form.displayName.trim().length < 2) {
    return 'Display name must be at least 2 characters.';
  }

  if (isRegister && !/^[a-zA-Z0-9_]{3,20}$/.test(form.username.trim())) {
    return 'Username must be 3-20 letters, numbers, or underscores.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return 'Enter a valid email address.';
  }

  if (form.password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  if (isRegister && form.password !== form.confirmPassword) {
    return 'Passwords do not match.';
  }

  return null;
};

export default function AuthScreen() {
  const [mode, setMode] = useState(AUTH_MODES.login);
  const [form, setForm] = useState(initialForm);
  const [localError, setLocalError] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const processedGoogleResponseRef = useRef(null);

  const login = useAuthStore((state) => state.login);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const storeError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const isRegister = mode === AUTH_MODES.register;
  const error = localError || storeError;
  const [googleRequest, googleResponse, promptGoogleAsync] =
    Google.useIdTokenAuthRequest({
      ...googleAuthConfig,
      selectAccount: true,
    });

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      setFocusedField(null);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!googleResponse || processedGoogleResponseRef.current === googleResponse) {
      return;
    }

    processedGoogleResponseRef.current = googleResponse;

    if (googleResponse.type === 'success') {
      const idToken =
        googleResponse.authentication?.idToken || googleResponse.params?.id_token;
      const accessToken =
        googleResponse.authentication?.accessToken || googleResponse.params?.access_token;

      loginWithGoogle({ idToken, accessToken });
      return;
    }

    if (googleResponse.type === 'error') {
      setLocalError(
        googleResponse.error?.description ||
          googleResponse.params?.error_description ||
          'Google Sign-In failed. Please try again.',
      );
    }
  }, [googleResponse, loginWithGoogle]);

  const updateField = (field, value) => {
    if (error) {
      setLocalError(null);
      clearError();
    }

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const switchMode = (nextMode) => {
    Keyboard.dismiss();
    setMode(nextMode);
    setForm(initialForm);
    setLocalError(null);
    setPasswordVisible(false);
    clearError();
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();

    const validationError = validateForm(form, isRegister);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    if (isRegister) {
      await register(form);
      return;
    }

    await login({
      email: form.email,
      password: form.password,
    });
  };

  const handleGooglePress = async () => {
    Keyboard.dismiss();
    setLocalError(null);
    clearError();

    if (!isGoogleAuthConfigured) {
      setLocalError(
        `Google Sign-In belum dikonfigurasi untuk ${Platform.OS}. Isi Google OAuth client ID di .env.`,
      );
      return;
    }

    try {
      await promptGoogleAsync();
    } catch (googleError) {
      setLocalError(googleError.message || 'Unable to open Google Sign-In.');
    }
  };

  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        style={styles.keyboardView}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={styles.content}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={Keyboard.dismiss} style={styles.dismissArea}>
            <View style={[styles.hero, keyboardVisible && styles.heroKeyboardVisible]}>
              <View style={styles.logo}>
                <BrandMark size={68} />
              </View>
              {!keyboardVisible ? (
                <>
                  <Text style={styles.brand}>AroundU</Text>
                  <Text style={styles.tagline}>Discover What's Happening Around You</Text>
                </>
              ) : null}
            </View>
          </Pressable>

          <View style={styles.formPanel}>
            <View style={styles.modeSwitch}>
              <Pressable
                accessibilityRole="button"
                disabled={isLoading}
                onPress={() => switchMode(AUTH_MODES.login)}
                style={[styles.modeButton, !isRegister && styles.modeButtonActive]}
              >
                <Text style={[styles.modeText, !isRegister && styles.modeTextActive]}>
                  Login
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isLoading}
                onPress={() => switchMode(AUTH_MODES.register)}
                style={[styles.modeButton, isRegister && styles.modeButtonActive]}
              >
                <Text style={[styles.modeText, isRegister && styles.modeTextActive]}>
                  Register
                </Text>
              </Pressable>
            </View>

            <Text style={styles.title}>{isRegister ? 'Create your account' : 'Welcome back'}</Text>

            {isRegister ? (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Display name</Text>
                  <TextInput
                    autoCapitalize="words"
                    autoComplete="name"
                    blurOnSubmit={false}
                    editable={!isLoading}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(value) => updateField('displayName', value)}
                    onFocus={() => setFocusedField('displayName')}
                    onSubmitEditing={() => usernameRef.current?.focus()}
                    placeholder="Latanza"
                    placeholderTextColor={colors.neutral}
                    returnKeyType="next"
                    style={[
                      styles.input,
                      focusedField === 'displayName' && styles.inputFocused,
                    ]}
                    value={form.displayName}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Username</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    blurOnSubmit={false}
                    editable={!isLoading}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(value) => updateField('username', value)}
                    onFocus={() => setFocusedField('username')}
                    onSubmitEditing={() => emailRef.current?.focus()}
                    placeholder="latanza"
                    placeholderTextColor={colors.neutral}
                    ref={usernameRef}
                    returnKeyType="next"
                    style={[styles.input, focusedField === 'username' && styles.inputFocused]}
                    value={form.username}
                  />
                </View>
              </>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                blurOnSubmit={false}
                editable={!isLoading}
                keyboardType="email-address"
                onBlur={() => setFocusedField(null)}
                onChangeText={(value) => updateField('email', value)}
                onFocus={() => setFocusedField('email')}
                onSubmitEditing={() => passwordRef.current?.focus()}
                placeholder="you@example.com"
                placeholderTextColor={colors.neutral}
                ref={emailRef}
                returnKeyType="next"
                style={[styles.input, focusedField === 'email' && styles.inputFocused]}
                textContentType="emailAddress"
                value={form.email}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.passwordField,
                  focusedField === 'password' && styles.inputFocused,
                ]}
              >
                <TextInput
                  autoCapitalize="none"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  editable={!isLoading}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(value) => updateField('password', value)}
                  onFocus={() => setFocusedField('password')}
                  onSubmitEditing={() =>
                    isRegister ? confirmPasswordRef.current?.focus() : handleSubmit()
                  }
                  placeholder="Minimum 6 characters"
                  placeholderTextColor={colors.neutral}
                  ref={passwordRef}
                  returnKeyType={isRegister ? 'next' : 'done'}
                  secureTextEntry={!passwordVisible}
                  style={styles.passwordInput}
                  textContentType={isRegister ? 'newPassword' : 'password'}
                  value={form.password}
                />
                <Pressable
                  accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => setPasswordVisible((visible) => !visible)}
                  style={styles.passwordToggle}
                >
                  <Text style={styles.passwordToggleText}>{passwordVisible ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
            </View>

            {isRegister ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Confirm password</Text>
                <View
                  style={[
                    styles.passwordField,
                    focusedField === 'confirmPassword' && styles.inputFocused,
                  ]}
                >
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="new-password"
                    editable={!isLoading}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(value) => updateField('confirmPassword', value)}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onSubmitEditing={handleSubmit}
                    placeholder="Repeat your password"
                    placeholderTextColor={colors.neutral}
                    ref={confirmPasswordRef}
                    returnKeyType="done"
                    secureTextEntry={!passwordVisible}
                    style={styles.passwordInput}
                    textContentType="newPassword"
                    value={form.confirmPassword}
                  />
                  <Pressable
                    accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => setPasswordVisible((visible) => !visible)}
                    style={styles.passwordToggle}
                  >
                    <Text style={styles.passwordToggleText}>
                      {passwordVisible ? 'Hide' : 'Show'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {error ? (
              <View accessibilityLiveRegion="polite" style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={isLoading}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
                isLoading && styles.buttonDisabled,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isRegister ? 'Create Account' : 'Login'}
                </Text>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={isLoading || !googleRequest || !isGoogleAuthConfigured}
              onPress={handleGooglePress}
              style={({ pressed }) => [
                styles.googleButton,
                pressed && styles.buttonPressed,
                (isLoading || !googleRequest || !isGoogleAuthConfigured) &&
                  styles.buttonDisabled,
              ]}
            >
              <View style={styles.googleMark}>
                <Text style={styles.googleMarkText}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </Pressable>

            <Text style={styles.privacyText}>Location sharing is off by default.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.xl,
  },
  dismissArea: {
    alignSelf: 'stretch',
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroKeyboardVisible: {
    marginBottom: spacing.md,
  },
  logo: {
    marginBottom: spacing.md,
  },
  brand: {
    color: colors.text,
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    textAlign: 'center',
  },
  tagline: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  formPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  modeSwitch: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    flexDirection: 'row',
    marginBottom: spacing.lg,
    padding: spacing.xs,
  },
  modeButton: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeText: {
    color: colors.neutral,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  modeTextActive: {
    color: colors.surface,
  },
  title: {
    color: colors.text,
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    marginBottom: spacing.lg,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.mutedText,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    height: 54,
    includeFontPadding: false,
    paddingHorizontal: spacing.md,
    paddingVertical: 0,
  },
  inputFocused: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  passwordField: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    height: 54,
  },
  passwordInput: {
    color: colors.text,
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    height: 52,
    includeFontPadding: false,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: 0,
  },
  passwordToggle: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  passwordToggleText: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: radius.sm,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: 52,
  },
  primaryButtonText: {
    color: colors.surface,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  googleButton: {
    alignItems: 'center',
    borderColor: colors.secondary,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 52,
  },
  googleMark: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  googleMarkText: {
    color: '#4285F4',
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  googleButtonText: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  privacyText: {
    color: colors.tertiary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
