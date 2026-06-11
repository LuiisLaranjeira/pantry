import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AppStackParamList } from '@/app/navigation/types';
import { useAppState } from '@/app/providers/AppStateProvider';
import {
  ReceiptReviewRow,
  type ReceiptReviewItem,
} from '@/features/scan/components/ReceiptReviewRow';
import { useParseReceipt } from '@/features/scan/hooks/useParseReceipt';
import { useAddItemsToList } from '@/features/shopping/hooks/useAddItemsToList';
import { isAppError } from '@/shared/api/errors';
import { uuid } from '@/shared/lib/uuid';
import { Button, useTheme } from '@/shared/ui';

type Props = NativeStackScreenProps<AppStackParamList, 'ReceiptScan'>;
type Mode = 'capture' | 'loading' | 'review';

export function ReceiptScanScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { householdId } = useAppState();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>('capture');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [storeName, setStoreName] = useState<string | null>(null);
  const [reviewItems, setReviewItems] = useState<ReceiptReviewItem[]>([]);

  const cameraRef = useRef<CameraView>(null);
  const processingRef = useRef(false);
  const flashOpacity = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (mode === 'capture') processingRef.current = false;
  }, [mode]);

  const parseReceipt = useParseReceipt();
  const addItems = useAddItemsToList(householdId);

  const triggerFlash = () => {
    flashOpacity.setValue(1);
    Animated.timing(flashOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const takePhoto = async () => {
    if (!cameraRef.current || processingRef.current) return;
    processingRef.current = true;
    triggerFlash();
    setLoadingMessage(t('scan.takingPhoto'));
    setMode('loading');

    let photoUri: string | undefined;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      photoUri = photo?.uri;
    } catch {
      photoUri = undefined;
    }

    if (!photoUri) {
      // Reset mode before the Alert so processingRef is cleared regardless of
      // how the Alert is dismissed (button press OR Android back button).
      setMode('capture');
      Alert.alert(t('scan.couldNotReadTitle'), t('scan.couldNotReadMessage'), [
        { text: t('scan.tryAgain') },
      ]);
      return;
    }

    setLoadingMessage(t('scan.readingText'));
    parseReceipt.mutate(photoUri, {
      onSuccess: (parsed) => {
        setStoreName(parsed.store);
        setReviewItems(
          parsed.items.map((item) => ({
            id: uuid(),
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price != null ? item.unit_price.toFixed(2) : '',
            selected: true,
          })),
        );
        setMode('review');
      },
      onError: () => {
        setMode('capture');
        Alert.alert(t('scan.couldNotReadTitle'), t('scan.couldNotReadMessage'), [
          { text: t('scan.tryAgain') },
        ]);
      },
    });
  };

  const updateItem = (id: string, patch: Partial<ReceiptReviewItem>) => {
    setReviewItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const confirm = () => {
    const selected = reviewItems.filter((i) => i.selected && i.name.trim());
    if (selected.length === 0) {
      Alert.alert(t('scan.nothingSelected'), t('scan.nothingSelectedMessage'));
      return;
    }
    const items = selected.map((item) => {
      const parsed = parseFloat(item.unit_price);
      const unit_price = item.unit_price !== '' && !Number.isNaN(parsed) ? parsed : null;
      return {
        name: item.name.trim(),
        quantity: item.quantity,
        unit_price,
      };
    });
    addItems.mutate(
      { items },
      {
        onSuccess: () => navigation.goBack(),
        onError: (err) => {
          const msg = isAppError(err) ? err.message : t('scan.couldNotAddItems');
          Alert.alert(t('common.error'), msg);
        },
      },
    );
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary.base} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>{t('scan.receiptCameraPermission')}</Text>
        <Button label={t('common.grantAccess')} onPress={requestPermission} />
      </View>
    );
  }

  if (mode === 'review') {
    const selectedCount = reviewItems.filter((i) => i.selected).length;
    const saving = addItems.isPending;
    return (
      <KeyboardAvoidingView
        style={[styles.container, styles.reviewBg]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {storeName && (
          <View style={styles.storeBar}>
            <Ionicons name="storefront-outline" size={16} color={colors.primary.base} />
            <Text style={styles.storeLabel}>{storeName}</Text>
          </View>
        )}

        <FlatList
          data={reviewItems}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.reviewList}
          renderItem={({ item }) => (
            <ReceiptReviewRow item={item} onPatch={(patch) => updateItem(item.id, patch)} />
          )}
        />

        <View style={styles.footer}>
          <Button label={t('scan.retake')} variant="secondary" onPress={() => setMode('capture')} />
          <Button
            label={t('scan.addItems', { count: selectedCount })}
            onPress={confirm}
            loading={saving}
            disabled={selectedCount === 0}
            style={styles.confirmBtnGrow}
          />
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <Animated.View
        style={[styles.shutterFlash, { opacity: flashOpacity }]}
        pointerEvents="none"
      />

      {mode === 'capture' && (
        <View style={styles.captureOverlay}>
          <View style={styles.receiptGuide}>
            <Text style={styles.guideText}>{t('scan.alignReceipt')}</Text>
          </View>
          <TouchableOpacity style={styles.shutterBtn} onPress={takePhoto}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>
        </View>
      )}

      {mode === 'loading' && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.text.inverse} size="large" />
          <Text style={styles.loadingText}>{loadingMessage}</Text>
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    reviewBg: { backgroundColor: colors.bg.default },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: colors.bg.default,
    },
    permText: {
      fontSize: 15,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    camera: { flex: 1 },
    shutterFlash: { ...StyleSheet.absoluteFillObject, backgroundColor: '#fff', zIndex: 10 },
    captureOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: 56,
    },
    receiptGuide: {
      position: 'absolute',
      top: '12%',
      left: 20,
      right: 20,
      bottom: '18%',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.65)',
      borderRadius: 8,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: 12,
    },
    guideText: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: 13,
      backgroundColor: 'rgba(0,0,0,0.45)',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      overflow: 'hidden',
    },
    shutterBtn: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: 'rgba(255,255,255,0.25)',
      borderWidth: 3,
      borderColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
    },
    shutterInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff' },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    loadingText: { color: '#fff', fontSize: 16 },
    storeBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.primary.soft,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    storeLabel: { fontSize: 14, fontWeight: '600', color: colors.primary.base },
    reviewList: { padding: 12, paddingBottom: 24, gap: 8 },
    footer: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      paddingBottom: 28,
      backgroundColor: colors.bg.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    confirmBtnGrow: { flex: 1 },
  });
}
