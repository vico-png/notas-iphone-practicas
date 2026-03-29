import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NotesProvider } from "./src/context/NotesContext";
import HomeScreen from "./src/screens/HomeScreen";
import NoteEditorScreen from "./src/screens/NoteEditorScreen";
import { RootStackParamList } from "./src/types/Note";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NotesProvider>
        <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: "#F5F5F5",
            },
            headerTintColor: "#007AFF",
            headerTitleStyle: {
              fontWeight: "600",
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NoteEditor"
            component={NoteEditorScreen}
            options={{
              title: "Nota",
              headerBackTitle: "Notas",
            }}
          />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </NotesProvider>
    </GestureHandlerRootView>
  );
}