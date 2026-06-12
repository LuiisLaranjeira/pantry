import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AppStackParamList } from '@/app/navigation/types';
import { useAppState } from '@/app/providers/AppStateProvider';
import { useIdentifyProduct } from '@/features/scan/hooks/useIdentifyProduct';
import { useResolveBarcode } from '@/features/scan/hooks/useResolveBarcode';
import { useAddItemFromManual } from '@/features/shopping/hooks/useAddItemFromManual';
import { useAddStockFromManual } from '@/features/stock/hooks/useAddStockFromManual';
import { isAppError } from '@/shared/api/errors';
import { ProductConfirmSheet, type Destination } from '@/shared/components/ProductConfirmSheet';
import { manualBarcode } from '@/shared/lib/uuid';
import { Button, useTheme } from '@/shared/ui';
import type { PartialProduct } from '@/shared/types/domain';

type Props = NativeStackScreenProps<AppStackParamList, 'Scan'>;
type ScanMode = 'scanning' | 'loading' | 'photo' | 'confirming';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;

export function ScanScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const defaultDestination: Destination = route.params?.defaultDestination ?? 'stock';
  const returnSearch = route.params?.returnSearch ?? false;

  const { householdId } = useAppState();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScanMode>('scanning');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [product, setProduct] = useState<PartialProduct | null>(null);
  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null);

  const cameraRef = useRef<CameraView>(null);
  const scannedRef = useRef(false);
  const flashOpacity = useMemo(() => new Animated.Value(0), []);

  const resolveBarcode = useResolveBarcode();
  const identifyProduct = useIdentifyProduct();
  const addStock = useAddStockFromManual(householdId);
  const addToList = useAddItemFromManual(householdId);

  useEffect(() => {
    if (mode === 'scanning') scannedRef.current = false;
  }, [mode]);

  const handleBarcode = ({ data: barcode }: { data: string }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setLoadingMessage(t('scan.lookingUp'));
    setMode('loading');
    setPendingBarcode(barcode);

    resolveBarcode.mutate(barcode, {
      onSuccess: ({ local, remote }) => {
        if (returnSearch) {
          const name = local?.name ?? remote?.name ?? '';
          setProduct(null);
          setPendingBarcode(null);
          setMode('scanning');
          navigation.navigate('Main', { screen: 'Pantry', params: { searchQuery: name } });
          return;
        }
        if (local) {
          setProduct(local);
          setMode('confirming');
          return;
        }
        if (remote) {
          setProduct(remote);
          setMode('confirming');
          return;
        }
        setMode('photo');
      },
      onError: () => {
        // Network / unexpected failure — let user try the photo flow.
        setMode('photo');
      },
    });
  };

  const triggerShutterFlash = () => {
    flashOpacity.setValue(1);
    Animated.timing(flashOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    triggerShutterFlash();
    setLoadingMessage(t('scan.takingPhoto'));
    setMode('loading');

    let base64: string | undefined;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      base64 = photo?.base64 ?? undefined;
    } catch {
      // Camera capture failed — fall through to manual fallback below.
    }
    if (!base64) {
      Alert.alert(t('scan.couldNotIdentifyTitle'), t('scan.couldNotIdentifyMessage'), [
        { text: t('common.ok'), onPress: () => setMode('confirming') },
      ]);
      setProduct({
        barcode: pendingBarcode ?? '',
        name: '',
        brand: null,
        category: null,
        package_unit: null,
        unit_price: null,
        country: null,
      });
      return;
    }

    setLoadingMessage(t('scan.identifyingAI'));
    identifyProduct.mutate(
      { base64, barcode: pendingBarcode },
      {
        onSuccess: (identified) => {
          setProduct({
            ...identified,
            country: resolveBarcode.data?.country ?? null,
          });
          setMode('confirming');
        },
        onError: () => {
          Alert.alert(t('scan.couldNotIdentifyTitle'), t('scan.couldNotIdentifyMessage'), [
            { text: t('common.ok'), onPress: () => setMode('confirming') },
          ]);
          setProduct({
            barcode: pendingBarcode ?? '',
            name: '',
            brand: null,
            category: null,
            package_unit: null,
            unit_price: null,
            country: null,
          });
        },
      },
    );
  };

  const handleConfirm = (
    confirmedProduct: PartialProduct,
    quantity: number,
    destination: Destination,
    unitPrice: number | null,
  ) => {
    if (destination === 'list') {
      addToList.mutate(
        { product: confirmedProduct, quantity, unitPrice },
        {
          onSuccess: () => {
            setProduct(null);
            setPendingBarcode(null);
            setMode('scanning');
            setTimeout(() => navigation.navigate('Main', { screen: 'Shopping' }), 300);
          },
          onError: (err) => {
            const msg = isAppError(err) ? err.message : t('scan.couldNotAddToList');
            Alert.alert(t('common.error'), msg);
          },
        },
      );
      return;
    }

    addStock.mutate(
      { product: confirmedProduct, quantity, unitPrice },
      {
        onSuccess: () => {
          navigation.goBack();
        },
        onError: (err) => {
          const msg = isAppError(err) ? err.message : t('scan.couldNotSave');
          Alert.alert(t('common.error'), msg);
        },
      },
    );
  };

  const reset = () => {
    setProduct(null);
    setPendingBarcode(null);
    setMode('scanning');
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
        <Text style={styles.permText}>{t('scan.cameraPermission')}</Text>
        <Button label={t('common.grantAccess')} onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
        onBarcodeScanned={mode === 'scanning' ? handleBarcode : undefined}
      />

      {mode === 'scanning' && (
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.hint}>{t('scan.pointAtBarcode')}</Text>
          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => {
              setProduct({
                barcode: manualBarcode(),
                name: '',
                brand: null,
                category: null,
                package_unit: null,
                unit_price: null,
                country: null,
              });
              setMode('confirming');
            }}
          >
            <Text style={styles.manualBtnText}>{t('scan.enterManually')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <Animated.View
        style={[styles.shutterFlash, { opacity: flashOpacity }]}
        pointerEvents="none"
      />

      {mode === 'loading' && (
        <View style={styles.overlayDark}>
          <ActivityIndicator color={colors.text.inverse} size="large" />
          <Text style={styles.loadingText}>{loadingMessage}</Text>
        </View>
      )}

      {mode === 'photo' && (
        <>
          <View style={styles.overlayDim} />
          <View style={styles.photoPanel}>
            <View style={styles.photoPanelBadge}>
              <Text style={styles.photoPanelBadgeText}>{t('scan.barcodeNotInDB')}</Text>
            </View>
            <Text style={styles.photoPanelTitle}>{t('scan.identifyWithAI')}</Text>
            <Text style={styles.photoPanelBody}>{t('scan.identifyBody')}</Text>
            <Button label={t('scan.takePhoto')} onPress={takePhoto} size="lg" fullWidth />
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => {
                setProduct({
                  barcode: pendingBarcode ?? '',
                  name: '',
                  brand: null,
                  category: null,
                  package_unit: null,
                  unit_price: null,
                  country: null,
                });
                setMode('confirming');
              }}
            >
              <Text style={styles.skipText}>{t('scan.enterManuallyInstead')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <ProductConfirmSheet
        visible={mode === 'confirming'}
        product={product}
        defaultDestination={defaultDestination}
        onConfirm={handleConfirm}
        onCancel={reset}
      />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1 },
    camera: { flex: 1 },
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
    overlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    overlayDark: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    loadingText: { color: '#fff', fontSize: 16 },
    scanFrame: {
      width: 240,
      height: 120,
      borderWidth: 2,
      borderColor: colors.primary.accent,
      borderRadius: 8,
      backgroundColor: 'transparent',
    },
    hint: {
      marginTop: 20,
      color: '#fff',
      fontSize: 15,
      backgroundColor: 'rgba(0,0,0,0.45)',
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      overflow: 'hidden',
    },
    shutterFlash: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: '#fff',
      zIndex: 10,
    },
    overlayDim: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    photoPanel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.bg.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 28,
      paddingBottom: 44,
      alignItems: 'center',
    },
    photoPanelBadge: {
      backgroundColor: colors.warning.soft,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginBottom: 16,
    },
    photoPanelBadgeText: { fontSize: 12, fontWeight: '600', color: colors.warning.text },
    photoPanelTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 8,
    },
    photoPanelBody: {
      fontSize: 14,
      color: colors.text.subtle,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    manualBtn: {
      marginTop: 32,
      backgroundColor: 'rgba(0,0,0,0.45)',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.4)',
    },
    manualBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    skipBtn: { paddingVertical: 8, marginTop: 8 },
    skipText: { color: colors.primary.base, fontSize: 14, fontWeight: '600' },
  });
}
