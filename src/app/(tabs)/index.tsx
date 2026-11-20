import Ionicons from '@expo/vector-icons/Ionicons'
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { router, type Href } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppLogo } from '../../components/app-logo'
import { useAuth } from '../../context/auth-context'
import { useTasks } from '../../context/task-context'
import { useUserProfile } from '../../context/user-profile-context'
import type { TaskCategory, TaskPriority, TaskStatus } from '../../types/task'

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const MONTHS_RU = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]

const categoryLabels: Record<TaskCategory, string> = {
  health: 'Здоровье',
  study: 'Учёба',
  personal: 'Личное',
}

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
}

const priorityColors: Record<
  TaskPriority,
  { color: string; background: string }
> = {
  low: { color: '#18A765', background: '#E8F6EE' },
  medium: { color: '#D28A16', background: '#FFF3D9' },
  high: { color: '#D94B4B', background: '#FDECEC' },
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const startDay = (firstDay.getDay() + 6) % 7
  const lastDay = new Date(year, month + 1, 0).getDate()
  const days: { date: Date; currentMonth: boolean }[] = []

  for (let offset = startDay; offset > 0; offset -= 1) {
    days.push({ date: new Date(year, month, 1 - offset), currentMonth: false })
  }
  for (let day = 1; day <= lastDay; day += 1) {
    days.push({ date: new Date(year, month, day), currentMonth: true })
  }
  while (days.length < 42) {
    const day = days.length - startDay - lastDay + 1
    days.push({ date: new Date(year, month + 1, day), currentMonth: false })
  }
  return days
}

