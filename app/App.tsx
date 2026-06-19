import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, StatusBar, Pressable } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import { colors } from './src/theme';
import type { Analysis, AnalyzeInput } from './src/types';
import { analyze, translateAnalysis, AnalyzeError } from './src/api';
import { EXAMPLES } from './src/examples';
import { initLang, useI18n, langMeta, t as translate } from './src/i18n';

import { HomeScreen } from './src/screens/HomeScreen';
import { TextInputScreen } from './src/screens/TextInputScreen';
import { ProcessingScreen } from './src/screens/ProcessingScreen';
import { ResultsScreen, HistoryMeta } from './src/screens/ResultsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { CameraScreen } from './src/screens/CameraScreen';
import { InfoScreen } from './src/screens/InfoScreen';
import { BottomNav, Tab } from './src/components/BottomNav';
import { EscalationModal } from './src/components/EscalationModal';
import { LanguageSheet } from './src/components/LanguageSheet';
import { saveAnalysis, historyCount, HistoryItem } from './src/services/historyService';

type Screen = 'home' | 'text' | 'processing' | 'results' | 'error' | 'history' | 'help' | 'camera';

export default function App() {
  const { t, lang } = useI18n();
  const [ready, setReady] = useState(false);
  const [resultLang, setResultLang] = useState('English'); // language the current result content is in
  const [screen, setScreen] = useState<Screen>('home');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [escalationOpen, setEscalationOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [legalBanner, setLegalBanner] = useState(false);
  const [histCount, setHistCount] = useState(0);
  const [historyMeta, setHistoryMeta] = useState<HistoryMeta | null>(null);

  const refreshHistoryCount = useCallback(() => {
    historyCount().then(setHistCount).catch(() => {});
  }, []);

  useEffect(() => {
    initLang().then(({ detected, hadSaved }) => {
      setReady(true);
      if (!hadSaved && detected && detected !== 'en') {
        const meta = langMeta(detected);
        setBanner(translate('detected_tpl').split('{lang}').join(meta.native));
        setTimeout(() => setBanner(null), 4000);
      }
    });
    // One-time legal banner (FIX 10)
    AsyncStorage.getItem('cp_legal_banner').then((v) => {
      if (v !== '1') {
        AsyncStorage.setItem('cp_legal_banner', '1').catch(() => {});
        setLegalBanner(true);
        setTimeout(() => setLegalBanner(false), 5000);
      }
    });
    refreshHistoryCount();
  }, [refreshHistoryCount]);

  const runAnalyze = useCallback(async (input: AnalyzeInput) => {
    setHistoryMeta(null); // a fresh, live result (not opened from history)
    setScreen('processing');
    const started = Date.now();
    try {
      const langName = langMeta().english;
      const result = await analyze({ ...input, language: langName });
      const elapsed = Date.now() - started;
      if (elapsed < 1300) await new Promise((r) => setTimeout(r, 1300 - elapsed));
      setAnalysis(result);
      setResultLang(langName);
      setScreen('results');
      // Save to local history (never the original document — only the result).
      const inputType = input.inputMethod === 'camera' ? 'camera' : input.inputMethod === 'pdf' ? 'upload' : 'paste';
      saveAnalysis(result, inputType, langName).then(refreshHistoryCount).catch(() => {});
    } catch (err) {
      setErrorMessage(err instanceof AnalyzeError ? err.message : translate('generic_error'));
      setScreen('error');
    }
  }, [refreshHistoryCount]);

  const openHistoryItem = useCallback((item: HistoryItem) => {
    setAnalysis(item.full_result);
    setResultLang(item.language || 'English');
    setHistoryMeta({ id: item.id, date_analyzed: item.date_analyzed, checkedSteps: item.checkedSteps || {} });
    setScreen('results');
  }, []);

  // When the user changes language while viewing a result, re-translate its content.
  useEffect(() => {
    if (screen !== 'results' || !analysis) return;
    const target = langMeta().english;
    if (target === resultLang) return;
    let cancelled = false;
    setScreen('processing');
    translateAnalysis(analysis, target)
      .then((translated) => {
        if (cancelled) return;
        setAnalysis(translated);
        setResultLang(target);
        setScreen('results');
      })
      .catch(() => { if (!cancelled) setScreen('results'); });
    return () => { cancelled = true; };
    // Intentionally only depends on `lang` — fire on language change, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const handlePhoto = useCallback(() => { setScreen('camera'); }, []);

  const handleUpload = useCallback(async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
      if (res.canceled || !res.assets?.[0]) return;
      const asset = res.assets[0];
      const base64 = await new File(asset.uri).base64();
      if ((asset.mimeType || '').includes('pdf') || asset.name?.toLowerCase().endsWith('.pdf')) {
        await runAnalyze({ pdfBase64: base64, inputMethod: 'pdf' });
      } else {
        await runAnalyze({ image: base64, mediaType: asset.mimeType || 'image/jpeg', inputMethod: 'camera' });
      }
    } catch {
      setErrorMessage(translate('history_body')); setScreen('error');
    }
  }, [runAnalyze]);

  const handleExample = useCallback((key: string) => {
    const doc = EXAMPLES.find((e) => e.key === key);
    if (doc) runAnalyze({ text: doc.text, inputMethod: 'text' });
  }, [runAnalyze]);

  const goHome = useCallback(() => { setScreen('home'); setAnalysis(null); setHistoryMeta(null); }, []);
  const onTab = useCallback((tab: Tab) => {
    if (screen === 'processing') return;
    if (tab === 'home') goHome();
    else setScreen(tab);
  }, [screen, goHome]);

  const activeTab: Tab = screen === 'history' ? 'history' : screen === 'help' ? 'help' : 'home';

  if (!ready) return <SafeAreaView style={styles.root} />;

  return (
    <SafeAreaView style={styles.root}>
      <ExpoStatusBar style="dark" />
      {banner ? (
        <Pressable style={styles.banner} onPress={() => { setBanner(null); setLangOpen(true); }}>
          <Text style={styles.bannerText}>{banner}</Text>
        </Pressable>
      ) : null}

      {legalBanner ? (
        <View style={styles.legalBanner}>
          <Text style={styles.legalText}>
            ClearPath explains documents. It does not give legal advice. Free help is always one tap away.
          </Text>
          <Pressable onPress={() => setLegalBanner(false)} hitSlop={10}>
            <Text style={styles.legalClose}>✕</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.body}>
        {screen === 'home' && (
          <HomeScreen onPhoto={handlePhoto} onUpload={handleUpload} onText={() => setScreen('text')} onExample={handleExample} onOpenLang={() => setLangOpen(true)} />
        )}
        {screen === 'text' && (
          <TextInputScreen onBack={goHome} onSubmit={(text, location) => runAnalyze({ text, location, inputMethod: 'text' })} />
        )}
        {screen === 'processing' && <ProcessingScreen />}
        {screen === 'results' && analysis && (
          <ResultsScreen analysis={analysis} onHome={goHome} onEscalate={() => setEscalationOpen(true)} historyMeta={historyMeta || undefined} />
        )}
        {screen === 'error' && (
          <InfoScreen title={t('error_title')} body={errorMessage} ctaLabel={t('talk_to_person')} onCta={() => setEscalationOpen(true)} />
        )}
        {screen === 'history' && (
          <HistoryScreen onHome={goHome} onOpen={openHistoryItem} onChanged={refreshHistoryCount} />
        )}
        {screen === 'help' && (
          <InfoScreen title={t('help_title')} body={t('help_body')} ctaLabel={t('talk_to_person')} onCta={() => setEscalationOpen(true)} />
        )}
      </View>

      <BottomNav active={activeTab} dimmed={screen === 'processing'} onChange={onTab} historyCount={histCount} />

      {screen === 'camera' && (
        <View style={styles.cameraOverlay}>
          <CameraScreen
            onCapture={(base64, mediaType) => runAnalyze({ image: base64, mediaType, inputMethod: 'camera' })}
            onCancel={goHome}
            onUpload={handleUpload}
            onPaste={() => setScreen('text')}
          />
        </View>
      )}

      <EscalationModal visible={escalationOpen} onClose={() => setEscalationOpen(false)} documentType={analysis?.document_type} />
      <LanguageSheet visible={langOpen} onClose={() => setLangOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  body: { flex: 1 },
  banner: { backgroundColor: colors.navy, paddingVertical: 12, paddingHorizontal: 18 },
  bannerText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  legalBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FEF3C7', paddingVertical: 12, paddingHorizontal: 16 },
  legalText: { flex: 1, color: '#92400E', fontSize: 13, lineHeight: 18 },
  legalClose: { color: '#92400E', fontSize: 14, fontWeight: '700' },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 50, backgroundColor: '#000' },
});

