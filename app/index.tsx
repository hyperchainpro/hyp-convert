import { Redirect } from 'expo-router';

export default function Index() {
    // Redirect to login by default
    // The _layout.tsx will handle routing to tabs if authenticated
    return <Redirect href="/(auth)/login" />;
}
