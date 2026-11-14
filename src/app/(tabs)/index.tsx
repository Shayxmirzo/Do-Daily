import Ionicons from '@expo/vector-icons/Ionicons'
import { Alert, Pressable, SafeAreaView, ScrollView, StatusBar, Text, View } from 'react-native'
import { useState, useEffect } from 'react';
import { router, type Href } from 'expo-router';
import { useTasks } from '../../context/task-context'
import type { TaskCategory, TaskPriority, TaskStatus } from '../../types/task'

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

function formatTaskTime(value: string) {
  return new Date(value).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Index() {
  const [time, setTime] = useState(new Date());
  const { tasks, loading, storageError, updateTask, deleteTask } = useTasks()
  useEffect(() => {
  const interval = setInterval(() => {
    setTime(new Date());
  }, 60000);

  return () => clearInterval(interval);
}, []);
const currentDate = time.toLocaleDateString('ru-RU', {
  day: 'numeric',
  month: 'long',
  weekday: 'long',
});

const completedTasks = tasks.filter((task) => task.status === 'completed').length
const remainingTasks = tasks.filter(
  (task) => task.status === 'pending' && Date.parse(task.endAt) >= time.getTime(),
).length
const overdueTasks = tasks.filter(
  (task) => task.status === 'pending' && Date.parse(task.endAt) < time.getTime(),
).length

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
        <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 110, position: 'relative' }}>
        <View style={{ paddingHorizontal: 0,paddingTop: 40, paddingVertical: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <Text style={{fontSize: 30, fontWeight: "bold"}}>Do-Daily</Text>
           <Ionicons name="notifications-outline" size={30} color="#333" />
        </View>
        <View style={{gap: 8}}>
            <Text style={{fontSize: 24, fontWeight: 'bold'}}>Привет! UserName</Text>
            <Text style={{fontSize: 16,color: "#777", fontWeight: "semibold"}}>Давайте сделаем этот день продуктивным!</Text>
        </View>
        <View style={{flexDirection:"row", position: "relative", padding: 14, alignItems: "center", gap: 14, paddingVertical: 15, width: "100%", backgroundColor: "white", borderWidth: 1, borderColor: "black", borderRadius: 15,}}>
          <Ionicons name='calendar-outline' size={30} color={"#6C5DD3"}/>
          <View style={{flex: 1, gap: 2}}>
            <Text style={{flex: 1, fontSize: 12, fontWeight: "500"}}>Сегодня</Text>
            <Text style={{flex: 1, fontSize: 16, fontWeight: "bold"}}>{currentDate}</Text>
            <Text style={{flex: 1, fontSize: 14, fontWeight: "600"}}>
              {time.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
        <View style={{flexDirection: "row", flex: 1, gap: 12}}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEEEEE', borderRadius: 15, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }}>
            <Ionicons name='apps' size={24} color={"#8975D9"}/>
            <Text style={{ fontSize: 16, fontWeight: '700' }}>{tasks.length}</Text>
            <Text style={{ fontSize: 12, color: '#777' }}>Всего</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEEEEE', borderRadius: 15, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }}>
            <Ionicons name='checkmark-circle' size={24} color={"green"}/>
            <Text style={{ fontSize: 16, fontWeight: '700' }}>{completedTasks}</Text>
            <Text style={{ fontSize: 12, color: '#777' }}>Выполнено</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEEEEE', borderRadius: 15, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }}>
            <Ionicons name='time' size={24} color={"orange"}/>
            <Text style={{ fontSize: 16, fontWeight: '700' }}>{remainingTasks}</Text>
            <Text style={{ fontSize: 12, color: '#777' }}>Осталось</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEEEEE', borderRadius: 15, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }}>
            <Ionicons name='alert-circle' size={24} color={"red"}/>
            <Text style={{ fontSize: 16, fontWeight: '700' }}>{overdueTasks}</Text>
            <Text style={{ fontSize: 12, color: '#777' }}>Просрочен</Text>
          </View>
        </View>
        <View>
          <View style={{flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between"}}>
            <Text style={{fontSize: 24, fontWeight: 'bold'}}>Мои задачи</Text>
            <Pressable onPress={() => router.push('/(tabs)/categories' as Href)}>
              <Text style={{fontSize: 20, fontWeight: 'bold', color: "gray"}}>
                Все {'>'}
              </Text>
            </Pressable>
          </View>
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
          <View style={{ marginTop: 14, gap: 12 }}>
            {tasks.map((task) => {
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

export default Index