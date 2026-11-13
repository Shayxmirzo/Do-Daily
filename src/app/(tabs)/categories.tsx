import { useTasks } from '@/context/task-context'
import type { TaskCategory, TaskPriority, TaskStatus } from '../../types/task'
import Ionicons from "@expo/vector-icons/Ionicons"
import { router, type Href } from "expo-router"
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, StatusBar, Text, View } from "react-native"
import { useState } from 'react'

type CategoryFilter = TaskCategory | 'all'
type PriorityFilter = TaskPriority | 'all'

const categoryFilters: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'health', label: 'Здоровье' },
  { value: 'study', label: 'Учёба' },
  { value: 'personal', label: 'Личное' },
]

const priorityFilters: { value: PriorityFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
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

function FilterColumn<T extends string>({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string
  options: { value: T; label: string }[]
  selected: T
  onSelect: (value: T) => void
}) {
  return (
    <View style={{ flex: 1, gap: 8 }}>
      <Text style={{ marginBottom: 2, fontSize: 14, fontWeight: '600', color: '#777' }}>
        {title}
      </Text>
      {options.map((option) => {
        const isSelected = selected === option.value
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(option.value)}
            style={{
              minHeight: 46,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 4,
              paddingHorizontal: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isSelected ? '#7357E8' : '#E8E6ED',
              backgroundColor: isSelected ? '#F0ECFF' : '#FFFFFF',
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: isSelected ? '600' : '500',
                color: isSelected ? '#6C5DD3' : '#444',
              }}
            >
              {option.label}
            </Text>
            {isSelected ? (
              <Ionicons name="checkmark" size={16} color="#6C5DD3" />
            ) : null}
          </Pressable>
        )
      })}
    </View>
  )
}

function formatTaskTime(value: string) {
  return new Date(value).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}


function Categories() {
  const [filtersVisible, setFiltersVisible] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all')
  const [selectedPriority, setSelectedPriority] = useState<PriorityFilter>('all')
  const { tasks, loading, storageError, updateTask, deleteTask } = useTasks()
  const filteredTasks = tasks.filter(
    (task) =>
      (selectedCategory === 'all' || task.category === selectedCategory) &&
      (selectedPriority === 'all' || task.priority === selectedPriority),
  )

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
            error instanceof Error ? error.message : 'Произошла ошибка хранилища.',
          )
        }
      },
    },
  ])
}

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffff' }}>
         <StatusBar barStyle="dark-content" />
         <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 110, position: 'relative' }}>
            <View style={{ paddingHorizontal: 0,paddingTop: 40, paddingVertical: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: "flex-end"}}>
            <Text style={{fontSize: 30, fontWeight: "bold"}}>Фильтры</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Открыть фильтры задач"
              onPress={() => setFiltersVisible(true)}
            >
                <Ionicons name="funnel-outline" size={30} color="#333" />
            </Pressable>
            </View>
            <View>
                {storageError ? (
            <Text style={{ marginTop: 12, color: '#B42318', fontSize: 13 }}>
              Не удалось загрузить задачи: {storageError}
            </Text>
          ) : null}
          {loading ? (
            <Text style={{ marginTop: 14, color: '#777', fontSize: 14 }}>
              Загрузка задач…
            </Text>
          ) : null}
          {!loading && !storageError && tasks.length === 0 ? (
            <View
              style={{
                marginTop: 14,
                padding: 18,
                alignItems: 'center',
                gap: 6,
                borderRadius: 15,
                backgroundColor: '#F8F7FC',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#555' }}>
                Пока нет задач
              </Text>
              <Text style={{ fontSize: 13, color: '#888', textAlign: 'center' }}>
                Нажмите «+», чтобы добавить первую задачу
              </Text>
            </View>
          ) : null}
          {!loading && !storageError && tasks.length > 0 && filteredTasks.length === 0 ? (
            <View
              style={{
                marginTop: 14,
                padding: 18,
                alignItems: 'center',
                gap: 6,
                borderRadius: 15,
                backgroundColor: '#F8F7FC',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#555' }}>
                Нет задач по выбранным фильтрам
              </Text>
              <Text style={{ fontSize: 13, color: '#888', textAlign: 'center' }}>
                Измените тип или приоритет задачи
              </Text>
            </View>
          ) : null}
          <View style={{ marginTop: 14, gap: 12 }}>
            {filteredTasks.map((task) => {
              const nextStatus =
                task.status === 'pending' ? 'completed' : 'pending'
              const priorityColor = priorityColors[task.priority]

              return (
                <View
                  key={task.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: '#F0EFF5',
                    borderRadius: 18,
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#211B3A',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: task.status === 'completed' }}
                    accessibilityLabel={
                      task.status === 'completed'
                        ? `Вернуть задачу ${task.title} в активные`
                        : `Отметить задачу ${task.title} выполненной`
                    }
                    onPress={() => handleUpdateStatus(task.id, nextStatus)}
                    hitSlop={10}
                  >
                    <Ionicons
                      name={
                        task.status === 'completed'
                          ? 'checkmark-circle'
                          : 'ellipse-outline'
                      }
                      size={25}
                      color={task.status === 'completed' ? '#6C5DD3' : '#C9C7D1'}
                    />
                  </Pressable>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: task.status === 'completed' ? '#8C8995' : '#292733',
                        textDecorationLine:
                          task.status === 'completed' ? 'line-through' : 'none',
                      }}
                    >
                      {task.title}
                    </Text>
                    {task.description ? (
                      <Text
                        numberOfLines={1}
                        style={{ fontSize: 12, color: '#898692' }}
                      >
                        {task.description}
                      </Text>
                    ) : null}
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: '#6C5DD3' }}>
                        {formatTaskTime(task.startAt)}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#B5B2BC' }}>·</Text>
                      <Text style={{ fontSize: 12, color: '#777' }}>
                        {categoryLabels[task.category]}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <View
                      style={{
                        paddingHorizontal: 9,
                        paddingVertical: 4,
                        borderRadius: 10,
                        backgroundColor: priorityColor.background,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '600',
                          color: priorityColor.color,
                        }}
                      >
                        {priorityLabels[task.priority]}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#AAA7B1"
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
            </View>
         </ScrollView>
         <Modal
           animationType="slide"
           onRequestClose={() => setFiltersVisible(false)}
           transparent
           visible={filtersVisible}
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
               <Text style={{ marginBottom: 18, fontSize: 20, fontWeight: '700', color: '#222' }}>
                 Фильтры задач
               </Text>
               <View style={{ flexDirection: 'row', gap: 14 }}>
                 <FilterColumn
                   title="Тип"
                   options={categoryFilters}
                   selected={selectedCategory}
                   onSelect={setSelectedCategory}
                 />
                 <FilterColumn
                   title="Приоритет"
                   options={priorityFilters}
                   selected={selectedPriority}
                   onSelect={setSelectedPriority}
                 />
               </View>
               <Pressable
                 accessibilityRole="button"
                 onPress={() => setFiltersVisible(false)}
                 style={{
                   minHeight: 48,
                   alignItems: 'center',
                   justifyContent: 'center',
                   marginTop: 20,
                   borderRadius: 13,
                   backgroundColor: '#7357E8',
                 }}
               >
                 <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                   Готово
                 </Text>
               </Pressable>
             </View>
           </View>
         </Modal>
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
    </SafeAreaView>
  )
}

export default Categories