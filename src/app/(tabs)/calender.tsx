import Ionicons from '@expo/vector-icons/Ionicons'
import { useEffect, useMemo, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
} from 'react-native'
import { useTasks } from '../../context/task-context'
import type { TaskCategory } from '../../types/task'
import { router, type Href } from 'expo-router'

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

const WEEKDAYS_RU = [
  'воскресенье',
  'понедельник',
  'вторник',
  'среда',
  'четверг',
  'пятница',
  'суббота',
]

const MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  health: '#18A765',
  study: '#7557E8',
  personal: '#E78A20',
}

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  health: 'Здоровье',
  study: 'Учёба',
  personal: 'Личное',
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDay = (firstDay.getDay() + 6) % 7
  const days: { date: Date; currentMonth: boolean }[] = []

  for (let offset = startDay; offset > 0; offset -= 1) {
    days.push({
      date: new Date(year, month, 1 - offset),
      currentMonth: false,
    })
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push({ date: new Date(year, month, day), currentMonth: true })
  }

  const remainingDays = 42 - days.length
  for (let day = 1; day <= remainingDays; day += 1) {
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

function formatTaskSchedule(startAt: string, endAt: string) {
  const start = new Date(startAt)
  const end = new Date(endAt)
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()

  if (sameDay) {
    return `${formatTaskTime(startAt)}–${formatTaskTime(endAt)}`
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
  }
  return `${start.toLocaleDateString('ru-RU', dateOptions)}, ${formatTaskTime(startAt)} – ${end.toLocaleDateString('ru-RU', dateOptions)}, ${formatTaskTime(endAt)}`
}

export default function CalendarScreen() {
  const { tasks, loading, storageError } = useTasks()
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date()
    return { year: today.getFullYear(), month: today.getMonth() }
  })

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth.year, visibleMonth.month),
    [visibleMonth],
  )
  const selectedKey = toDateKey(selectedDate)

  const dayTasks = useMemo(
    () =>
      tasks
        .filter((task) => {
          const startKey = toDateKey(new Date(task.startAt))
          const endKey = toDateKey(new Date(task.endAt))
          return startKey <= selectedKey && selectedKey <= endKey
        })
        .sort(
          (first, second) =>
            new Date(first.startAt).getTime() -
            new Date(second.startAt).getTime(),
        ),
    [tasks, selectedKey],
  )

  const taskColorsByDate = useMemo(() => {
    const colors = new Map<string, string>()
    for (const { date } of calendarDays) {
      const key = toDateKey(date)
      const tasksForDate = tasks.filter((task) => {
        const startKey = toDateKey(new Date(task.startAt))
        const endKey = toDateKey(new Date(task.endAt))
        return startKey <= key && key <= endKey
      })
      const taskForDate =
        tasksForDate.find(
          (task) =>
            task.status === 'pending' && Date.parse(task.endAt) < currentTime,
        ) ?? tasksForDate[0]
      if (taskForDate) {
        colors.set(
          key,
          taskForDate.status === 'pending' &&
            Date.parse(taskForDate.endAt) < currentTime
            ? '#D94B4B'
            : CATEGORY_COLORS[taskForDate.category],
        )
      }
    }
    return colors
  }, [calendarDays, currentTime, tasks])

  const changeMonth = (amount: number) => {
    const nextMonth = new Date(
      visibleMonth.year,
      visibleMonth.month + amount,
      1,
    )
    const lastDay = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth() + 1,
      0,
    ).getDate()
    const nextSelectedDate = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      Math.min(selectedDate.getDate(), lastDay),
    )

    setVisibleMonth({
      year: nextMonth.getFullYear(),
      month: nextMonth.getMonth(),
    })
    setSelectedDate(nextSelectedDate)
  }

  const selectDate = (date: Date) => {
    setSelectedDate(date)
    setVisibleMonth({ year: date.getFullYear(), month: date.getMonth() })
  }

  const selectedDateLabel = `${WEEKDAYS_RU[selectedDate.getDay()]}, ${selectedDate.getDate()} ${MONTHS_GENITIVE[selectedDate.getMonth()]}`

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.calCard}>
          <View style={styles.calHeader}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Предыдущий месяц"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => changeMonth(-1)}
            >
              <Ionicons name="chevron-back" size={20} color="#7B6FE8" />
            </TouchableOpacity>
            <Text style={styles.calHeaderText}>
              {MONTHS_RU[visibleMonth.month]} {visibleMonth.year}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Следующий месяц"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => changeMonth(1)}
            >
              <Ionicons name="chevron-forward" size={20} color="#7B6FE8" />
            </TouchableOpacity>
          </View>

          <View style={styles.daysRow}>
            {DAYS_SHORT.map((day) => (
              <Text key={day} style={styles.dayName}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {calendarDays.map((item) => {
              const key = toDateKey(item.date)
              const isSelected = key === selectedKey
              const isToday = key === toDateKey(new Date(currentTime))
              const taskColor = taskColorsByDate.get(key)

              return (
                <TouchableOpacity
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={item.date.toLocaleDateString('ru-RU')}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => selectDate(item.date)}
                  style={styles.cell}
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
                        !item.currentMonth && styles.dateTextFaded,
                        isToday && !isSelected && styles.dateTextToday,
                        isSelected && styles.dateTextSelected,
                      ]}
                    >
                      {item.date.getDate()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: taskColor ?? 'transparent' },
                    ]}
                  />
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <Text style={styles.dayLabel}>{selectedDateLabel}</Text>

        {storageError ? (
          <Text style={styles.messageError}>
            Не удалось загрузить задачи: {storageError}
          </Text>
        ) : null}
        {loading ? (
          <Text style={styles.message}>Загрузка задач…</Text>
        ) : null}
        {!loading && !storageError && dayTasks.length === 0 ? (
          <Text style={styles.message}>На этот день задач нет</Text>
        ) : null}
        {!storageError &&
          dayTasks.map((task) => (
            <View
              key={task.id}
              style={[
                styles.taskCard,
                task.status === 'pending' &&
                  Date.parse(task.endAt) < currentTime &&
                  styles.taskCardOverdue,
              ]}
            >
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskTime} numberOfLines={2}>
                  {formatTaskSchedule(task.startAt, task.endAt)}
                </Text>
              </View>
              {task.status === 'pending' &&
              Date.parse(task.endAt) < currentTime ? (
                <View style={styles.overdueNotice}>
                  <Ionicons name="alert-circle" size={17} color="#B42318" />
                  <Text style={styles.overdueText}>
                    Просрочено: срок истёк{' '}
                    {new Date(task.endAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </Text>
                </View>
              ) : null}
              {task.description ? (
                <Text style={styles.taskDescription}>{task.description}</Text>
              ) : null}
              <View style={styles.taskFooter}>
                <Text
                  style={[
                    styles.taskCategory,
                    { color: CATEGORY_COLORS[task.category] },
                  ]}
                >
                  {CATEGORY_LABELS[task.category]}
                </Text>
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
                  style={styles.editTaskButton}
                >
                  <Ionicons name="create-outline" size={18} color="#6C5DD3" />
                  <Text style={styles.editTaskText}>Изменить</Text>
                </Pressable>
              </View>
            </View>
          ))}
      </ScrollView>
      <Pressable
  onPress={() => router.push('/create-task' as Href)}
  style={{
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#A33CF2',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    position: 'absolute',
    bottom: 10,
    right: 20,
    zIndex: 20,
  }}
>
  <Ionicons name="add" size={36} color="#FFFFFF" />
        </Pressable>
    </View>
  )
}

const ACCENT = '#7B6FE8'

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5FA',
  },
  scroll: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  calCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calHeaderText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  daysRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#aaa',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 3,
  },
  dateCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleSelected: {
    backgroundColor: ACCENT,
  },
  dateText: {
    fontSize: 14,
    color: '#1a1a2e',
    fontWeight: '500',
  },
  dateTextFaded: {
    color: '#ccc',
  },
  dateTextSelected: {
    color: 'white',
    fontWeight: '700',
  },
  dateTextToday: {
    color: ACCENT,
    fontWeight: '700',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  dayLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
    marginTop: 24,
    marginBottom: 14,
    marginLeft: 4,
  },
  message: {
    color: '#777',
    fontSize: 14,
    marginHorizontal: 4,
    marginBottom: 12,
  },
  messageError: {
    color: '#B42318',
    fontSize: 14,
    marginHorizontal: 4,
    marginBottom: 12,
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  taskCardOverdue: {
    borderColor: '#F3B9B5',
    backgroundColor: '#FFF9F8',
  },
  overdueNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  overdueText: {
    color: '#B42318',
    fontSize: 13,
    fontWeight: '600',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  taskTime: {
    fontSize: 13,
    color: '#777',
  },
  taskDescription: {
    marginTop: 8,
    fontSize: 14,
    color: '#777',
  },
  taskCategory: {
    fontSize: 13,
    fontWeight: '600',
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  editTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 36,
    paddingHorizontal: 8,
  },
  editTaskText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C5DD3',
  },
})
