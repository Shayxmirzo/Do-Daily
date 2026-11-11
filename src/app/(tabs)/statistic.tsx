import Ionicons from '@expo/vector-icons/Ionicons'
import { router, type Href } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTasks } from '../../context/task-context'
import type { TaskCategory } from '../../types/task'

type TimeFilter = 'day' | 'week' | 'month' | 'all'

const filterOptions: { id: TimeFilter; label: string }[] = [
  { id: 'day', label: 'Сегодня' },
  { id: 'week', label: '7 дней' },
  { id: 'month', label: '30 дней' },
  { id: 'all', label: 'Всё время' },
]

const categoryConfig: Record<
  TaskCategory,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  health: {
    label: 'Здоровье',
    icon: 'heart-outline',
    color: '#18A765',
    bg: '#E8F6EE',
  },
  study: {
    label: 'Учёба',
    icon: 'book-outline',
    color: '#7557E8',
    bg: '#F0ECFF',
  },
  personal: {
    label: 'Личное',
    icon: 'person-outline',
    color: '#E78A20',
    bg: '#FFF3E5',
  },
}

const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

export default function StatisticScreen() {
  const { tasks, loading } = useTasks()
  const [selectedFilter, setSelectedFilter] = useState<TimeFilter>('week')

  const now = useMemo(() => new Date(), [])

  // Filter tasks based on selected time window
  const filteredTasks = useMemo(() => {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const todayEnd = todayStart + 24 * 60 * 60 * 1000

    return tasks.filter((task) => {
      const taskTime = Date.parse(task.startAt)
      if (Number.isNaN(taskTime)) return true

      switch (selectedFilter) {
        case 'day':
          return taskTime >= todayStart && taskTime < todayEnd
        case 'week': {
          const sevenDaysAgo = todayStart - 6 * 24 * 60 * 60 * 1000
          return taskTime >= sevenDaysAgo && taskTime <= now.getTime() + 24 * 60 * 60 * 1000
        }
        case 'month': {
          const thirtyDaysAgo = todayStart - 29 * 24 * 60 * 60 * 1000
          return taskTime >= thirtyDaysAgo && taskTime <= now.getTime() + 24 * 60 * 60 * 1000
        }
        case 'all':
        default:
          return true
      }
    })
  }, [tasks, selectedFilter, now])

  // Core metrics calculation
  const totalCount = filteredTasks.length
  const completedCount = filteredTasks.filter((t) => t.status === 'completed').length
  const pendingCount = filteredTasks.filter(
    (t) => t.status === 'pending' && Date.parse(t.endAt) >= now.getTime(),
  ).length
  const overdueCount = filteredTasks.filter(
    (t) => t.status === 'pending' && Date.parse(t.endAt) < now.getTime(),
  ).length

  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Category breakdown
  const categoryStats = useMemo(() => {
    const categories: TaskCategory[] = ['health', 'study', 'personal']
    return categories.map((cat) => {
      const catTasks = filteredTasks.filter((t) => t.category === cat)
      const catCompleted = catTasks.filter((t) => t.status === 'completed').length
      const percent = catTasks.length > 0 ? Math.round((catCompleted / catTasks.length) * 100) : 0
      return {
        category: cat,
        total: catTasks.length,
        completed: catCompleted,
        percent,
      }
    })
  }, [filteredTasks])

  // 7-day activity bar chart data
  const weekChartData = useMemo(() => {
    const days = []
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

    for (let i = 6; i >= 0; i--) {
      const dayStart = startOfToday - i * 24 * 60 * 60 * 1000
      const dayEnd = dayStart + 24 * 60 * 60 * 1000
      const dateObj = new Date(dayStart)

      const dayTasks = tasks.filter((t) => {
        const time = Date.parse(t.startAt)
        return time >= dayStart && time < dayEnd
      })

      const completed = dayTasks.filter((t) => t.status === 'completed').length
      const total = dayTasks.length
      const isToday = i === 0

      days.push({
        dayName: dayNames[dateObj.getDay()],
        dayNumber: dateObj.getDate(),
        total,
        completed,
        isToday,
      })
    }
    return days
  }, [tasks, now])

  const maxChartCount = useMemo(() => {
    const max = Math.max(...weekChartData.map((d) => d.total), 1)
    return Math.max(max, 4) // minimum 4 for visual proportions
  }, [weekChartData])

  // Current streak (consecutive days with at least one completed task)
  const currentStreak = useMemo(() => {
    if (tasks.length === 0) return 0
    let streak = 0
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

    // Check today first
    const todayCompleted = tasks.some((t) => {
      const time = Date.parse(t.startAt)
      return time >= startOfToday && time < startOfToday + 24 * 60 * 60 * 1000 && t.status === 'completed'
    })

    let checkDay = todayCompleted ? 0 : 1

    while (checkDay < 365) {
      const dayStart = startOfToday - checkDay * 24 * 60 * 60 * 1000
      const dayEnd = dayStart + 24 * 60 * 60 * 1000
      const hasCompleted = tasks.some((t) => {
        const time = Date.parse(t.startAt)
        return time >= dayStart && time < dayEnd && t.status === 'completed'
      })

      if (hasCompleted) {
        streak++
        checkDay++
      } else {
        break
      }
    }

    return todayCompleted ? streak + 1 : streak
  }, [tasks, now])

  // Motivational message based on rate
  const motivationText = useMemo(() => {
    if (totalCount === 0) return 'Создайте первую задачу, чтобы увидеть прогресс!'
    if (completionRate >= 80) return 'Великолепная продуктивность! Так держать! 🔥'
    if (completionRate >= 50) return 'Хороший прогресс, вы на верном пути! 🚀'
    return 'Каждый шаг важен. Время завершить оставшиеся дела! 💪'
  }, [completionRate, totalCount])

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Screen Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Статистика</Text>
            <Text style={styles.headerSubtitle}>Анализ вашей продуктивности</Text>
          </View>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={18} color="#FF6B00" />
            <Text style={styles.streakText}>{currentStreak} дн.</Text>
          </View>
        </View>

        {/* Time Filter Pills */}
        <View style={styles.filterContainer}>
          {filterOptions.map((opt) => {
            const active = selectedFilter === opt.id
            return (
              <Pressable
                key={opt.id}
                onPress={() => setSelectedFilter(opt.id)}
                style={[styles.filterPill, active && styles.filterPillActive]}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Hero Progress Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroInfo}>
              <Text style={styles.heroLabel}>Продуктивность</Text>
              <Text style={styles.heroRate}>{completionRate}%</Text>
              <Text style={styles.heroMotivation}>{motivationText}</Text>
            </View>
            <View style={styles.progressCircleContainer}>
              <View style={styles.progressRingOuter}>
                <Ionicons
                  name={completionRate >= 80 ? 'trophy' : completionRate >= 50 ? 'trending-up' : 'speedometer-outline'}
                  size={32}
                  color="#6C5DD3"
                />
              </View>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(Math.max(completionRate, 3), 100)}%` },
              ]}
            />
          </View>

          <View style={styles.heroBottomRow}>
            <Text style={styles.heroBottomText}>
              Выполнено <Text style={styles.boldText}>{completedCount}</Text> из{' '}
              <Text style={styles.boldText}>{totalCount}</Text> задач
            </Text>
          </View>
        </View>

        {/* 2x2 Key Metric Grid */}
        <View style={styles.grid}>
          {/* Total */}
          <View style={styles.gridCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#F0ECFF' }]}>
              <Ionicons name="layers-outline" size={22} color="#6C5DD3" />
            </View>
            <Text style={styles.gridValue}>{totalCount}</Text>
            <Text style={styles.gridLabel}>Всего задач</Text>
          </View>

          {/* Completed */}
          <View style={styles.gridCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#E8F6EE' }]}>
              <Ionicons name="checkmark-done-circle-outline" size={22} color="#18A765" />
            </View>
            <Text style={[styles.gridValue, { color: '#18A765' }]}>{completedCount}</Text>
            <Text style={styles.gridLabel}>Выполнено</Text>
          </View>

          {/* In Progress */}
          <View style={styles.gridCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFF3E5' }]}>
              <Ionicons name="time-outline" size={22} color="#E78A20" />
            </View>
            <Text style={[styles.gridValue, { color: '#E78A20' }]}>{pendingCount}</Text>
            <Text style={styles.gridLabel}>В процессе</Text>
          </View>

          {/* Overdue */}
          <View style={styles.gridCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEECEE' }]}>
              <Ionicons name="alert-circle-outline" size={22} color="#E5484D" />
            </View>
            <Text style={[styles.gridValue, { color: '#E5484D' }]}>{overdueCount}</Text>
            <Text style={styles.gridLabel}>Просрочено</Text>
          </View>
        </View>

        {/* 7-Day Activity Chart */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Активность за 7 дней</Text>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#6C5DD3' }]} />
              <Text style={styles.legendText}>Выполнено</Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            {weekChartData.map((day, idx) => {
              const barHeightPct = day.total > 0 ? (day.completed / maxChartCount) * 100 : 0
              const backgroundBarPct = day.total > 0 ? (day.total / maxChartCount) * 100 : 10

              return (
                <View key={idx} style={styles.chartColumn}>
                  <Text style={styles.chartCountLabel}>
                    {day.completed > 0 ? day.completed : ''}
                  </Text>
                  <View style={styles.chartBarTrack}>
                    {/* Background bar (total planned) */}
                    <View
                      style={[
                        styles.chartBarTotal,
                        { height: `${Math.min(backgroundBarPct, 100)}%` },
                      ]}
                    />
                    {/* Foreground bar (completed) */}
                    <View
                      style={[
                        styles.chartBarCompleted,
                        {
                          height: `${Math.min(barHeightPct, 100)}%`,
                          backgroundColor: day.isToday ? '#6C5DD3' : '#8E7FE8',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartDayName, day.isToday && styles.chartDayToday]}>
                    {day.dayName}
                  </Text>
                  <Text style={[styles.chartDayNumber, day.isToday && styles.chartDayNumberToday]}>
                    {day.dayNumber}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Распределение по сферам</Text>
          <View style={styles.categoryList}>
            {categoryStats.map(({ category, total, completed, percent }) => {
              const conf = categoryConfig[category]
              return (
                <View key={category} style={styles.categoryRow}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryLeft}>
                      <View style={[styles.categoryIconWrap, { backgroundColor: conf.bg }]}>
                        <Ionicons name={conf.icon} size={18} color={conf.color} />
                      </View>
                      <Text style={styles.categoryLabel}>{conf.label}</Text>
                    </View>
                    <Text style={styles.categoryRatio}>
                      {completed} / {total} <Text style={styles.categoryPercent}>({percent}%)</Text>
                    </Text>
                  </View>

                  <View style={styles.categoryBarTrack}>
                    <View
                      style={[
                        styles.categoryBarFill,
                        {
                          width: `${total > 0 ? Math.min(Math.max(percent, 4), 100) : 0}%`,
                          backgroundColor: conf.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              )
            })}
          </View>
        </View>

        {/* Empty State Banner if no tasks exist */}
        {!loading && tasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="sparkles-outline" size={36} color="#6C5DD3" />
            <Text style={styles.emptyTitle}>Статистика формируется</Text>
            <Text style={styles.emptySubtitle}>
              Добавьте задачи на сегодня, чтобы отслеживать продуктивность и ставить рекорды!
            </Text>
            <Pressable
              onPress={() => router.push('/create-task' as Href)}
              style={styles.emptyButton}
            >
              <Text style={styles.emptyButtonText}>Создать задачу</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7FC',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E1F24',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#717382',
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FFE2CC',
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B00',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDEBF5',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#717382',
  },
  filterPillTextActive: {
    color: '#6C5DD3',
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#6C5DD3',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#6C5DD3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroInfo: {
    flex: 1,
    gap: 4,
  },
  heroLabel: {
    fontSize: 13,
    color: '#E0DBFF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroRate: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroMotivation: {
    fontSize: 13,
    color: '#EBE8FF',
    fontWeight: '500',
  },
  progressCircleContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  heroBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroBottomText: {
    fontSize: 13,
    color: '#E0DBFF',
  },
  boldText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ECEBF3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E1F24',
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#717382',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: '#ECEBF3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E1F24',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#717382',
    fontWeight: '500',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 16,
    paddingHorizontal: 4,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  chartCountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6C5DD3',
    minHeight: 14,
  },
  chartBarTrack: {
    width: 14,
    height: 85,
    backgroundColor: '#F0ECFA',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },
  chartBarTotal: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#E2DEF5',
    borderRadius: 7,
  },
  chartBarCompleted: {
    width: '100%',
    borderRadius: 7,
  },
  chartDayName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A8D9F',
    marginTop: 4,
  },
  chartDayToday: {
    color: '#6C5DD3',
    fontWeight: '800',
  },
  chartDayNumber: {
    fontSize: 10,
    color: '#B0B2C0',
  },
  chartDayNumberToday: {
    color: '#6C5DD3',
    fontWeight: '700',
  },
  categoryList: {
    gap: 14,
  },
  categoryRow: {
    gap: 6,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1F24',
  },
  categoryRatio: {
    fontSize: 13,
    fontWeight: '600',
    color: '#717382',
  },
  categoryPercent: {
    color: '#1E1F24',
    fontWeight: '700',
  },
  categoryBarTrack: {
    height: 8,
    backgroundColor: '#F1F0F7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#ECEBF3',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E1F24',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#717382',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyButton: {
    marginTop: 6,
    backgroundColor: '#6C5DD3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
})
