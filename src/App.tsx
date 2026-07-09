import { usePosterStore } from './store/usePosterStore';
import Sidebar from './components/Sidebar';
import PanelHost from './components/panels/PanelHost';
import PosterCanvas from './components/PosterCanvas';
import SettingsBar from './components/SettingsBar';
import OnboardingModal from './components/OnboardingModal';

export default function App() {
  const onboardingDone = usePosterStore((s) => s.onboardingDone);

  return (
    <div className="app">
      <Sidebar />
      <PanelHost />
      <main className="workspace">
        <PosterCanvas />
        <SettingsBar />
      </main>
      {!onboardingDone && <OnboardingModal />}
    </div>
  );
}
