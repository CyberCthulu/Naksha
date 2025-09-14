import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg';
import { birthToUTC } from '../lib/time';
import { computeNatalPlanets, PlanetPos, findAspects, Aspect } from '../lib/astro';