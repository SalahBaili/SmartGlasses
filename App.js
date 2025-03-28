import React from "react";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import WelcomeScreen from "./screens/WelcomeScreen";
import LoginScreen from "./screens/LoginScreen";
import AppDrawer from "./navigation/AppDrawer";
import { AppProvider, AppContext } from "./AppContext";
import ChangePasswordScreen from "./screens/ChangePasswordScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <AppProvider>
      <AppContext.Consumer>
        {({ theme }) => (
          <NavigationContainer theme={theme === "dark" ? DarkTheme : DefaultTheme}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="AuthStack" component={AppDrawer} />
              <Stack.Screen name="ChangerMotDePasse" component={ChangePasswordScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        )}
      </AppContext.Consumer>
    </AppProvider>
  );
}
