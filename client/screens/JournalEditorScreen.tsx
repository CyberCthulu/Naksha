// screens/JournalEditorScreen.tsx
import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, Button, Alert } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { upsertJournal } from '../lib/journals'

