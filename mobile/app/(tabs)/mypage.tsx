import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { User, LogOut, Edit2, X, ChevronRight, Camera } from 'lucide-react-native';

export default function MyPageScreen() {
  const { user, logout, updateUser } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    height: '',
    weight: '',
    age: '',
  });

  useEffect(() => {
    if (user?.profileImage) {
      setProfileImage(user.profileImage);
    } else {
      setProfileImage(null);
    }
  }, [user]);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('정말 로그아웃 하시겠습니까?')) {
        logout();
      }
    } else {
      Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
        { text: '취소', style: 'cancel' },
        { text: '로그아웃', style: 'destructive', onPress: logout },
      ]);
    }
  };

  const openEditModal = () => {
    if (user) {
      setEditForm({
        height: user.height.toString(),
        weight: user.weight.toString(),
        age: user.age.toString(),
      });
      setModalVisible(true);
    }
  };

  const handleUpdate = async () => {
    try {
      await updateUser({
        height: parseFloat(editForm.height),
        weight: parseFloat(editForm.weight),
        age: parseInt(editForm.age, 10),
      });
      setModalVisible(false);
      Alert.alert('성공', '정보가 수정되었습니다.');
    } catch (e) {
      Alert.alert('오류', '정보 수정에 실패했습니다.');
    }
  };

  const requestImagePickerPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '이미지를 선택하려면 사진 라이브러리 접근 권한이 필요합니다.');
        return false;
      }
    }
    return true;
  };

  const convertImageToBase64 = async (uri: string): Promise<string | null> => {
    try {
      // 이미지 크기 제한을 위해 Canvas를 사용하여 리사이즈 (최대 400x400)
      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof HTMLCanvasElement !== 'undefined') {
        return new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const maxSize = 400;
            let width = img.width;
            let height = img.height;

            // 비율 유지하며 최대 크기로 리사이즈
            if (width > height) {
              if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const base64String = canvas.toDataURL('image/jpeg', 0.7);
              resolve(base64String);
            } else {
              reject(new Error('Failed to get canvas context'));
            }
          };
          img.onerror = reject;
          img.src = uri;
        });
      } else {
        // 모바일이나 Canvas가 없는 경우 기본 방법 사용
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {
      console.error('Failed to convert image to base64', e);
      return null;
    }
  };

  const handleImagePicker = async () => {
    if (!user) return;

    const hasPermission = await requestImagePickerPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      // @ts-ignore - MediaTypeOptions는 deprecated이지만 아직 작동함
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // quality를 더 낮춰서 파일 크기 감소
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      const base64Image = await convertImageToBase64(imageUri);
      
      if (base64Image) {
        try {
          await updateUser({ profileImage: base64Image });
          setProfileImage(base64Image);
          Alert.alert('성공', '프로필 이미지가 변경되었습니다.');
        } catch (e) {
          Alert.alert('오류', '프로필 이미지 저장에 실패했습니다.');
        }
      } else {
        Alert.alert('오류', '이미지 변환에 실패했습니다.');
      }
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>마이페이지</Text>
        </View>

        {/* 프로필 카드 */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage.startsWith('data:') ? profileImage : `data:image/jpeg;base64,${profileImage}` }} 
                  style={styles.avatarImage} 
                />
              ) : (
                <User color="#fff" size={40} />
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
            <TouchableOpacity onPress={openEditModal} style={styles.editButton}>
              <Edit2 color={Colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

        </View>

        {/* 통계 카드 */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>나이</Text>
              <Text style={styles.statValue}>{user.age}</Text>
              <Text style={styles.statUnit}>세</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>키</Text>
              <Text style={styles.statValue}>{user.height}</Text>
              <Text style={styles.statUnit}>cm</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>체중</Text>
              <Text style={styles.statValue}>{user.weight}</Text>
              <Text style={styles.statUnit}>kg</Text>
            </View>
          </View>
        </View>

        {/* 메뉴 리스트 */}
        <View style={styles.menuContainer}>
          <View style={[styles.menuCard, styles.menuCardWithMargin]}>
            <MenuItem title="성별" value={user.gender === 'MALE' ? '남성' : '여성'} />
          </View>
          <View style={styles.menuCard}>
            <MenuItem title="앱 버전" value="1.0.0" />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut color={Colors.danger} size={20} />
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 정보 수정 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>정보 수정</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={Colors.text} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              {/* 프로필 이미지 업로드 */}
              <View style={styles.profileImageSection}>
                <Text style={styles.label}>프로필 이미지</Text>
                <View style={styles.profileImageContainer}>
                  <View style={styles.modalAvatarContainer}>
                    {profileImage ? (
                      <Image 
                        source={{ uri: profileImage.startsWith('data:') ? profileImage : `data:image/jpeg;base64,${profileImage}` }} 
                        style={styles.modalAvatarImage} 
                      />
                    ) : (
                      <User color={Colors.textSecondary} size={40} />
                    )}
                  </View>
                  <TouchableOpacity style={styles.uploadButton} onPress={handleImagePicker}>
                    <Camera color={Colors.primary} size={20} />
                    <Text style={styles.uploadButtonText}>이미지 선택</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.label}>나이</Text>
              <TextInput
                style={styles.input}
                value={editForm.age}
                onChangeText={(text) => setEditForm({ ...editForm, age: text })}
                keyboardType="numeric"
              />
              
              <Text style={styles.label}>키 (cm)</Text>
              <TextInput
                style={styles.input}
                value={editForm.height}
                onChangeText={(text) => setEditForm({ ...editForm, height: text })}
                keyboardType="numeric"
              />

              <Text style={styles.label}>체중 (kg)</Text>
              <TextInput
                style={styles.input}
                value={editForm.weight}
                onChangeText={(text) => setEditForm({ ...editForm, weight: text })}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
              <Text style={styles.saveButtonText}>저장하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const MenuItem = ({ title, value }: { title: string, value?: string }) => (
  <View style={styles.menuItem}>
    <Text style={styles.menuTitle}>{title}</Text>
    <View style={styles.menuRight}>
      {value && <Text style={styles.menuValue}>{value}</Text>}
      {!value && <ChevronRight color={Colors.textSecondary} size={20} />}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileImageSection: {
    marginBottom: 16,
  },
  profileImageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modalAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  modalAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  uploadButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  editButton: {
    padding: 8,
  },
  statsCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statUnit: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.border,
  },
  menuContainer: {
    marginBottom: 16,
  },
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuCardWithMargin: {
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuTitle: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValue: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.danger + '33', // destructive/20
    backgroundColor: 'transparent',
  },
  logoutText: {
    color: Colors.danger,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  // Modal Styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
