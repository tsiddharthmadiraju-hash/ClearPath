import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, radius } from '../theme';
import { useI18n } from '../i18n';

interface Props {
  onCapture: (base64: string, mediaType: string) => void;
  onCancel: () => void;
  onUpload: () => void;
  onPaste: () => void;
}

export function CameraScreen({ onCapture, onCancel, onUpload, onPaste }: Props) {
  const { t } = useI18n();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoB64, setPhotoB64] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Still resolving permission status.
  if (!permission) {
    return <View style={styles.center}><ActivityIndicator color="#fff" /></View>;
  }

  // Permission not granted: explain + offer alternatives (never a dead end).
  if (!permission.granted) {
    return (
      <View style={styles.denied}>
        <Text style={styles.deniedText}>{t('camera_denied')}</Text>
        <View style={styles.deniedActions}>
          {permission.canAskAgain ? (
            <Pressable style={[styles.btn, styles.btnNavy]} onPress={() => requestPermission()}>
              <Text style={styles.btnNavyText}>{t('enable_camera')}</Text>
            </Pressable>
          ) : null}
          <Pressable style={[styles.btn, styles.btnGhost]} onPress={onUpload}><Text style={styles.btnGhostText}>{t('upload_doc')}</Text></Pressable>
          <Pressable style={[styles.btn, styles.btnGhost]} onPress={onPaste}><Text style={styles.btnGhostText}>{t('paste_text')}</Text></Pressable>
          <Pressable style={[styles.btn, styles.btnGhost]} onPress={onCancel}><Text style={styles.btnGhostText}>{t('cancel')}</Text></Pressable>
        </View>
      </View>
    );
  }

  const capture = async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      const pic = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.9 });
      if (pic?.base64) { setPhotoUri(pic.uri); setPhotoB64(pic.base64); }
    } catch {
      /* ignore — user can retry */
    }
    setBusy(false);
  };

  // Captured: review before sending (prevents wasted analyses on blurry photos).
  if (photoUri) {
    return (
      <View style={styles.full}>
        <Image source={{ uri: photoUri }} style={styles.full} resizeMode="contain" />
        <View style={styles.reviewBar}>
          <Text style={styles.hint}>{t('camera_review')}</Text>
          <View style={styles.reviewActions}>
            <Pressable style={[styles.btn, styles.btnGhostLight]} onPress={() => { setPhotoUri(null); setPhotoB64(null); }}>
              <Text style={styles.btnGhostLightText}>{t('retake')}</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnNavy]} onPress={() => photoB64 && onCapture(photoB64, 'image/jpeg')}>
              <Text style={styles.btnNavyText}>{t('use_photo')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Live camera with framing guide.
  return (
    <View style={styles.full}>
      <CameraView ref={cameraRef} style={styles.full} facing="back" />
      <View style={styles.overlay} pointerEvents="box-none">
        <Pressable style={styles.cancel} onPress={onCancel} hitSlop={8}>
          <Text style={styles.cancelText}>‹ {t('cancel')}</Text>
        </Pressable>
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <Text style={styles.hint}>{t('camera_hint')}</Text>
        <Pressable style={[styles.shutter, busy && styles.shutterBusy]} onPress={capture} disabled={busy} />
      </View>
    </View>
  );
}

const SAFE_TOP = Platform.OS === 'ios' ? 54 : 28;

const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', paddingTop: SAFE_TOP, paddingBottom: 40 },
  cancel: { position: 'absolute', top: SAFE_TOP, left: 16, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 8, zIndex: 2 },
  cancelText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  frame: { width: '78%', flex: 1, marginTop: 60, marginBottom: 0, maxHeight: '58%' },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: 'rgba(255,255,255,0.95)' },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  hint: { color: '#fff', fontSize: 14, fontWeight: '500', textAlign: 'center', marginVertical: 16, backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, overflow: 'hidden' },
  shutter: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)', marginTop: 'auto' },
  shutterBusy: { opacity: 0.5 },
  reviewBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 24, paddingBottom: 40, backgroundColor: 'rgba(0,0,0,0.55)' },
  reviewActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  denied: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 },
  deniedText: { color: colors.ink, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  deniedActions: { width: '100%', maxWidth: 320, gap: 12 },
  btn: { borderRadius: radius.btn, paddingVertical: 14, alignItems: 'center' },
  btnNavy: { backgroundColor: colors.navy, flex: 1 },
  btnNavyText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnGhost: { borderWidth: 1, borderColor: '#D1D5DB' },
  btnGhostText: { color: colors.navy, fontSize: 16, fontWeight: '600' },
  btnGhostLight: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', flex: 1 },
  btnGhostLightText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
