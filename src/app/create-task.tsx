import Ionicons from '@expo/vector-icons/Ionicons'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTasks } from '../context/task-context'
import type { Task, TaskCategory, TaskPriority } from '../types/task'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS = [
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

const taskTypes = [
  { category: 'health', label: 'Здоровье', icon: 'heart-outline', color: '#18A765', background: '#E8F6EE' },
  { category: 'study', label: 'Учёба', icon: 'book-outline', color: '#7557E8', background: '#F0ECFF' },
  { category: 'personal', label: 'Личное', icon: 'person-outline', color: '#E78A20', background: '#FFF3E5' },
] as const

const priorities: {
  value: TaskPriority
  label: string
  color: string
  background: string
  icon: 'arrow-down-outline' | 'remove-outline' | 'arrow-up-outline'
}[] = [
  { value: 'low', label: 'Низкий', color: '#18A765', background: '#E8F6EE', icon: 'arrow-down-outline' },
  { value: 'medium', label: 'Средний', color: '#D28A16', background: '#FFF3D9', icon: 'remove-outline' },
  { value: 'high', label: 'Высокий', color: '#D94B4B', background: '#FDECEC', icon: 'arrow-up-outline' },
]

type TimeField = 'start' | 'end'
type DateField = 'start' | 'end'

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

function formatTime(date: Date) {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function createTime(date: Date, hour: number, minute: number) {
  const updatedDate = new Date(date)
  updatedDate.setHours(hour, minute, 0, 0)
  return updatedDate
}

export default function CreateTaskScreen() {
  const { taskId } = useLocalSearchParams<{ taskId?: string }>()
  const { tasks, loading, storageError } = useTasks()
  if (!taskId) {
    return <TaskForm key="new-task" />
  }
  if (loading) {
    return <TaskStatusView message="Загрузка задачи…" />
  }
  if (storageError) {
    return <TaskStatusView message={`Не удалось загрузить задачу: ${storageError}`} />
  }

  const task = tasks.find((item) => item.id === taskId)
  if (!task) {
    return <TaskStatusView message="Задача не найдена. Возможно, она была удалена." />
  }

  return <TaskForm key={task.id} task={task} />
}

function TaskStatusView({ message }: { message: string }) {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 24,
        backgroundColor: '#F8F7FC',
      }}
    >
      <Text style={{ color: '#777', fontSize: 14, textAlign: 'center' }}>
        {message}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={{
          minHeight: 44,
          justifyContent: 'center',
          paddingHorizontal: 16,
          borderRadius: 12,
          backgroundColor: '#EEEAFB',
        }}
      >
        <Text style={{ color: '#6C5DD3', fontWeight: '600' }}>Назад</Text>
      </Pressable>
    </SafeAreaView>
  )
}

