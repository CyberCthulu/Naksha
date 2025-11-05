// screens/JournalListScreen.tsx
import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { listJournals, deleteJournal, JournalRow } from '../lib/journals'