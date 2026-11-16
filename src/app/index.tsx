import Ionicons from '@expo/vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import { router, type Href } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useState } from 'react'
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Keep the native splash screen visible until our custom splash is mounted
SplashScreen.preventAutoHideAsync().catch(() => {})

export default function SplashScreenComponent() {
  const [destination, setDestination] = useState<Href | null>(null)

  // Stable Animated Values for React 19
  const [fadeAnim] = useState(() => new Animated.Value(0))
  const [scaleAnim] = useState(() => new Animated.Value(0.88))
  const [textTranslateY] = useState(() => new Animated.Value(25))
  const [progressAnim] = useState(() => new Animated.Value(0))
  const [ringScaleAnim] = useState(() => new Animated.Value(1))

  const handleNavigate = useCallback(() => {
    const target = destination || ('/(tabs)' as Href)
    router.replace(target)
  }, [destination])

  useEffect(() => {
    // Hide native splash once React component is mounted
    SplashScreen.hideAsync().catch(() => {})

    // Check onboarding status in storage
    AsyncStorage.getItem('has_seen_onboarding')
      .then((val) => {
        const nextRoute = val === 'true' ? ('/(tabs)' as Href) : ('/onboarding' as Href)
        setDestination(nextRoute)
      })
      .catch(() => {
        setDestination('/onboarding' as Href)
      })

    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }),
    ]).start()

    // Subtle pulsing ring loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringScaleAnim, {
          toValue: 1.12,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(ringScaleAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start()

    // Transition after 2.2 seconds
    const timer = setTimeout(() => {
      handleNavigate()
    }, 2200)

    return () => clearTimeout(timer)
  }, [destination, fadeAnim, handleNavigate, progressAnim, ringScaleAnim, scaleAnim, textTranslateY])

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <Pressable style={styles.container} onPress={handleNavigate}>
      <StatusBar style="light" />

      {/* Deep Violet Gradient Background */}
      <LinearGradient
        colors={['#6C5DD3', '#5745C4', '#3E2D9E', '#2A1D7A']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Glow Circles */}
      <View style={styles.decorCircleTop} />
      <View style={styles.decorCircleBottom} />

      {/* Central Brand Unit */}
      <View style={styles.centerWrap}>
        {/* Pulsing Outer Aura */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: ringScaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        />

        {/* Outer Glass Ring */}
        <View style={styles.glassRing}>
          {/* Logo Badge */}
          <Animated.View
            style={[
              styles.logoBadge,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F0EEFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Ionicons name="checkbox" size={54} color="#6C5DD3" />
            </LinearGradient>
          </Animated.View>
        </View>

        {/* App Title & Slogan */}
        <Animated.View
          style={[
            styles.textWrap,
            {
              opacity: fadeAnim,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={styles.brandTitle}>Do-Daily</Text>

          <View style={styles.pillBadge}>
            <Ionicons name="sparkles" size={13} color="#FFD700" />
            <Text style={styles.pillText}>ТВОЙ РИТМ УСПЕХА</Text>
          </View>

          <Text style={styles.tagline}>Каждый день — шаг к поставленной цели</Text>
        </Animated.View>
      </View>

      {/* Bottom Loading Bar & Slogan */}
      <Animated.View style={[styles.bottomWrap, { opacity: fadeAnim }]}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        <Text style={styles.motivationalQuote}>«Великие дела начинаются с одного шага»</Text>

        <Text style={styles.versionText}>Версия 1.0.0</Text>
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6C5DD3',
    paddingVertical: 50,
  },
  decorCircleTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorCircleBottom: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  glassRing: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoBadge: {
    width: 98,
    height: 98,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  textWrap: {
    alignItems: 'center',
    marginTop: 26,
    gap: 8,
    paddingHorizontal: 30,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '500',
    color: '#E0DBFF',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 22,
  },
  bottomWrap: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
    paddingHorizontal: 40,
  },
  progressTrack: {
    width: SCREEN_WIDTH * 0.45,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  motivationalQuote: {
    fontSize: 13,
    color: '#E2DEF8',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  versionText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.55)',
    fontWeight: '600',
    marginTop: 4,
  },
})