function TaskForm({ task }: { task?: Task }) {
  const { addTask, updateTask, loading, storageError } = useTasks()
  const now = new Date()
  const defaultEndTime = new Date(now.getTime() + 60 * 60 * 1000)
  const initialStartTime = task ? new Date(task.startAt) : now
  const initialEndTime = task ? new Date(task.endAt) : defaultEndTime
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [selectedType, setSelectedType] = useState<TaskCategory>(
    task?.category ?? 'study',
  )
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? 'medium',
  )
  const [startTime, setStartTime] = useState(initialStartTime)
  const [endTime, setEndTime] = useState(initialEndTime)
  const [hasEndDate, setHasEndDate] = useState(
    initialEndTime.getFullYear() !== initialStartTime.getFullYear() ||
      initialEndTime.getMonth() !== initialStartTime.getMonth() ||
      initialEndTime.getDate() !== initialStartTime.getDate(),
  )
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [draftDate, setDraftDate] = useState(initialStartTime)
  const [dateField, setDateField] = useState<DateField>('start')
  const [dateMonth, setDateMonth] = useState(
    () =>
      new Date(
        initialStartTime.getFullYear(),
        initialStartTime.getMonth(),
        1,
      ),
  )
  const [timeField, setTimeField] = useState<TimeField | null>(null)
  const [draftTime, setDraftTime] = useState(initialStartTime)
  const isEditing = Boolean(task)
  const calendarDays = getCalendarDays(
    dateMonth.getFullYear(),
    dateMonth.getMonth(),
  )

  const openDatePicker = (field: DateField) => {
    const date = field === 'start' ? startTime : endTime
    setDateField(field)
    setDraftDate(date)
    setDateMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    setDatePickerVisible(true)
  }

  const confirmDate = () => {
    if (dateField === 'start') {
      const dayDelta =
        (Date.UTC(
          draftDate.getFullYear(),
          draftDate.getMonth(),
          draftDate.getDate(),
        ) -
          Date.UTC(
            startTime.getFullYear(),
            startTime.getMonth(),
            startTime.getDate(),
          )) /
        86400000
      const updatedStart = new Date(draftDate)
      updatedStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0)
      const updatedEnd = new Date(endTime)
      updatedEnd.setDate(updatedEnd.getDate() + dayDelta)
      setStartTime(updatedStart)
      setEndTime(updatedEnd)
    } else {
      const updatedEnd = new Date(draftDate)
      updatedEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0)
      const startDay = new Date(
        startTime.getFullYear(),
        startTime.getMonth(),
        startTime.getDate(),
      )
      const endDay = new Date(
        updatedEnd.getFullYear(),
        updatedEnd.getMonth(),
        updatedEnd.getDate(),
      )
      if (endDay < startDay) {
        Alert.alert(
          'Проверьте даты',
          'Последний день не может быть раньше даты начала.',
        )
        return
      }
      setEndTime(updatedEnd)
    }
    setDatePickerVisible(false)
  }

  const removeEndDate = () => {
    const updatedEnd = new Date(endTime)
    updatedEnd.setFullYear(
      startTime.getFullYear(),
      startTime.getMonth(),
      startTime.getDate(),
    )
    if (updatedEnd <= startTime) {
      Alert.alert(
        'Проверьте время',
        'Для задачи на один день время окончания должно быть позже начала.',
      )
      return
    }
    setEndTime(updatedEnd)
    setHasEndDate(false)
  }

  const openTimePicker = (field: TimeField) => {
    setTimeField(field)
    setDraftTime(field === 'start' ? startTime : endTime)
  }

  const confirmTime = () => {
    if (timeField === 'start') {
      setStartTime(draftTime)
    } else if (timeField === 'end') {
      setEndTime(draftTime)
    }
    setTimeField(null)
  }

  const handleSaveTask = async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      Alert.alert('Не указано название', 'Введите название задачи.')
      return
    }

    if (endTime <= startTime) {
      Alert.alert(
        'Проверьте время',
        'Время окончания должно быть позже времени начала.',
      )
      return
    }

    try {
      const taskChanges = {
        title: trimmedTitle,
        description: description.trim(),
        category: selectedType,
        priority,
        startAt: startTime.toISOString(),
        endAt: endTime.toISOString(),
      }

      if (task) {
        await updateTask(task.id, taskChanges)
      } else {
        await addTask(taskChanges)
      }
      router.back()
    } catch (error) {
      Alert.alert(
        isEditing ? 'Не удалось сохранить задачу' : 'Не удалось создать задачу',
        error instanceof Error ? error.message : 'Произошла ошибка хранилища.',
      )
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F7FC' }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 36, gap: 22 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#222' }}>
              {isEditing ? 'Редактировать задачу' : 'Новая задача'}
            </Text>
            <Text style={{ fontSize: 14, color: '#777' }}>
              {isEditing
                ? 'Измените данные задачи'
                : `На ${now.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                  })} · запланируйте свой день`}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Вернуться назад"
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 14,
              backgroundColor: '#EEEAFB',
            }}
          >
            <Ionicons name="arrow-back" size={21} color="#6C5DD3" />
          </Pressable>
        </View>

        <View style={{ gap: 18 }}>
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#333' }}>
              Название задачи
            </Text>
            <TextInput
              accessibilityLabel="Название задачи"
              onChangeText={setTitle}
              placeholder="Например, подготовиться к экзамену"
              placeholderTextColor="#A5A2AD"
              value={title}
              style={{
                minHeight: 54,
                paddingHorizontal: 16,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#E8E6ED',
                backgroundColor: '#FFFFFF',
                color: '#222',
                fontSize: 15,
              }}
            />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#333' }}>
              Описание
            </Text>
            <TextInput
              accessibilityLabel="Описание задачи"
              multiline
              numberOfLines={3}
              onChangeText={setDescription}
              placeholder="Что нужно сделать?"
              placeholderTextColor="#A5A2AD"
              textAlignVertical="top"
              value={description}
              style={{
                minHeight: 96,
                padding: 16,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#E8E6ED',
                backgroundColor: '#FFFFFF',
                color: '#222',
                fontSize: 15,
              }}
            />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#333' }}>
              Дата
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Дата задачи: ${startTime.toLocaleDateString('ru-RU')}. Выбрать дату`}
              onPress={() => openDatePicker('start')}
              style={{
                minHeight: 54,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#E8E6ED',
                backgroundColor: '#FFFFFF',
              }}
            >
              <Ionicons name="calendar-outline" size={19} color="#6C5DD3" />
              <Text style={{ flex: 1, fontSize: 15, color: '#333' }}>
                {startTime.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#A5A2AD" />
            </Pressable>
            {hasEndDate ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Последний день: ${endTime.toLocaleDateString('ru-RU')}. Выбрать дату`}
                  onPress={() => openDatePicker('end')}
                  style={{
                    flex: 1,
                    minHeight: 50,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: '#E8E6ED',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <Ionicons name="calendar-outline" size={18} color="#6C5DD3" />
                  <Text style={{ flex: 1, fontSize: 14, color: '#333' }}>
                    До {endTime.toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Убрать последний день"
                  onPress={removeEndDate}
                  style={{
                    width: 50,
                    minHeight: 50,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 14,
                    backgroundColor: '#F1F0F5',
                  }}
                >
                  <Ionicons name="close" size={19} color="#777" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => setHasEndDate(true)}
                style={{
                  alignSelf: 'flex-start',
                  minHeight: 40,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 7,
                  paddingHorizontal: 10,
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color="#6C5DD3" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#6C5DD3' }}>
                  Добавить последний день
                </Text>
              </Pressable>
            )}
          </View>

          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#333' }}>
              Категория
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {taskTypes.map((type) => {
                const isSelected = selectedType === type.category

                return (
                  <Pressable
                    key={type.category}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setSelectedType(type.category)}
                    style={{
                      flex: 1,
                      minHeight: 78,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      borderRadius: 14,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? type.color : 'transparent',
                      backgroundColor: type.background,
                    }}
                  >
                    <Ionicons name={type.icon} size={21} color={type.color} />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: isSelected ? '700' : '500',
                        color: type.color,
                      }}
                    >
                      {type.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#333' }}>
              Приоритет
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {priorities.map((item) => {
                const isSelected = priority === item.value

                return (
                  <Pressable
                    key={item.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setPriority(item.value)}
                    style={{
                      flex: 1,
                      minHeight: 72,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      borderRadius: 14,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? item.color : '#E8E6ED',
                      backgroundColor: item.background,
                    }}
                  >
                    <Ionicons name={item.icon} size={19} color={item.color} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: isSelected ? '700' : '500',
                        color: item.color,
                      }}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#333' }}>
              Время
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {([
                ['start', 'Начало', startTime],
                ['end', 'Окончание', endTime],
              ] as const).map(([field, label, value]) => (
                <View key={field} style={{ flex: 1, gap: 7 }}>
                  <Text style={{ fontSize: 13, color: '#777' }}>{label}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${label}: ${formatTime(value)}. Выбрать время`}
                    onPress={() => openTimePicker(field)}
                    style={{
                      minHeight: 54,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingHorizontal: 12,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: '#E8E6ED',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <Ionicons name="time-outline" size={19} color="#6C5DD3" />
                    <Text style={{ fontSize: 15, color: '#333' }}>
                      {formatTime(value)}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            disabled: loading || storageError !== null,
          }}
          disabled={loading || storageError !== null}
          onPress={handleSaveTask}
          style={{
            minHeight: 54,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 15,
            backgroundColor: loading || storageError !== null ? '#AFA6D8' : '#7357E8',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
            {loading
              ? 'Загрузка задач…'
              : isEditing
                ? 'Сохранить изменения'
                : 'Создать задачу'}
          </Text>
        </Pressable>
        {storageError ? (
          <Text style={{ color: '#B42318', fontSize: 13 }}>
            Не удалось загрузить задачи: {storageError}
          </Text>
        ) : null}
      </ScrollView>

      <Modal
        animationType="slide"
        onRequestClose={() => setDatePickerVisible(false)}
        transparent
        visible={datePickerVisible}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(24, 20, 38, 0.4)',
          }}
        >
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 22,
              paddingBottom: 30,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              backgroundColor: '#FFFFFF',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
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
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#222' }}>
                {dateField === 'start' ? 'Дата задачи · ' : 'Последний день · '}
                {MONTHS[dateMonth.getMonth()]} {dateMonth.getFullYear()}
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

            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {WEEKDAYS.map((day) => (
                <Text
                  key={day}
                  style={{
                    width: `${100 / 7}%`,
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#999',
                  }}
                >
                  {day}
                </Text>
              ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {calendarDays.map(({ date, currentMonth }) => {
                const isSelected =
                  date.getFullYear() === draftDate.getFullYear() &&
                  date.getMonth() === draftDate.getMonth() &&
                  date.getDate() === draftDate.getDate()

                return (
                  <Pressable
                    key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                    accessibilityRole="button"
                    accessibilityLabel={date.toLocaleDateString('ru-RU')}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      setDraftDate(date)
                      if (!currentMonth) {
                        setDateMonth(
                          new Date(date.getFullYear(), date.getMonth(), 1),
                        )
                      }
                    }}
                    style={{
                      width: `${100 / 7}%`,
                      height: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 12,
                        backgroundColor: isSelected ? '#7357E8' : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isSelected ? '700' : '500',
                          color: isSelected
                            ? '#FFFFFF'
                            : currentMonth
                              ? '#333'
                              : '#C7C4CE',
                        }}
                      >
                        {date.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                )
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDatePickerVisible(false)}
                style={{
                  flex: 1,
                  minHeight: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 13,
                  backgroundColor: '#F1F0F5',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#555' }}>
                  Отмена
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={confirmDate}
                style={{
                  flex: 1,
                  minHeight: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 13,
                  backgroundColor: '#7357E8',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFF' }}>
                  Выбрать дату
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setTimeField(null)}
        transparent
        visible={timeField !== null}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(24, 20, 38, 0.4)',
          }}
        >
          <View
            style={{
              paddingHorizontal: 22,
              paddingTop: 22,
              paddingBottom: 30,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              backgroundColor: '#FFFFFF',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 18,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#222' }}>
                {timeField === 'start' ? 'Время начала' : 'Время окончания'}
              </Text>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#6C5DD3' }}>
                {formatTime(draftTime)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[
                {
                  label: 'Часы',
                  values: Array.from({ length: 24 }, (_, index) => index),
                  selected: draftTime.getHours(),
                  update: (value: number) =>
                    setDraftTime((current) =>
                      createTime(current, value, current.getMinutes()),
                    ),
                },
                {
                  label: 'Минуты',
                  values: Array.from({ length: 60 }, (_, index) => index),
                  selected: draftTime.getMinutes(),
                  update: (value: number) =>
                    setDraftTime((current) =>
                      createTime(current, current.getHours(), value),
                    ),
                },
              ].map((column) => (
                <View key={column.label} style={{ flex: 1, gap: 8 }}>
                  <Text
                    style={{
                      textAlign: 'center',
                      fontSize: 13,
                      fontWeight: '600',
                      color: '#777',
                    }}
                  >
                    {column.label}
                  </Text>
                  <ScrollView
                    style={{ height: 210 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {column.values.map((value) => {
                      const isSelected = value === column.selected
                      const displayValue = String(value).padStart(2, '0')

                      return (
                        <Pressable
                          key={value}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected }}
                          onPress={() => column.update(value)}
                          style={{
                            minHeight: 42,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 10,
                            backgroundColor: isSelected ? '#EEEAFB' : '#FFFFFF',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 17,
                              fontWeight: isSelected ? '700' : '400',
                              color: isSelected ? '#6C5DD3' : '#555',
                            }}
                          >
                            {displayValue}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </ScrollView>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setTimeField(null)}
                style={{
                  flex: 1,
                  minHeight: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 13,
                  backgroundColor: '#F1F0F5',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#555' }}>
                  Отмена
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={confirmTime}
                style={{
                  flex: 1,
                  minHeight: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 13,
                  backgroundColor: '#7357E8',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFF' }}>
                  Готово
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
