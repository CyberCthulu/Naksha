import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg';
import { birthToUTC } from '../lib/time';
import { computeNatalPlanets, PlanetPos, findAspects, Aspect } from '../lib/astro';

// Simple zodiac helpers
const ZODIAC = ['Ar','Ta','Ge','Cn','Le','Vi','Li','Sc','Sg','Cp','Aq','Pi']
const signOf = (lon: number) => Math.floor(lon / 30)
const degInSign = (lon: number) => (lon % 30 + 30) % 30