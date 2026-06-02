import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import type { PartialProduct } from '@/shared/types/domain';

type Props = NativeStackScreenProps<AppStackParamList, 'Scan'>;
type ScanMode = 'scanning' | 'loading' | 'photo' | 'confirming';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;

export function ScanScreen({ navigation, route }: Props) {
  const defaultDestination: Destination = route.params?.defaultDestination ?? 'stock';
  const returnSearch = route.params?.returnSearch ?? false;

  const { householdId } = useAppState();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScanMode>('scanning');
  const [loadingMessage, setLoadingMessage] = useState('Looking up product…');
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
    setLoadingMessage('Looking up product…');
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
    setLoadingMessage('Taking photo…');
    setMode('loading');

    let base64: string | undefined;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      base64 = photo?.base64 ?? undefined;
    } catch {
      // Camera capture failed — fall through to manual fallback below.
    }
    if (!base64) {
      Alert.alert('Could not identify product', 'Please enter the product details manually.', [
        { text: 'OK', onPress: () => setMode('confirming') },
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

    setLoadingMessage('Identifying with AI…');
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
          Alert.alert('Could not identify product', 'Please enter the product details manually.', [
            { text: 'OK', onPress: () => setMode('confirming') },
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
            const msg = isAppError(err) ? err.message : 'Could not add to shopping list.';
            Alert.alert('Error', msg);
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
          const msg = isAppError(err) ? err.message : 'Could not save product.';
          Alert.alert('Error', msg);
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
        <ActivityIndicator color="#2D6A4F" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera access is required to scan barcodes.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant access</Text>
        </TouchableOpacity>
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
          <Text style={styles.hint}>Point at a barcode</Text>
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
            <Text style={styles.manualBtnText}>Enter manually</Text>
          </TouchableOpacity>
        </View>
      )}

      <Animated.View
        style={[styles.shutterFlash, { opacity: flashOpacity }]}
        pointerEvents="none"
      />

      {mode === 'loading' && (
        <View style={styles.overlayDark}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.loadingText}>{loadingMessage}</Text>
        </View>
      )}

      {mode === 'photo' && (
        <>
          <View style={styles.overlayDim} />
          <View style={styles.photoPanel}>
            <View style={styles.photoPanelBadge}>
              <Text style={styles.photoPanelBadgeText}>Barcode not in database</Text>
            </View>
            <Text style={styles.photoPanelTitle}>Identify with AI</Text>
            <Text style={styles.photoPanelBody}>
              Point the camera at the product label and take a photo. Claude will identify it for
              you.
            </Text>
            <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
              <Text style={styles.photoBtnText}>Take photo</Text>
            </TouchableOpacity>
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
              <Text style={styles.skipText}>Enter details manually instead</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  permText: { fontSize: 15, color: '#444', textAlign: 'center', marginBottom: 20 },
  permBtn: {
    backgroundColor: '#2D6A4F',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  permBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  overlayDark: {
    ...StyleSheet.absoluteFillObject,
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
    borderColor: '#52B788',
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  overlayDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  photoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 44,
    alignItems: 'center',
  },
  photoPanelBadge: {
    backgroundColor: '#FFF3CD',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  photoPanelBadgeText: { fontSize: 12, fontWeight: '600', color: '#856404' },
  photoPanelTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  photoPanelBody: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  photoBtn: {
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
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
  skipBtn: { paddingVertical: 8 },
  skipText: { color: '#2D6A4F', fontSize: 14, fontWeight: '600' },
});