function formatTaskTime(value: string) {
  return new Date(value).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Index() {
  const [time, setTime] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [draftDate, setDraftDate] = useState(() => new Date())
  const [dateMonth, setDateMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const { user } = useAuth()
  const { tasks, loading, storageError, updateTask, deleteTask, refreshTasks } = useTasks()
  const { profile, loading: profileLoading, refreshProfile } = useUserProfile()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([refreshTasks(), refreshProfile()])
    } finally {
      setRefreshing(false)
    }
  }, [refreshTasks, refreshProfile])

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 60_000)

    return () => clearInterval(interval)
  }, [])

  const calendarDays = useMemo(
    () => getCalendarDays(dateMonth.getFullYear(), dateMonth.getMonth()),
    [dateMonth],
  )
  const selectedDateKey = toDateKey(selectedDate)
  const taskDateRanges = useMemo(
    () =>
      tasks.map((task) => ({
        task,
        startDateKey: toDateKey(new Date(task.startAt)),
        endDateKey: toDateKey(new Date(task.endAt)),
      })),
    [tasks],
  )
  const selectedDayTasks = useMemo(
    () =>
      taskDateRanges
        .filter(
          ({ startDateKey, endDateKey }) =>
            startDateKey <= selectedDateKey && selectedDateKey <= endDateKey,
        )
        .map(({ task }) => task)
        .sort(
          (first, second) =>
            new Date(first.startAt).getTime() -
            new Date(second.startAt).getTime(),
        ),
    [selectedDateKey, taskDateRanges],
  )

  const completedTasks = tasks.filter((task) => task.status === 'completed').length
  const remainingTasks = tasks.filter(
    (task) => task.status === 'pending' && Date.parse(task.endAt) >= time.getTime(),
  ).length
  const overdueTasks = tasks.filter(
    (task) => task.status === 'pending' && Date.parse(task.endAt) < time.getTime(),
  ).length

  const openDatePicker = () => {
    setDraftDate(selectedDate)
    setDateMonth(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
    )
    setDatePickerVisible(true)
  }

  const selectDate = (date: Date, currentMonth: boolean) => {
    setDraftDate(date)
    if (!currentMonth) {
      setDateMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    }
  }

  const selectToday = () => {
    const today = new Date()
    setDraftDate(today)
    setDateMonth(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  const confirmDate = () => {
    setSelectedDate(draftDate)
    setDatePickerVisible(false)
  }

  const handleUpdateStatus = async (id: string, status: TaskStatus) => {
    try {
      await updateTask(id, { status })
    } catch (error) {
      Alert.alert(
        'Не удалось обновить задачу',
        error instanceof Error ? error.message : 'Произошла ошибка хранилища.',
      )
    }
  }

  const handleDeleteTask = (id: string) => {
    Alert.alert('Удалить задачу?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(id)
          } catch (error) {
            Alert.alert(
              'Не удалось удалить задачу',
              error instanceof Error
                ? error.message
                : 'Произошла ошибка хранилища.',
            )
          }
        },
      },
    ])
  }

  const stats = [
    { label: 'Всего', value: tasks.length, icon: 'apps-outline', color: '#6C5DD3' },
    { label: 'Готово', value: completedTasks, icon: 'checkmark-circle', color: '#18A765' },
    { label: 'Осталось', value: remainingTasks, icon: 'time-outline', color: '#D28A16' },
    { label: 'Просрочено', value: overdueTasks, icon: 'alert-circle', color: '#D94B4B' },
  ] as const

  const userGreeting = profileLoading
    ? user?.user_metadata?.name || user?.email?.split('@')[0] || 'Друг'
    : profile.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Друг'
  const selectedDateLabel = selectedDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  })
  const isSelectedToday = selectedDateKey === toDateKey(time)

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6C5DD3']}
            tintColor="#6C5DD3"
          />
        }
        contentContainerStyle={styles.content}
      >
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <View style={styles.logoFrame}>
              <AppLogo size={40} />
            </View>
            <Text style={styles.brandName}>Do-Daily</Text>
          </View>
          
        </View>

        <View style={styles.welcomeBlock}>
          <Text style={styles.greeting}>Привет, {userGreeting}! 👋</Text>
          <Text style={styles.subtitle}>
            Давайте сделаем этот день продуктивным!
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Выбрана дата ${selectedDateLabel}. Открыть выбор даты`}
          onPress={openDatePicker}
          style={styles.dateCard}
        >
          <View style={styles.dateIconWrap}>
            <Ionicons name="calendar-outline" size={24} color="#6C5DD3" />
          </View>
          <View style={styles.dateInfo}>
            <Text style={styles.dateEyebrow}>
              {isSelectedToday ? 'Сегодня' : 'Выбранная дата'}
            </Text>
            <Text style={styles.dateTitle}>{selectedDateLabel}</Text>
            <Text style={styles.dateTime}>
              {time.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#898696" />
        </Pressable>

        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon} size={21} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text numberOfLines={1} style={styles.statLabel}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Мои задачи</Text>
            <Text style={styles.sectionSubtitle}>{selectedDateLabel}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/categories' as Href)}
            style={styles.allTasksButton}
          >
            <Text style={styles.allTasksText}>Все</Text>
            <Ionicons name="chevron-forward" size={16} color="#6C5DD3" />
          </Pressable>
        </View>

        {storageError ? (
          <Text style={styles.errorMessage}>
            Не удалось загрузить задачи: {storageError}
          </Text>
        ) : null}
        {loading ? <Text style={styles.message}>Загрузка задач…</Text> : null}
        {!loading && !storageError && selectedDayTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Пока нет задач на эту дату</Text>
            <Text style={styles.emptyText}>
              Нажмите «+», чтобы добавить задачу.
            </Text>
          </View>
        ) : null}

        {!storageError &&
          selectedDayTasks.map((task) => {
            const nextStatus =
              task.status === 'pending' ? 'completed' : 'pending'
            const priorityColor = priorityColors[task.priority]

            return (
              <View key={task.id} style={styles.taskCard}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: task.status === 'completed' }}
                  accessibilityLabel={
                    task.status === 'completed'
                      ? `Вернуть задачу ${task.title} в активные`
                      : `Отметить задачу ${task.title} выполненной`
                  }
                  onPress={() => handleUpdateStatus(task.id, nextStatus)}
                  hitSlop={8}
                >
                  <Ionicons
                    name={
                      task.status === 'completed'
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                    }
                    size={24}
                    color={task.status === 'completed' ? '#6C5DD3' : '#C9C7D1'}
                  />
                </Pressable>

                <View style={styles.taskInfo}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.taskTitle,
                      task.status === 'completed' && styles.taskTitleCompleted,
                    ]}
                  >
                    {task.title}
                  </Text>
                  {task.description ? (
                    <Text numberOfLines={1} style={styles.taskDescription}>
                      {task.description}
                    </Text>
                  ) : null}
                  <View style={styles.taskMetaRow}>
                    <Text style={styles.taskTime}>{formatTaskTime(task.startAt)}</Text>
                    <Text style={styles.metaSeparator}>·</Text>
                    <Text style={styles.taskCategory}>
                      {categoryLabels[task.category]}
                    </Text>
                  </View>
                </View>

                <View style={styles.taskSide}>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: priorityColor.background },
                    ]}
                  >
                    <Text style={[styles.priorityText, { color: priorityColor.color }]}>
                      {priorityLabels[task.priority]}
                    </Text>
                  </View>
                  <View style={styles.taskActions}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Редактировать задачу ${task.title}`}
                      onPress={() =>
                        router.push({
                          pathname: '/create-task',
                          params: { taskId: task.id },
                        } as Href)
                      }
                      hitSlop={8}
                    >
                      <Ionicons name="create-outline" size={18} color="#6C5DD3" />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Удалить задачу ${task.title}`}
                      onPress={() => handleDeleteTask(task.id)}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={18} color="#AAA7B1" />
                    </Pressable>
                  </View>
                </View>
              </View>
            )
          })}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Добавить задачу"
        onPress={() => router.push('/create-task' as Href)}
        style={styles.addButton}
      >
        <Ionicons name="add" size={34} color="#FFFFFF" />
      </Pressable>

      <Modal
        animationType="slide"
        onRequestClose={() => setDatePickerVisible(false)}
        transparent
        visible={datePickerVisible}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Закрыть выбор даты"
            onPress={() => setDatePickerVisible(false)}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.datePickerSheet}>
            <View style={styles.pickerHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Предыдущий месяц"
                hitSlop={10}
                onPress={() =>
                  setDateMonth(
                    (current) =>
                      new Date(current.getFullYear(), current.getMonth() - 1, 1),
                  )
                }
              >
                <Ionicons name="chevron-back" size={20} color="#6C5DD3" />
              </Pressable>
              <Text style={styles.pickerMonth}>
                {MONTHS_RU[dateMonth.getMonth()]} {dateMonth.getFullYear()}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Следующий месяц"
                hitSlop={10}
                onPress={() =>
                  setDateMonth(
                    (current) =>
                      new Date(current.getFullYear(), current.getMonth() + 1, 1),
                  )
                }
              >
                <Ionicons name="chevron-forward" size={20} color="#6C5DD3" />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={selectToday}
              style={styles.pickerTodayButton}
            >
              <Text style={styles.pickerTodayText}>Выбрать сегодня</Text>
            </Pressable>

            <View style={styles.weekdaysRow}>
              {DAYS_SHORT.map((day) => (
                <Text key={day} style={styles.weekday}>
                  {day}
                </Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarDays.map(({ date, currentMonth }) => {
                const isSelected = toDateKey(date) === toDateKey(draftDate)

                return (
                  <Pressable
                    key={toDateKey(date)}
                    accessibilityRole="button"
                    accessibilityLabel={date.toLocaleDateString('ru-RU')}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => selectDate(date, currentMonth)}
                    style={styles.calendarCell}
                  >
                    <View
                      style={[
                        styles.dateCircle,
                        isSelected && styles.dateCircleSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dateText,
                          !currentMonth && styles.dateTextFaded,
                          isSelected && styles.dateTextSelected,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                )
              })}
            </View>

            <View style={styles.pickerActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDatePickerVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={confirmDate}
                style={styles.confirmButton}
              >
                <Text style={styles.confirmButtonText}>Выбрать дату</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

export default Index

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9FE',
  },
  content: {
    padding: 18,
    paddingBottom: 100,
    gap: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  logoFrame: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandName: {
    color: '#242136',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  welcomeBlock: {
    gap: 6,
  },
  greeting: {
    color: '#252137',
    fontSize: 23,
    fontWeight: '800',
  },
  subtitle: {
    color: '#777483',
    fontSize: 14,
    fontWeight: '500',
  },
  dateCard: {
    width: '100%',
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEAF3',
    shadowColor: '#211B3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.045,
    shadowRadius: 6,
    elevation: 2,
  },
  dateIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0ECFF',
  },
  dateInfo: {
    flex: 1,
    gap: 2,
  },
  dateEyebrow: {
    color: '#878394',
    fontSize: 11,
    fontWeight: '600',
  },
  dateTitle: {
    color: '#292638',
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  dateTime: {
    color: '#777483',
    fontSize: 12,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 88,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 3,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEDF5',
  },
  statValue: {
    color: '#292638',
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: '#858292',
    fontSize: 9,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -8,
  },
  sectionTitle: {
    color: '#252137',
    fontSize: 21,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#8E8B99',
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  allTasksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
  },
  allTasksText: {
    color: '#6C5DD3',
    fontSize: 14,
    fontWeight: '700',
  },
  message: {
    color: '#777483',
    fontSize: 14,
    paddingVertical: 8,
  },
  errorMessage: {
    color: '#B42318',
    fontSize: 13,
    lineHeight: 19,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FDECEC',
  },
  emptyState: {
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    color: '#555263',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    color: '#8E8B99',
    fontSize: 12,
    marginTop: 4,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEDF5',
    shadowColor: '#211B3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  taskInfo: {
    flex: 1,
    gap: 5,
  },
  taskTitle: {
    color: '#292638',
    fontSize: 14,
    fontWeight: '700',
  },
  taskTitleCompleted: {
    color: '#8C8995',
    textDecorationLine: 'line-through',
  },
  taskDescription: {
    color: '#898692',
    fontSize: 12,
  },
  taskMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  taskTime: {
    color: '#6C5DD3',
    fontSize: 12,
    fontWeight: '600',
  },
  metaSeparator: {
    color: '#B5B2BC',
    fontSize: 12,
  },
  taskCategory: {
    color: '#777483',
    fontSize: 12,
  },
  taskSide: {
    alignItems: 'flex-end',
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 14,
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5DD3',
    shadowColor: '#6C5DD3',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(24, 20, 38, 0.4)',
  },
  datePickerSheet: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pickerMonth: {
    color: '#292638',
    fontSize: 17,
    fontWeight: '700',
  },
  pickerTodayButton: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: '#F0ECFF',
  },
  pickerTodayText: {
    color: '#6C5DD3',
    fontSize: 12,
    fontWeight: '700',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekday: {
    width: `${100 / 7}%`,
    color: '#999',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleSelected: {
    backgroundColor: '#6C5DD3',
  },
  dateText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  dateTextFaded: {
    color: '#C7C4CE',
  },
  dateTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pickerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#F1F0F5',
  },
  cancelButtonText: {
    color: '#555',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#7357E8',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
})
