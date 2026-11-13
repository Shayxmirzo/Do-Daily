import Ionicons from '@expo/vector-icons/Ionicons'
import { router, type Href } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTasks } from '../../context/task-context'
import {
  defaultUserProfile,
  loadUserProfile,
  saveUserProfile,
  type UserProfile,
} from '../../storage/user-storage'

const avatarPresets = ['⚡', '🚀', '🎯', '🦁', '🌟', '🎨', '🧠', '🏆', '☕', '🔥']

export default function ProfileScreen() {
  const { tasks, deleteTask } = useTasks()
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false)

  // Edit form state
  const [draftName, setDraftName] = useState('')
  const [draftEmail, setDraftEmail] = useState('')
  const [draftBio, setDraftBio] = useState('')
  const [draftEmoji, setDraftEmoji] = useState('⚡')

  // Load persisted user profile on mount
  useEffect(() => {
    loadUserProfile().then((loaded) => {
      setProfile(loaded)
    })
  }, [])

  // User statistics based on tasks
  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === 'completed').length,
    [tasks],
  )
  const totalTasks = tasks.length
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Gamification: XP & Level system
  const xp = completedTasks * 35
  const xpPerLevel = 100
  const currentLevel = Math.floor(xp / xpPerLevel) + 1
  const xpInCurrentLevel = xp % xpPerLevel
  const xpProgressPercent = Math.min(Math.round((xpInCurrentLevel / xpPerLevel) * 100), 100)

  const levelTitle = useMemo(() => {
    if (currentLevel === 1) return 'Новичок'
    if (currentLevel === 2) return 'Энтузиаст'
    if (currentLevel === 3) return 'Мастер фокуса'
    if (currentLevel === 4) return 'Стратег'
    return 'Легенда Do-Daily'
  }, [currentLevel])

  // Count study tasks completed for achievements
  const studyTasksCompleted = useMemo(
    () => tasks.filter((t) => t.category === 'study' && t.status === 'completed').length,
    [tasks],
  )

  // Achievements definition
  const achievements = useMemo(
    () => [
      {
        id: 'first_step',
        icon: 'rocket-outline',
        title: 'Первый шаг',
        description: 'Выполните хотя бы 1 задачу',
        unlocked: completedTasks >= 1,
        color: '#7557E8',
      },
      {
        id: 'on_fire',
        icon: 'flame-outline',
        title: 'В ударе',
        description: 'Выполните 5 задач',
        unlocked: completedTasks >= 5,
        color: '#FF6B00',
      },
      {
        id: 'scholar',
        icon: 'school-outline',
        title: 'Знаток',
        description: 'Завершите 3 задачи в сфере учёбы',
        unlocked: studyTasksCompleted >= 3,
        color: '#18A765',
      },
      {
        id: 'champion',
        icon: 'trophy-outline',
        title: 'Чемпион',
        description: 'Выполните 10 любых задач',
        unlocked: completedTasks >= 10,
        color: '#E78A20',
      },
    ],
    [completedTasks, studyTasksCompleted],
  )

  // Open edit modal and preload fields
  const handleOpenEdit = () => {
    setDraftName(profile.name)
    setDraftEmail(profile.email)
    setDraftBio(profile.bio)
    setDraftEmoji(profile.avatarEmoji)
    setIsEditModalOpen(true)
  }

  // Save updated profile
  const handleSaveProfile = async () => {
    const trimmedName = draftName.trim() || 'Пользователь'
    const updated: UserProfile = {
      ...profile,
      name: trimmedName,
      email: draftEmail.trim(),
      bio: draftBio.trim(),
      avatarEmoji: draftEmoji,
    }
    setProfile(updated)
    await saveUserProfile(updated)
    setIsEditModalOpen(false)
  }

  // Toggle notification preference
  const handleToggleNotifications = async (val: boolean) => {
    const updated = { ...profile, notificationsEnabled: val }
    setProfile(updated)
    await saveUserProfile(updated)
  }

  // Toggle sound preference
  const handleToggleSounds = async (val: boolean) => {
    const updated = { ...profile, soundsEnabled: val }
    setProfile(updated)
    await saveUserProfile(updated)
  }

  // Adjust daily goal
  const handleAdjustGoal = useCallback(
    async (delta: number) => {
      const newGoal = Math.max(1, Math.min(30, profile.dailyGoal + delta))
      const updated = { ...profile, dailyGoal: newGoal }
      setProfile(updated)
      await saveUserProfile(updated)
    },
    [profile],
  )

  // Clear completed tasks
  const handleClearCompleted = () => {
    const completedList = tasks.filter((t) => t.status === 'completed')
    if (completedList.length === 0) {
      Alert.alert('Нет задач', 'У вас нет завершённых задач для очистки.')
      return
    }

    Alert.alert(
      'Очистить завершённые?',
      `Будет удалено завершённых задач: ${completedList.length}.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Очистить',
          style: 'destructive',
          onPress: async () => {
            for (const t of completedList) {
              await deleteTask(t.id)
            }
          },
        },
      ],
    )
  }

  // Reset all tasks
  const handleResetAllTasks = () => {
    if (tasks.length === 0) {
      Alert.alert('Нет задач', 'Список задач уже пуст.')
      return
    }

    Alert.alert(
      'Сбросить все задачи?',
      'Все ваши текущие и выполненные задачи будут удалены. Это действие необратимо.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить всё',
          style: 'destructive',
          onPress: async () => {
            for (const t of tasks) {
              await deleteTask(t.id)
            }
          },
        },
      ],
    )
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Card Header */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarEmoji}>{profile.avatarEmoji}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Сменить эмодзи аватара"
              onPress={handleOpenEdit}
              style={styles.avatarEditBadge}
            >
              <Ionicons name="pencil" size={14} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.userInfoWrap}>
            <Text style={styles.userName}>{profile.name}</Text>
            {profile.email ? <Text style={styles.userEmail}>{profile.email}</Text> : null}
            {profile.bio ? <Text style={styles.userBio}>«{profile.bio}»</Text> : null}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleOpenEdit}
            style={styles.editProfileButton}
          >
            <Ionicons name="create-outline" size={16} color="#6C5DD3" />
            <Text style={styles.editProfileButtonText}>Редактировать профиль</Text>
          </Pressable>
        </View>

        {/* Level & XP Gamification Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelBadgeWrap}>
              <View style={styles.levelIconBadge}>
                <Ionicons name="star" size={16} color="#FFD700" />
              </View>
              <View>
                <Text style={styles.levelSubtitle}>Уровень {currentLevel}</Text>
                <Text style={styles.levelTitle}>{levelTitle}</Text>
              </View>
            </View>
            <View style={styles.xpWrap}>
              <Text style={styles.xpText}>{xp} XP</Text>
            </View>
          </View>

          {/* XP Progress Bar */}
          <View style={styles.xpBarTrack}>
            <View
              style={[
                styles.xpBarFill,
                { width: `${Math.max(xpProgressPercent, 5)}%` },
              ]}
            />
          </View>

          <View style={styles.xpFooter}>
            <Text style={styles.xpFooterText}>
              Прогресс уровня: {xpInCurrentLevel} / {xpPerLevel} XP
            </Text>
            <Text style={styles.xpFooterText}>
              До след. уровня: {xpPerLevel - xpInCurrentLevel} XP
            </Text>
          </View>
        </View>

        {/* 3 Stats Overview Columns */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{totalTasks}</Text>
            <Text style={styles.statBoxLabel}>Всего задач</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statBoxValue, { color: '#18A765' }]}>{completedTasks}</Text>
            <Text style={styles.statBoxLabel}>Выполнено</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statBoxValue, { color: '#6C5DD3' }]}>{completionRate}%</Text>
            <Text style={styles.statBoxLabel}>Эффективность</Text>
          </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Достижения</Text>
            <Text style={styles.sectionSubCount}>
              {achievements.filter((a) => a.unlocked).length} из {achievements.length}
            </Text>
          </View>

          <View style={styles.achievementsGrid}>
            {achievements.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.achievementItem,
                  !item.unlocked && styles.achievementItemLocked,
                ]}
              >
                <View
                  style={[
                    styles.achievementIconCircle,
                    {
                      backgroundColor: item.unlocked ? `${item.color}20` : '#F0EEF5',
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={item.unlocked ? item.color : '#9E9EB2'}
                  />
                </View>

                <View style={styles.achievementTextWrap}>
                  <Text
                    style={[
                      styles.achievementTitle,
                      !item.unlocked && styles.achievementTitleLocked,
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.achievementDesc}>{item.description}</Text>
                </View>

                {item.unlocked ? (
                  <Ionicons name="checkmark-circle" size={20} color="#18A765" />
                ) : (
                  <Ionicons name="lock-closed-outline" size={18} color="#AAA8BA" />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Daily Goal Setting */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Дневная цель</Text>
          <View style={styles.goalRow}>
            <View style={styles.goalInfo}>
              <Text style={styles.goalCountText}>{profile.dailyGoal} задач</Text>
              <Text style={styles.goalSubText}>Рекомендуемый план на каждый день</Text>
            </View>

            <View style={styles.goalControls}>
              <Pressable
                onPress={() => handleAdjustGoal(-1)}
                style={styles.goalBtn}
                accessibilityRole="button"
                accessibilityLabel="Уменьшить дневную цель"
              >
                <Ionicons name="remove" size={20} color="#6C5DD3" />
              </Pressable>

              <Pressable
                onPress={() => handleAdjustGoal(1)}
                style={styles.goalBtn}
                accessibilityRole="button"
                accessibilityLabel="Увеличить дневную цель"
              >
                <Ionicons name="add" size={20} color="#6C5DD3" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Settings & Preferences */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Настройки</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={22} color="#6C5DD3" />
              <View>
                <Text style={styles.settingTitle}>Уведомления</Text>
                <Text style={styles.settingSubtitle}>Напоминания о предстоящих задачах</Text>
              </View>
            </View>
            <Switch
              value={profile.notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#D4D2E3', true: '#B7ACF7' }}
              thumbColor={profile.notificationsEnabled ? '#6C5DD3' : '#F4F3F9'}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="volume-medium-outline" size={22} color="#6C5DD3" />
              <View>
                <Text style={styles.settingTitle}>Звуки и тактильный отклик</Text>
                <Text style={styles.settingSubtitle}>Оповещения при завершении дел</Text>
              </View>
            </View>
            <Switch
              value={profile.soundsEnabled}
              onValueChange={handleToggleSounds}
              trackColor={{ false: '#D4D2E3', true: '#B7ACF7' }}
              thumbColor={profile.soundsEnabled ? '#6C5DD3' : '#F4F3F9'}
            />
          </View>
        </View>

        {/* Data & About Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Данные и приложение</Text>

          <Pressable onPress={handleClearCompleted} style={styles.actionRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="checkmark-done-outline" size={22} color="#18A765" />
              <Text style={styles.actionText}>Очистить выполненные задачи</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9E9EB2" />
          </Pressable>

          <Pressable onPress={handleResetAllTasks} style={styles.actionRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={22} color="#E5484D" />
              <Text style={[styles.actionText, { color: '#E5484D' }]}>
                Сбросить все задачи
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9E9EB2" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/onboarding' as Href)}
            style={styles.actionRow}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="sparkles-outline" size={22} color="#6C5DD3" />
              <Text style={styles.actionText}>Посмотреть онбординг</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9E9EB2" />
          </Pressable>

          <Pressable
            onPress={() => setIsAboutModalOpen(true)}
            style={[styles.actionRow, { borderBottomWidth: 0 }]}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={22} color="#6C5DD3" />
              <Text style={styles.actionText}>О приложении Do-Daily</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9E9EB2" />
          </Pressable>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Редактировать профиль</Text>
              <Pressable
                onPress={() => setIsEditModalOpen(false)}
                hitSlop={10}
              >
                <Ionicons name="close" size={24} color="#717382" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              {/* Emoji avatar selector */}
              <Text style={styles.inputLabel}>Выберите иконку профиля</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.emojiList}
              >
                {avatarPresets.map((emoji) => {
                  const selected = draftEmoji === emoji
                  return (
                    <Pressable
                      key={emoji}
                      onPress={() => setDraftEmoji(emoji)}
                      style={[styles.emojiPill, selected && styles.emojiPillSelected]}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </Pressable>
                  )
                })}
              </ScrollView>

              {/* Name input */}
              <Text style={styles.inputLabel}>Ваше имя</Text>
              <TextInput
                style={styles.textInput}
                value={draftName}
                onChangeText={setDraftName}
                placeholder="Как вас зовут?"
                placeholderTextColor="#A1A4B5"
              />

              {/* Email input */}
              <Text style={styles.inputLabel}>Email или логин</Text>
              <TextInput
                style={styles.textInput}
                value={draftEmail}
                onChangeText={setDraftEmail}
                placeholder="example@mail.com"
                placeholderTextColor="#A1A4B5"
                autoCapitalize="none"
                keyboardType="email-address"
              />

              {/* Bio input */}
              <Text style={styles.inputLabel}>Девиз / Цель</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={draftBio}
                onChangeText={setDraftBio}
                placeholder="Напишите короткую мотивирующую фразу..."
                placeholderTextColor="#A1A4B5"
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            {/* Modal Buttons */}
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setIsEditModalOpen(false)}
                style={styles.cancelModalBtn}
              >
                <Text style={styles.cancelModalBtnText}>Отмена</Text>
              </Pressable>

              <Pressable onPress={handleSaveProfile} style={styles.saveModalBtn}>
                <Text style={styles.saveModalBtnText}>Сохранить</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* About App Modal */}
      <Modal
        visible={isAboutModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsAboutModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 360 }]}>
            <View style={styles.aboutCenter}>
              <View style={styles.aboutAppIcon}>
                <Ionicons name="checkbox" size={42} color="#6C5DD3" />
              </View>
              <Text style={styles.aboutAppName}>Do-Daily</Text>
              <Text style={styles.aboutVersion}>Версия 1.0.0 (Expo SDK 58)</Text>
              <Text style={styles.aboutDescription}>
                Do-Daily — ваш личный помощник для ежедневных задач, формирования привычек и
                достижения баланса между здоровьем, учёбой и личной жизнью.
              </Text>
            </View>

            <Pressable
              onPress={() => setIsAboutModalOpen(false)}
              style={styles.aboutCloseBtn}
            >
              <Text style={styles.aboutCloseBtnText}>Закрыть</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#ECEBF3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrap: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ECEBF3',
  },
  avatarEmoji: {
    fontSize: 44,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6C5DD3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfoWrap: {
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1F24',
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 14,
    color: '#717382',
    fontWeight: '500',
  },
  userBio: {
    fontSize: 13,
    color: '#8E91A4',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 12,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F0ECFF',
    marginTop: 4,
  },
  editProfileButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6C5DD3',
  },
  levelCard: {
    backgroundColor: '#6C5DD3',
    borderRadius: 20,
    padding: 20,
    gap: 14,
    shadowColor: '#6C5DD3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelSubtitle: {
    fontSize: 12,
    color: '#E0DBFF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  xpWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  xpBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  xpFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpFooterText: {
    fontSize: 12,
    color: '#E0DBFF',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#ECEBF3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  statBoxValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1F24',
  },
  statBoxLabel: {
    fontSize: 11,
    color: '#717382',
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
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
  sectionSubCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C5DD3',
  },
  achievementsGrid: {
    gap: 10,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FAF9FE',
    borderWidth: 1,
    borderColor: '#ECEBF3',
    gap: 12,
  },
  achievementItemLocked: {
    opacity: 0.65,
    backgroundColor: '#FBFBFD',
  },
  achievementIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementTextWrap: {
    flex: 1,
    gap: 2,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1F24',
  },
  achievementTitleLocked: {
    color: '#717382',
  },
  achievementDesc: {
    fontSize: 12,
    color: '#717382',
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalInfo: {
    gap: 2,
  },
  goalCountText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#6C5DD3',
  },
  goalSubText: {
    fontSize: 13,
    color: '#717382',
  },
  goalControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F2F8',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1F24',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#717382',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F2F8',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1F24',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
    gap: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1F24',
  },
  modalBody: {
    maxHeight: 380,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B4D5A',
    marginTop: 14,
    marginBottom: 6,
  },
  emojiList: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 6,
  },
  emojiPill: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F2F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiPillSelected: {
    borderColor: '#6C5DD3',
    backgroundColor: '#F0ECFF',
  },
  emojiText: {
    fontSize: 24,
  },
  textInput: {
    backgroundColor: '#F6F5FA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E1F24',
    borderWidth: 1,
    borderColor: '#E7E6F0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F3F2F8',
    alignItems: 'center',
  },
  cancelModalBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#717382',
  },
  saveModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#6C5DD3',
    alignItems: 'center',
  },
  saveModalBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aboutCenter: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  aboutAppIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutAppName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E1F24',
  },
  aboutVersion: {
    fontSize: 13,
    color: '#717382',
    fontWeight: '600',
  },
  aboutDescription: {
    fontSize: 14,
    color: '#555869',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
  },
  aboutCloseBtn: {
    backgroundColor: '#6C5DD3',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  aboutCloseBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
})
