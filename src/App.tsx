import { useMemo, useState } from 'react'
import { MOOD_COPY } from './components/CatHome'
import { HeartIcon, HomeIcon } from './components/Icons'
import { PlayGame } from './components/PlayGame'
import { questionForDay } from './data'
import { useCat } from './hooks/useCat'
import { useCoupleData } from './hooks/useCoupleData'
import { usePhotostrips } from './hooks/usePhotostrips'
import { daysTogether, useProfile } from './hooks/useProfile'
import { todayKey } from './hooks/useStored'
import { BucketScreen } from './screens/BucketScreen'
import { CatScreen } from './screens/CatScreen'
import { CountdownScreen } from './screens/CountdownScreen'
import { HomeScreen } from './screens/HomeScreen'
import { MoodScreen } from './screens/MoodScreen'
import { NotesScreen } from './screens/NotesScreen'
import { QuestionScreen } from './screens/QuestionScreen'
import { RouletteScreen } from './screens/RouletteScreen'
import { StripsScreen } from './screens/StripsScreen'
import { UsScreen } from './screens/UsScreen'
import type { Carer, Screen } from './types'
import './App.css'

const TABS: { id: Screen; label: string; Icon: typeof HomeIcon }[] = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'us', label: 'Us', Icon: HeartIcon },
]

export default function App() {
  const { profile, updateProfile } = useProfile()
  const data = useCoupleData()
  const strips = usePhotostrips()
  const {
    cat,
    mood,
    level,
    feed,
    groom,
    pet,
    toggleSleep,
    finishPlay,
    setCarer,
    rename,
  } = useCat()

  const [screen, setScreen] = useState<Screen>('home')
  const [toast, setToast] = useState('')
  const [playing, setPlaying] = useState(false)
  const [noteAuthor, setNoteAuthor] = useState<Carer>('you')

  const question = useMemo(() => questionForDay(todayKey()), [])

  const summary = useMemo(
    () => ({
      catName: cat.name,
      catMoodLine: `${cat.name} ${MOOD_COPY[mood]}`,
      catLevel: level,
      noteCount: data.notes.length,
      latestNote: data.notes[0]?.text ?? null,
      bucketDone: data.bucket.filter((item) => item.done).length,
      bucketTotal: data.bucket.length,
      nextEvent: data.nextEvent,
      daysTogether: daysTogether(profile.since),
      moodLoggedToday: Boolean(data.todayMood?.you || data.todayMood?.partner),
      questionOfTheDay: question,
    }),
    [
      cat.name,
      mood,
      level,
      data.notes,
      data.bucket,
      data.nextEvent,
      data.todayMood,
      profile.since,
      question,
    ],
  )

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }

  const goHome = () => setScreen('home')
  const showTabs = screen === 'home' || screen === 'us'

  return (
    <div className="app">
      <main className={`app__main ${showTabs ? 'has-tabs' : ''}`}>
        {screen === 'home' ? (
          <HomeScreen profile={profile} summary={summary} onOpen={setScreen} />
        ) : null}

        {screen === 'cat' ? (
          <CatScreen
            cat={cat}
            mood={mood}
            level={level}
            profile={profile}
            onFeed={feed}
            onGroom={groom}
            onPet={pet}
            onToggleSleep={toggleSleep}
            onPlay={() => setPlaying(true)}
            onSetCarer={setCarer}
            onRename={rename}
            onNotify={showToast}
            onBack={goHome}
          />
        ) : null}

        {screen === 'notes' ? (
          <NotesScreen
            notes={data.notes}
            profile={profile}
            author={noteAuthor}
            onSetAuthor={setNoteAuthor}
            onAdd={data.addNote}
            onRemove={data.removeNote}
            onBack={goHome}
          />
        ) : null}

        {screen === 'bucket' ? (
          <BucketScreen
            items={data.bucket}
            onAdd={data.addBucketItem}
            onToggle={data.toggleBucketItem}
            onRemove={data.removeBucketItem}
            onBack={goHome}
          />
        ) : null}

        {screen === 'roulette' ? (
          <RouletteScreen
            ideas={data.ideas}
            onAdd={data.addIdea}
            onRemove={data.removeIdea}
            onBack={goHome}
          />
        ) : null}

        {screen === 'countdown' ? (
          <CountdownScreen
            events={data.events}
            onAdd={data.addEvent}
            onRemove={data.removeEvent}
            onBack={goHome}
          />
        ) : null}

        {screen === 'question' ? (
          <QuestionScreen
            question={question}
            answers={data.answers}
            profile={profile}
            onSave={data.saveAnswer}
            onBack={goHome}
          />
        ) : null}

        {screen === 'mood' ? (
          <MoodScreen
            moods={data.moods}
            profile={profile}
            onSet={data.setMood}
            onBack={goHome}
          />
        ) : null}

        {screen === 'strips' ? (
          <StripsScreen
            strips={strips.strips}
            ready={strips.ready}
            busy={strips.busy}
            error={strips.error}
            onAdd={strips.addFromFile}
            onRename={strips.rename}
            onRemove={strips.remove}
            onClearError={() => strips.setError('')}
            onBack={goHome}
          />
        ) : null}

        {screen === 'us' ? (
          <UsScreen
            profile={profile}
            catName={cat.name}
            catLevel={level}
            noteCount={data.notes.length}
            bucketDone={summary.bucketDone}
            onSave={updateProfile}
          />
        ) : null}
      </main>

      {showTabs ? (
        <nav className="tabbar" aria-label="Main">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tabbar__item ${screen === tab.id ? 'is-active' : ''}`}
              onClick={() => setScreen(tab.id)}
              aria-current={screen === tab.id ? 'page' : undefined}
            >
              <tab.Icon size={22} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      ) : null}

      {playing ? (
        <PlayGame
          catName={cat.name}
          bestScore={cat.bestScore}
          onClose={() => setPlaying(false)}
          onFinish={(score) => {
            const result = finishPlay(score)
            setPlaying(false)
            showToast(
              result.gainedXp > 0
                ? `${result.message} · +${result.gainedXp} XP`
                : result.message,
            )
          }}
        />
      ) : null}

      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
