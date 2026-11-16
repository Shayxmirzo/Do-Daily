import Ionicons from '@expo/vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useRef, useState } from 'react'
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface OnboardingSlide {
  id: string
  badgeText: string
  badgeIcon: keyof typeof Ionicons.glyphMap
  title: string
  highlightWord: string
  subtitle: string
  cardType: 'tasks' | 'balance' | 'gamification'
  gradientColors: [string, string]
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    badgeText: 'Твой новый ритм',
    badgeIcon: 'sparkles',
    title: 'Превращай планы в',
    highlightWord: 'реальные победы',
    subtitle:
      'Организуй день без хаоса и спешки. Держи фокус на главном и завершай дела легко и с удовольствием.',
    cardType: 'tasks',
    gradientColors: ['#6C5DD3', '#8B7AE8'],
  },
  {
    id: '2',
    badgeText: 'Баланс жизни',
    badgeIcon: 'infinite',
    title: 'Гармония трёх',
    highlightWord: 'главных сфер',
    subtitle:
      'Уделяй внимание здоровью, прокачивай навыки в учёбе и оставляй время для себя и отдыха без выгорания.',
    cardType: 'balance',
    gradientColors: ['#7A5AF8', '#613AE8'],
  },
  {
    id: '3',
    badgeText: 'Серии и триумфы',
    badgeIcon: 'flame',
    title: 'Празднуй каждый шаг',
    highlightWord: 'и ставь рекорды',
    subtitle:
      'Зарабатывай опыт, открывай крутые достижения, веди серию продуктивных дней и гордись своим результатом.',
    cardType: 'gamification',
    gradientColors: ['#6C5DD3', '#9D4EDD'],
  },
]

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null)

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x
    const index = Math.round(offsetX / SCREEN_WIDTH)
    if (index !== currentIndex && index >= 0 && index < slides.length) {
      setCurrentIndex(index)
    }
  }

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem('has_seen_onboarding', 'true')
    } catch {
      // ignore storage errors
    }
    router.replace('/(tabs)')
  }

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      })
    } else {
      handleFinish()
    }
  }

  const renderCardIllustration = (type: OnboardingSlide['cardType']) => {
    if (type === 'tasks') {
      return (
        <View style={styles.artContainer}>
          {/* Decorative Background Blob */}
          <View style={[styles.glowBlob, { backgroundColor: '#E4DEFF' }]} />

          {/* Background Card */}
          <View style={[styles.mockCard, styles.mockCardBack]}>
            <View style={styles.mockCardHeader}>
              <View style={[styles.mockCardCircle, { backgroundColor: '#E8F6EE' }]}>
                <Ionicons name="heart" size={14} color="#18A765" />
              </View>
              <Text style={styles.mockCardTitle}>Утренняя пробежка</Text>
            </View>
            <View style={styles.mockCardBadge}>
              <Text style={styles.mockCardBadgeText}>Выполнено</Text>
            </View>
          </View>

          {/* Foreground Hero Card */}
          <View style={[styles.mockCard, styles.mockCardFront]}>
            <View style={styles.heroCardTop}>
              <View style={[styles.mockCardCircle, { backgroundColor: '#F0ECFF' }]}>
                <Ionicons name="book" size={18} color="#6C5DD3" />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.heroCardHeading}>Подготовка к экзамену</Text>
                <Text style={styles.heroCardSub}>14:00 - 15:30 · Учёба</Text>
              </View>
              <View style={styles.checkIconWrap}>
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.heroCardProgressWrap}>
              <View style={styles.heroCardProgressBar}>
                <View style={[styles.heroCardProgressFill, { width: '85%' }]} />
              </View>
              <Text style={styles.heroCardProgressText}>Фокус 85% 🔥</Text>
            </View>
          </View>

          {/* Floating Pill Tag */}
          <View style={styles.floatingPill}>
            <Ionicons name="alarm-outline" size={16} color="#6C5DD3" />
            <Text style={styles.floatingPillText}>Напоминания вовремя</Text>
          </View>
        </View>
      )
    }

    if (type === 'balance') {
      return (
        <View style={styles.artContainer}>
          <View style={[styles.glowBlob, { backgroundColor: '#FFEBD9' }]} />

          {/* 3 Pillars Showcase */}
          <View style={styles.pillarsContainer}>
            {/* Pillar 1: Health */}
            <View style={[styles.pillarCard, { borderColor: '#B7EACD' }]}>
              <View style={[styles.pillarIcon, { backgroundColor: '#E8F6EE' }]}>
                <Ionicons name="heart" size={24} color="#18A765" />
              </View>
              <Text style={styles.pillarTitle}>Здоровье</Text>
              <Text style={styles.pillarDesc}>Сон & Спорт</Text>
              <View style={[styles.pillarBar, { backgroundColor: '#18A765' }]} />
            </View>

            {/* Pillar 2: Study (Center, highlighted) */}
            <View style={[styles.pillarCard, styles.pillarCardCenter]}>
              <View style={[styles.pillarIcon, { backgroundColor: '#F0ECFF' }]}>
                <Ionicons name="school" size={26} color="#6C5DD3" />
              </View>
              <Text style={[styles.pillarTitle, { color: '#6C5DD3' }]}>Учёба</Text>
              <Text style={styles.pillarDesc}>Фокус & Рост</Text>
              <View style={[styles.pillarBar, { backgroundColor: '#6C5DD3', width: '80%' }]} />
            </View>

            {/* Pillar 3: Personal */}
            <View style={[styles.pillarCard, { borderColor: '#FFE2CC' }]}>
              <View style={[styles.pillarIcon, { backgroundColor: '#FFF3E5' }]}>
                <Ionicons name="sparkles" size={24} color="#E78A20" />
              </View>
              <Text style={styles.pillarTitle}>Личное</Text>
              <Text style={styles.pillarDesc}>Хобби & Отдых</Text>
              <View style={[styles.pillarBar, { backgroundColor: '#E78A20' }]} />
            </View>
          </View>

          {/* Floating Balance Badge */}
          <View style={[styles.floatingPill, { bottom: 10, alignSelf: 'center' }]}>
            <Ionicons name="checkmark-done-circle" size={18} color="#18A765" />
            <Text style={styles.floatingPillText}>100% баланс дня</Text>
          </View>
        </View>
      )
    }

    // Gamification & Streaks
    return (
      <View style={styles.artContainer}>
        <View style={[styles.glowBlob, { backgroundColor: '#FFE4E8' }]} />

        {/* Streak Main Card */}
        <View style={styles.streakShowcaseCard}>
          <LinearGradient
            colors={['#FF6B00', '#FF8E3C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.streakFlameCircle}
          >
            <Ionicons name="flame" size={38} color="#FFFFFF" />
          </LinearGradient>

          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={styles.streakDayCount}>7 ДНЕЙ</Text>
            <Text style={styles.streakDaySubtitle}>Серия побед подряд 🔥</Text>
          </View>

          <View style={styles.streakXpRow}>
            <View style={styles.streakXpBadge}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.streakXpText}>+35 XP за задачу</Text>
            </View>
            <View style={styles.streakLevelBadge}>
              <Text style={styles.streakLevelText}>Уровень 3 🏆</Text>
            </View>
          </View>
        </View>

        {/* Floating Mini Badge */}
        <View style={[styles.floatingPill, { top: 20, right: 15 }]}>
          <Ionicons name="trophy" size={16} color="#FF6B00" />
          <Text style={styles.floatingPillText}>Мастер фокуса</Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Bar with Skip Button */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandLogo}>
            <Ionicons name="checkbox" size={20} color="#6C5DD3" />
          </View>
          <Text style={styles.brandText}>Do-Daily</Text>
        </View>

        {currentIndex < slides.length - 1 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Пропустить знакомство"
            onPress={handleFinish}
            style={styles.skipBtn}
            hitSlop={12}
          >
            <Text style={styles.skipBtnText}>Пропустить</Text>
          </Pressable>
        ) : (
          <View style={{ width: 70 }} />
        )}
      </View>

      {/* Horizontal Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        decelerationRate="fast"
        bounces={false}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {/* Visual Illustration Area */}
            <View style={styles.illustrationWrap}>
              {renderCardIllustration(item.cardType)}
            </View>

            {/* Slide Content */}
            <View style={styles.contentWrap}>
              {/* Category Pill */}
              <View style={styles.pillTag}>
                <Ionicons name={item.badgeIcon} size={15} color="#6C5DD3" />
                <Text style={styles.pillTagText}>{item.badgeText}</Text>
              </View>

              {/* Title with Gradient Emphasis */}
              <Text style={styles.slideTitle}>
                {item.title}{'\n'}
                <Text style={styles.slideTitleHighlight}>{item.highlightWord}</Text>
              </Text>

              {/* Subtitle */}
              <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      {/* Bottom Navigation & Indicator */}
      <View style={styles.bottomBar}>
        {/* Pagination Dots */}
        <View style={styles.paginationRow}>
          {slides.map((_, idx) => {
            const active = idx === currentIndex
            return (
              <View
                key={idx}
                style={[
                  styles.dot,
                  active ? styles.dotActive : styles.dotInactive,
                ]}
              />
            )
          })}
        </View>

        {/* Action Button */}
        <Pressable
          accessibilityRole="button"
          onPress={handleNext}
          style={styles.actionBtnWrap}
        >
          <LinearGradient
            colors={currentIndex === slides.length - 1 ? ['#6C5DD3', '#9D4EDD'] : ['#6C5DD3', '#7A68E8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionBtn}
          >
            <Text style={styles.actionBtnText}>
              {currentIndex === slides.length - 1 ? 'Начать путь к цели' : 'Продолжить'}
            </Text>
            <Ionicons
              name={currentIndex === slides.length - 1 ? 'rocket' : 'arrow-forward'}
              size={20}
              color="#FFFFFF"
            />
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9FE',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1F24',
    letterSpacing: -0.5,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#EFEFF8',
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#717382',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  illustrationWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: 330,
  },
  artContainer: {
    width: '100%',
    height: 290,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowBlob: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.65,
  },
  mockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEBF3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  mockCardBack: {
    position: 'absolute',
    top: 30,
    width: '85%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    opacity: 0.8,
    transform: [{ scale: 0.94 }],
  },
  mockCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mockCardCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333745',
  },
  mockCardBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#E8F6EE',
  },
  mockCardBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#18A765',
  },
  mockCardFront: {
    width: '94%',
    gap: 14,
    padding: 18,
    zIndex: 10,
  },
  heroCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroCardHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1F24',
  },
  heroCardSub: {
    fontSize: 12,
    color: '#717382',
    fontWeight: '500',
  },
  checkIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6C5DD3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCardProgressWrap: {
    gap: 6,
  },
  heroCardProgressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F0EFF8',
    overflow: 'hidden',
  },
  heroCardProgressFill: {
    height: '100%',
    backgroundColor: '#6C5DD3',
    borderRadius: 3,
  },
  heroCardProgressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6C5DD3',
    alignSelf: 'flex-end',
  },
  floatingPill: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEBF3',
    shadowColor: '#6C5DD3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  floatingPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E1F24',
  },
  pillarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  pillarCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#ECEBF3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  pillarCardCenter: {
    paddingVertical: 20,
    borderColor: '#6C5DD3',
    transform: [{ translateY: -10 }],
    shadowColor: '#6C5DD3',
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  pillarIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  pillarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1F24',
  },
  pillarDesc: {
    fontSize: 11,
    color: '#8A8D9F',
    fontWeight: '500',
    textAlign: 'center',
  },
  pillarBar: {
    height: 4,
    width: '60%',
    borderRadius: 2,
    marginTop: 4,
  },
  streakShowcaseCard: {
    width: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#FFE2CC',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 5,
  },
  streakFlameCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  streakDayCount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E1F24',
    letterSpacing: 0.5,
  },
  streakDaySubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#717382',
  },
  streakXpRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  streakXpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  streakXpText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  streakLevelBadge: {
    backgroundColor: '#F0ECFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  streakLevelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6C5DD3',
  },
  contentWrap: {
    gap: 12,
  },
  pillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#F0ECFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6C5DD3',
  },
  slideTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1E1F24',
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  slideTitleHighlight: {
    color: '#6C5DD3',
  },
  slideSubtitle: {
    fontSize: 15,
    color: '#606470',
    lineHeight: 22,
    fontWeight: '400',
  },
  bottomBar: {
    paddingHorizontal: 28,
    paddingBottom: 16,
    gap: 20,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 28,
    backgroundColor: '#6C5DD3',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#DFDDE9',
  },
  actionBtnWrap: {
    borderRadius: 18,
    shadowColor: '#6C5DD3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 18,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
})

