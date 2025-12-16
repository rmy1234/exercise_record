import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Calendar, BarChart2, User } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabIconDefault,
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: 'bold',
          marginBottom: 0,
        },
        tabBarStyle: {
          height: 70,
          paddingTop: 6,
          paddingBottom: 5,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          backgroundColor: Colors.card,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <Home color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: '루틴',
          tabBarIcon: ({ color }) => <Calendar color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '통계',
          tabBarIcon: ({ color }) => <BarChart2 color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="mypage"
        options={{
          title: '마이페이지',
          tabBarIcon: ({ color }) => <User color={color} size={28} />,
        }}
      />
    </Tabs>
  );
}

