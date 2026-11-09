import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
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
import type { TaskCategory } from '../types/task'

const taskTypes = [
  { category: 'health', label: 'Здоровье', icon: 'heart-outline', color: '#18A765', background: '#E8F6EE' },
  { category: 'study', label: 'Учёба', icon: 'book-outline', color: '#7557E8', background: '#F0ECFF' },
  { category: 'personal', label: 'Личное', icon: 'person-outline', color: '#E78A20', background: '#FFF3E5' },
] as const

type TimeField = 'start' | 'end'

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
  const { addTask, loading, storageError } = useTasks()
  const now = new Date()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedType, setSelectedType] = useState<TaskCategory>('study')
  const [startTime, setStartTime] = useState(now)
  const [endTime, setEndTime] = useState(
    new Date(now.getTime() + 60 * 60 * 1000),
  )
  const [timeField, setTimeField] = useState<TimeField | null>(null)
  const [draftTime, setDraftTime] = useState(now)

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

  const handleCreateTask = async () => {
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
      await addTask({
        title: trimmedTitle,
        description: description.trim(),
        category: selectedType,
        startAt: startTime.toISOString(),
        endAt: endTime.toISOString(),
      })
      router.back()
    } catch (error) {
      Alert.alert(
        'Не удалось создать задачу',
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
              Новая задача
            </Text>
            <Text style={{ fontSize: 14, color: '#777' }}>
              {`На ${now.toLocaleDateString('ru-RU', {
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
          accessibilityState={{ disabled: loading || storageError !== null }}
          disabled={loading || storageError !== null}
          onPress={handleCreateTask}
          style={{
            minHeight: 54,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 15,
            backgroundColor: loading || storageError !== null ? '#AFA6D8' : '#7357E8',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
            {loading ? 'Загрузка задач…' : 'Создать задачу'}
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
