# Обновления для фронта и бэка приложения
_Exported on 09.10.2025 at 15:29:44 GMT+3 from Cursor (1.7.39)_

---

**User**

Для фронта:
1) Добавить проверку на первый запуск. Если приложение запускается в первые, то нужно провести мини тур по нему.
Для этого сделать отдельную страницу welcome. На ней написать инструкцию:
— Как добавить RSS
— Что это за лента
2) Для основного блока <Layout> добавить тень
3) Добавь анимацию появления новых новостей при обновлении по таймеру

Для бэка:
1) Заменить работу с openai на локальную LLM (Ollama api). Выбрать LLM, которую можно запустить локально. Сохранить вариант работы, если LLM не доступна
2) Добавь кеширование с использованием Redis. Каждый отдельный RSS url будет как ключ. Значение — есть этот самый RSS. TTL должен настраиваться через env, по умолчанию 5 минут.
3) Проверь работу суммаризации. Нужно переходить из ссылки новости и доставать контент, который пойдёт на суммаризацию в LLM. Если не удалось достать контент, то оставить описание из RSS.

---

**Cursor**

```typescript
import { atomWithStorage } from 'jotai/utils';

export const onboardingAtom = atomWithStorage<boolean>('hasCompletedWelcomeTour', false);

```

```typescriptreact
import { Button, Heading, List, ListItem, Stack, Text } from '@chakra-ui/react';
import { useSetAtom } from 'jotai';
import { onboardingAtom } from '../atoms/onboardingAtom.ts';
import { useNavigate } from 'react-router';

const Welcome = () => {
  const setOnboarding = useSetAtom(onboardingAtom);
  const navigate = useNavigate();

  const handleContinue = () => {
    setOnboarding(true);
    navigate('/');
  };

  return (
    <Stack gap={6} textAlign={'left'}>
      <Stack gap={2}>
        <Heading size={'lg'}>Добро пожаловать!</Heading>
        <Text color={'fg.muted'}>
          Этот небольшой тур поможет вам быстрее разобраться с агрегатором новостей.
        </Text>
      </Stack>

      <Stack gap={4}>
        <Stack gap={1}>
          <Heading size={'md'}>Как добавить RSS</Heading>
          <List spacing={2} styleType={'disc'} pl={4}>
            <ListItem>Откройте раздел «Настройки» через иконку шестерёнки.</ListItem>
            <ListItem>Нажмите кнопку «Добавить источник (формат RSS)».</ListItem>
            <ListItem>Вставьте ссылку на RSS и подтвердите добавление.</ListItem>
          </List>
        </Stack>

        <Stack gap={1}>
          <Heading size={'md'}>Что такое лента</Heading>
          <Text>
            RSS — это формат, в котором сайты публикуют свои обновления. Добавив адрес RSS, вы будете получать новые
            новости прямо в этом приложении.
          </Text>
        </Stack>
      </Stack>

      <Button alignSelf={'flex-end'} onClick={handleContinue} colorPalette={'blue'}>
        Начать работу
      </Button>
    </Stack>
  );
};

export default Welcome;

```

```typescriptreact
import { Provider } from './components/ui/provider.tsx';
import { BrowserRouter, Route, Routes } from 'react-router';
import Feed from './pages/Feed.tsx';
import Settings from './pages/Settings.tsx';
import NotFound from './pages/NotFound.tsx';
import Layout from './components/Layout.tsx';
import Welcome from './pages/Welcome.tsx';
import { useAtomValue, useSetAtom } from 'jotai';
import { onboardingAtom } from './atoms/onboardingAtom.ts';
import { useEffect } from 'react';

const App = () => {
  const hasCompletedOnboarding = useAtomValue(onboardingAtom);
  const setOnboarding = useSetAtom(onboardingAtom);

  useEffect(() => {
    if (hasCompletedOnboarding === undefined) {
      setOnboarding(false);
    }
  }, [hasCompletedOnboarding, setOnboarding]);

  return (
    <Provider>
      <BrowserRouter>
        <Routes>
          {!hasCompletedOnboarding && <Route path={'/welcome'} element={<Welcome />} />}
          <Route element={<Layout />}>
            <Route
              index
              element={hasCompletedOnboarding ? <Feed /> : <Welcome />}
            />
            <Route path={'/settings'} element={<Settings />} />
            <Route path={'*'} element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

export default App;

```

```typescriptreact
import { Provider } from './components/ui/provider.tsx';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import Feed from './pages/Feed.tsx';
import Settings from './pages/Settings.tsx';
import NotFound from './pages/NotFound.tsx';
import Layout from './components/Layout.tsx';
import Welcome from './pages/Welcome.tsx';
import { useAtomValue } from 'jotai';
import { onboardingAtom } from './atoms/onboardingAtom.ts';

const App = () => {
  const hasCompletedOnboarding = useAtomValue(onboardingAtom);

  return (
    <Provider>
      <BrowserRouter>
        <Routes>
          <Route
            path={'/welcome'}
            element={
              hasCompletedOnboarding ? <Navigate to={'/'} replace /> : <Welcome />
            }
          />
          <Route element={<Layout />}>
            <Route
              index
              element={
                hasCompletedOnboarding ? (
                  <Feed />
                ) : (
                  <Navigate to={'/welcome'} replace />
                )
              }
            />
            <Route
              path={'/settings'}
              element={
                hasCompletedOnboarding ? (
                  <Settings />
                ) : (
                  <Navigate to={'/welcome'} replace />
                )
              }
            />
            <Route path={'*'} element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

export default App;

```

```typescriptreact
import { Stack } from '@chakra-ui/react';
import { Outlet } from 'react-router';
import Header from './Header.tsx';
import { Toaster } from './ui/toaster.tsx';

const Layout = () => {
  return (
    <Stack
      h={'100dvh'}
      maxW={'2xl'}
      p={4}
      mx={'auto'}
      bg={'bg.surface'}
      boxShadow={'xl'}
      borderLeft={'sm'}
      borderRight={'sm'}
      borderColor={'bg.emphasized'}
    >
      <Toaster />
      <Header />
      <Outlet />
    </Stack>
  );
};

export default Layout;

```

```typescriptreact
import { Stack } from '@chakra-ui/react';
import { Outlet } from 'react-router';
import Header from './Header.tsx';
import { Toaster } from './ui/toaster.tsx';

const Layout = () => {
  return (
    <Stack
      h={'100dvh'}
      maxW={'2xl'}
      p={4}
      mx={'auto'}
      bg={'surface'}
      boxShadow={'2xl'}
      borderLeft={'sm'}
      borderRight={'sm'}
      borderColor={'bg.emphasized'}
    >
      <Toaster />
      <Header />
      <Outlet />
    </Stack>
  );
};

export default Layout;

```

```typescriptreact
import type FeedDto from '../api/models/Feed.dto.ts';
import { Badge, Box, Card, HStack, Text } from '@chakra-ui/react';
import dayjs from 'dayjs';
import { useAtom, useAtomValue } from 'jotai';
import { visitedNewsAtom } from '../atoms/visitedNewsAtom.ts';

import 'dayjs/locale/ru.js';
import { settingsAtom } from '../atoms/settingsAtom.ts';

type NewsItemProps = FeedDto;

const NewsItem = (props: NewsItemProps) => {
  const [visited, setVisited] = useAtom(visitedNewsAtom);
  const settings = useAtomValue(settingsAtom);

  return (
    <Box
      role={'link'}
      cursor={'pointer'}
      onClick={() => {
        window.open(props.link, settings.linkOpenMode, 'noopener,noreferrer');
        setVisited((prev) => {
          const next = new Set(prev);
          next.add(props.id);
          return next;
        });
      }}
      opacity={visited.has(props.id) ? 0.5 : 1}
      data-visited={visited.has(props.id)}
      transitionProperty={'common'}
      transitionDuration={'normal'}
      opacity={visited.has(props.id) ? 0.5 : 1}
      transform={'translateY(0)'}
      animation={'fadeSlideIn 0.4s ease-out'}
    >
      <Card.Root>
        <Card.Header>
          <Text fontWeight={'bold'}>{props.title}</Text>
        </Card.Header>
        <Card.Body>{props.summary}</Card.Body>
        <Card.Footer>
          <HStack justifyContent={'space-between'} w={'full'}>
            <Badge colorPalette={'orange'}>{props.source}</Badge>
            <Text>
              {dayjs(props.published).locale('ru').format('HH:mm DD MMMM')}
            </Text>
          </HStack>
        </Card.Footer>
      </Card.Root>
    </Box>
  );
};

export default NewsItem;

```

```typescriptreact
import type FeedDto from '../api/models/Feed.dto.ts';
import { Badge, Box, Card, HStack, Text } from '@chakra-ui/react';
import dayjs from 'dayjs';
import { useAtom, useAtomValue } from 'jotai';
import { visitedNewsAtom } from '../atoms/visitedNewsAtom.ts';

import 'dayjs/locale/ru.js';
import { settingsAtom } from '../atoms/settingsAtom.ts';

type NewsItemProps = FeedDto;

const NewsItem = (props: NewsItemProps) => {
  const [visited, setVisited] = useAtom(visitedNewsAtom);
  const settings = useAtomValue(settingsAtom);

  return (
    <Box
      role={'link'}
      cursor={'pointer'}
      onClick={() => {
        window.open(props.link, settings.linkOpenMode, 'noopener,noreferrer');
        setVisited((prev) => {
          const next = new Set(prev);
          next.add(props.id);
          return next;
        });
      }}
      data-visited={visited.has(props.id)}
      opacity={visited.has(props.id) ? 0.5 : 1}
      transitionProperty={'common'}
      transitionDuration={'normal'}
      animation={'fadeSlideIn 0.4s ease-out'}
    >
      <Card.Root>
        <Card.Header>
          <Text fontWeight={'bold'}>{props.title}</Text>
        </Card.Header>
        <Card.Body>{props.summary}</Card.Body>
        <Card.Footer>
          <HStack justifyContent={'space-between'} w={'full'}>
            <Badge colorPalette={'orange'}>{props.source}</Badge>
            <Text>
              {dayjs(props.published).locale('ru').format('HH:mm DD MMMM')}
            </Text>
          </HStack>
        </Card.Footer>
      </Card.Root>
    </Box>
  );
};

export default NewsItem;

```

```typescriptreact
import { Provider } from './components/ui/provider.tsx';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import Feed from './pages/Feed.tsx';
import Settings from './pages/Settings.tsx';
import NotFound from './pages/NotFound.tsx';
import Layout from './components/Layout.tsx';
import Welcome from './pages/Welcome.tsx';
import { useAtomValue } from 'jotai';
import { onboardingAtom } from './atoms/onboardingAtom.ts';

const App = () => {
  const hasCompletedOnboarding = useAtomValue(onboardingAtom);

  return (
    <Provider>
      <BrowserRouter>
        <Routes>
          <Route
            path={'/welcome'}
            element={
              hasCompletedOnboarding ? <Navigate to={'/'} replace /> : <Welcome />
            }
          />
          <Route element={<Layout />}
            path={'/'}
          >
            <Route
              index
              element={
                hasCompletedOnboarding ? (
                  <Feed />
                ) : (
                  <Navigate to={'/welcome'} replace />
                )
              }
            />
            <Route
              path={'/settings'}
              element={
                hasCompletedOnboarding ? (
                  <Settings />
                ) : (
                  <Navigate to={'/welcome'} replace />
                )
              }
            />
            <Route path={'*'} element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

export default App;

```

```typescriptreact
import { Provider } from './components/ui/provider.tsx';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import Feed from './pages/Feed.tsx';
import Settings from './pages/Settings.tsx';
import NotFound from './pages/NotFound.tsx';
import Layout from './components/Layout.tsx';
import Welcome from './pages/Welcome.tsx';
import { useAtomValue } from 'jotai';
import { onboardingAtom } from './atoms/onboardingAtom.ts';

const App = () => {
  const hasCompletedOnboarding = useAtomValue(onboardingAtom);

  return (
    <Provider>
      <BrowserRouter>
        <Routes>
          <Route
            path={'/welcome'}
            element={
              hasCompletedOnboarding ? <Navigate to={'/'} replace /> : <Welcome />
            }
          />
          <Route element={<Layout />} path={'/'}>
            <Route
              index
              element={
                hasCompletedOnboarding ? (
                  <Feed />
                ) : (
                  <Navigate to={'/welcome'} replace />
                )
              }
            />
            <Route
              path={'/settings'}
              element={
                hasCompletedOnboarding ? (
                  <Settings />
                ) : (
                  <Navigate to={'/welcome'} replace />
                )
              }
            />
            <Route path={'*'} element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

export default App;

```

```typescriptreact
import { Provider } from './components/ui/provider.tsx';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import Feed from './pages/Feed.tsx';
import Settings from './pages/Settings.tsx';
import NotFound from './pages/NotFound.tsx';
import Layout from './components/Layout.tsx';
import Welcome from './pages/Welcome.tsx';
import { useAtomValue } from 'jotai';
import { onboardingAtom } from './atoms/onboardingAtom.ts';

const App = () => {
  const hasCompletedOnboarding = useAtomValue(onboardingAtom);

  return (
    <Provider>
      <BrowserRouter>
        <Routes>
          <Route
            path={'/welcome'}
            element={
              hasCompletedOnboarding ? <Navigate to={'/'} replace /> : <Welcome />
            }
          />
          <Route element={<Layout />} path={'/'}>
            <Route
              index
              element={
                hasCompletedOnboarding ? (
                  <Feed />
                ) : (
                  <Navigate to={'/welcome'} replace />
                )
              }
            />
            <Route
              path={'/settings'}
              element={
                hasCompletedOnboarding ? (
                  <Settings />
                ) : (
                  <Navigate to={'/welcome'} replace />
                )
              }
            />
            <Route path={'*'} element={<NotFound />} />
          </Route>
          <Route
            path={'*'}
            element={
              hasCompletedOnboarding ? (
                <NotFound />
              ) : (
                <Navigate to={'/welcome'} replace />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

export default App;

```

```typescriptreact
import { Provider } from './components/ui/provider.tsx';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import Feed from './pages/Feed.tsx';
import Settings from './pages/Settings.tsx';
import NotFound from './pages/NotFound.tsx';
import Layout from './components/Layout.tsx';
import Welcome from './pages/Welcome.tsx';
import { useAtomValue } from 'jotai';
import { onboardingAtom } from './atoms/onboardingAtom.ts';

const App = () => {
  const hasCompletedOnboarding = useAtomValue(onboardingAtom);

  return (
    <Provider>
      <BrowserRouter>
        <Routes>
          <Route
            path={'/welcome'}
            element={
              hasCompletedOnboarding ? <Navigate to={'/'} replace /> : <Welcome />
            }
          />
          <Route element={<Layout />} path={'/'}>
            <Route
              index
              element={
                hasCompletedOnboarding ? (
                  <Feed />
                ) : (
                  <Navigate to={'/welcome'} replace />
                )
              }
            />
            <Route
              path={'/settings'}
              element={
                hasCompletedOnboarding ? (
                  <Settings />
                ) : (
                  <Navigate to={'/welcome'} replace />
                )
              }
            />
            <Route path={'*'} element={<NotFound />} />
          </Route>
          <Route path={'*'} element={<Navigate to={'/'} replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

export default App;

```

```typescriptreact
*** Begin Patch
*** Update File: src/App.tsx
@@
-            <Route path={'/settings'}
-              element={
-                hasCompletedOnboarding ? (
-                  <Settings />
-                ) : (
-                  <Navigate to={'/welcome'} replace />
-                )
-              }
-            />
-            <Route path={'*'} element={<NotFound />} />
+            <Route
+              path={'/settings'}
+              element={
+                hasCompletedOnboarding ? (
+                  <Settings />
+                ) : (
+                  <Navigate to={'/welcome'} replace />
+                )
+              }
+            />
+            <Route path={'*'} element={<NotFound />} />
*** End Patch
```

```typescriptreact
import { Provider } from './components/ui/provider.tsx';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import Feed from './pages/Feed.tsx';
import Settings from './pages/Settings.tsx';
import NotFound from './pages/NotFound.tsx';
import Layout from './components/Layout.tsx';
import Welcome from './pages/Welcome.tsx';
import { useAtomValue } from 'jotai';
import { onboardingAtom } from './atoms/onboardingAtom.ts';

const App = () => {
  const hasCompletedOnboarding = useAtomValue(onboardingAtom);

  return (
    <Provider>
      <BrowserRouter>
        <Routes>
          <Route
            path={'/welcome'}
            element={
              hasCompletedOnboarding ? <Navigate to={'/'} replace /> : <Welcome />
            }
          />
          <Route element={<Layout />} path={'/'}>
            <Route
              index
              element={
                hasCompletedOnboarding ? (
                  <Feed />
                ) : (
                  <Navigate to={'/welcome'} replace />
                )
              }
            />
            <Route
              path={'/settings'}
              element={
                hasCompletedOnboarding ? (
                  <Settings />
                ) : (
                  <Navigate to={'/welcome'} replace />
                )
              }
            />
            <Route path={'*'} element={<NotFound />} />
          </Route>
          <Route path={'*'} element={<Navigate to={'/'} replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

export default App;

```

```typescriptreact
import { AbsoluteCenter, Spinner, Stack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { fetchFeed } from '../api/services/fetchFeed.ts';
import type FeedDto from '../api/models/Feed.dto.ts';
import NewsItem from '../components/NewsItem.tsx';
import { useAtomValue } from 'jotai';
import { feedsAtom } from '../atoms/feedsAtom.ts';
import { settingsAtom } from '../atoms/settingsAtom.ts';

const Feed = () => {
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<FeedDto[]>([]);
  const feeds = useAtomValue(feedsAtom);
  const settings = useAtomValue(settingsAtom);

  const loadFeed = () => {
    fetchFeed({ feeds })
      .then((data) => {
        setNews((prev) => {
          const prevIds = new Set(prev.map((item) => item.id));
          const incomingIds = new Set(data.map((item) => item.id));
          const isSame = prev.length === data.length && [...prevIds].every((id) => incomingIds.has(id));
          if (isSame) {
            return prev;
          }
          return data;
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFeed();

    if (settings.autoRefreshMs > 0) {
      const interval = setInterval(loadFeed, settings.autoRefreshMs);
      return () => clearInterval(interval);
    }
  }, [feeds, settings.autoRefreshMs]);

  if (loading)
    return (
      <AbsoluteCenter>
        <Spinner size={'xl'} />
      </AbsoluteCenter>
    );

  return (
    <Stack height={'100%'} overflowY={'auto'}>
      {news.map((item) => (
        <NewsItem key={item.id} {...item} />
      ))}
    </Stack>
  );
};

export default Feed;

```

```typescript
import { atomWithStorage } from 'jotai/utils';

type Settings = {
  autoRefreshMs: number;
  linkOpenMode: '_blank' | '_self';
  lastSeenNewsIds?: string[];
};

export const settingsAtom = atomWithStorage<Settings>(
  'settings',
  {
    autoRefreshMs: 5 * 60 * 1000,
    linkOpenMode: '_blank',
  }
);

```

```typescriptreact
import { AbsoluteCenter, Spinner, Stack } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { fetchFeed } from '../api/services/fetchFeed.ts';
import type FeedDto from '../api/models/Feed.dto.ts';
import NewsItem from '../components/NewsItem.tsx';
import { useAtomValue } from 'jotai';
import { feedsAtom } from '../atoms/feedsAtom.ts';
import { settingsAtom } from '../atoms/settingsAtom.ts';

const Feed = () => {
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<FeedDto[]>([]);
  const feeds = useAtomValue(feedsAtom);
  const settings = useAtomValue(settingsAtom);

  const pendingAnimationRef = useRef<Set<string>>(new Set());

  const loadFeed = () => {
    fetchFeed({ feeds })
      .then((data) => {
        setNews((prev) => {
          const prevIds = new Set(prev.map((item) => item.id));
          const incomingIds = new Set(data.map((item) => item.id));
          const isSame = prev.length === data.length && [...prevIds].every((id) => incomingIds.has(id));
          if (isSame) {
            return prev;
          }

          const newlyAdded = data
            .filter((item) => !prevIds.has(item.id))
            .map((item) => item.id);

          pendingAnimationRef.current = new Set(newlyAdded);

          return data;
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFeed();

    if (settings.autoRefreshMs > 0) {
      const interval = setInterval(loadFeed, settings.autoRefreshMs);
      return () => clearInterval(interval);
    }
  }, [feeds, settings.autoRefreshMs]);

  if (loading)
    return (
      <AbsoluteCenter>
        <Spinner size={'xl'} />
      </AbsoluteCenter>
    );

  return (
    <Stack height={'100%'} overflowY={'auto'}>
      {news.map((item) => (
        <NewsItem key={item.id} {...item} />
      ))}
    </Stack>
  );
};

export default Feed;

```

```typescriptreact
import { AbsoluteCenter, Spinner, Stack } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { fetchFeed } from '../api/services/fetchFeed.ts';
import type FeedDto from '../api/models/Feed.dto.ts';
import NewsItem from '../components/NewsItem.tsx';
import { useAtomValue } from 'jotai';
import { feedsAtom } from '../atoms/feedsAtom.ts';
import { settingsAtom } from '../atoms/settingsAtom.ts';

const Feed = () => {
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<FeedDto[]>([]);
  const feeds = useAtomValue(feedsAtom);
  const settings = useAtomValue(settingsAtom);

  const pendingAnimationRef = useRef<Set<string>>(new Set());

  const loadFeed = () => {
    fetchFeed({ feeds })
      .then((data) => {
        setNews((prev) => {
          const prevIds = new Set(prev.map((item) => item.id));
          const incomingIds = new Set(data.map((item) => item.id));
          const isSame = prev.length === data.length && [...prevIds].every((id) => incomingIds.has(id));
          if (isSame) {
            return prev;
          }

          const newlyAdded = data
            .filter((item) => !prevIds.has(item.id))
            .map((item) => item.id);

          pendingAnimationRef.current = new Set(newlyAdded);

          return data;
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFeed();

    if (settings.autoRefreshMs > 0) {
      const interval = setInterval(loadFeed, settings.autoRefreshMs);
      return () => clearInterval(interval);
    }
  }, [feeds, settings.autoRefreshMs]);

  if (loading)
    return (
      <AbsoluteCenter>
        <Spinner size={'xl'} />
      </AbsoluteCenter>
    );

  return (
    <Stack height={'100%'} overflowY={'auto'} position={'relative'}>
      {news.map((item) => (
        <NewsItem
          key={item.id}
          {...item}
          animateOnMount={Boolean(pendingAnimationRef.current?.has(item.id))}
          onAnimationEnd={() => pendingAnimationRef.current.delete(item.id)}
        />
      ))}
    </Stack>
  );
};

export default Feed;

```

```typescriptreact
import type FeedDto from '../api/models/Feed.dto.ts';
import { Badge, Box, Card, HStack, Text } from '@chakra-ui/react';
import dayjs from 'dayjs';
import { useAtom, useAtomValue } from 'jotai';
import { visitedNewsAtom } from '../atoms/visitedNewsAtom.ts';

import 'dayjs/locale/ru.js';
import { settingsAtom } from '../atoms/settingsAtom.ts';

type NewsItemProps = FeedDto & {
  animateOnMount?: boolean;
  onAnimationEnd?: () => void;
};

const NewsItem = (props: NewsItemProps) => {
  const [visited, setVisited] = useAtom(visitedNewsAtom);
  const settings = useAtomValue(settingsAtom);

  return (
    <Box
      role={'link'}
      cursor={'pointer'}
      onClick={() => {
        window.open(props.link, settings.linkOpenMode, 'noopener,noreferrer');
        setVisited((prev) => {
          const next = new Set(prev);
          next.add(props.id);
          return next;
        });
      }}
      data-visited={visited.has(props.id)}
      opacity={visited.has(props.id) ? 0.5 : 1}
      transitionProperty={'common'}
      transitionDuration={'normal'}
      animation={props.animateOnMount ? 'fadeSlideIn 0.4s ease-out' : undefined}
      onAnimationEnd={props.onAnimationEnd}
    >
      <Card.Root>
        <Card.Header>
          <Text fontWeight={'bold'}>{props.title}</Text>
        </Card.Header>
        <Card.Body>{props.summary}</Card.Body>
        <Card.Footer>
          <HStack justifyContent={'space-between'} w={'full'}>
            <Badge colorPalette={'orange'}>{props.source}</Badge>
            <Text>
              {dayjs(props.published).locale('ru').format('HH:mm DD MMMM')}
            </Text>
          </HStack>
        </Card.Footer>
      </Card.Root>
    </Box>
  );
};

export default NewsItem;

```

```css
@keyframes fadeSlideIn {
  0% {
    opacity: 0;
    transform: translateY(12px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

```

```typescriptreact
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(<App />);
}

```

---

**User**

# Set Oh My Zsh theme conditionally
if [[ "$TERM_PROGRAM" == "vscode" ]]; then
  ZSH_THEME=""  # Disable Powerlevel10k for Cursor
else
  ZSH_THEME="powerlevel10k/powerlevel10k"
fi

# Load Oh My Zsh
source $ZSH/oh-my-zsh.sh

# Use a minimal prompt in Cursor to avoid command detection issues
if [[ "$TERM_PROGRAM" == "vscode" ]]; then
  PROMPT='%n@%m:%~%# '
  RPROMPT=''
else
  [[ -f ~/.p10k.zsh ]] && source ~/.p10k.zsh
fi
Втрой это куда нужно , не в проект , это чтобы решить проблемму с терминилом

---

**Cursor**

Добавь этот блок в свой `~/.zshrc` (или другой файл с пользовательскими настройками zsh, если ты используешь отдельный), например в конце файла. Это не связано с проектом — просто открой файл, вставь код и перезапусти терминал (или выполни `source ~/.zshrc`), чтобы новая логика подхватилась.

---

**User**

открой его

---

**Cursor**

У меня нет доступа к твоей домашней директории, поэтому открыть `~/.zshrc` напрямую не могу. Открой его на своей машине, например командой `code ~/.zshrc` (VS Code), `nano ~/.zshrc`, `vi ~/.zshrc` или через любой другой редактор, в котором ты обычно правишь конфиги, и вставь туда блок.

---

**User**

а где это находится 

---

**Cursor**

Файл `~/.zshrc` лежит в твоём домашнем каталоге. Обозначение `~` означает путь к домашней папке пользователя (в macOS и Linux это что-то вроде `/Users/твоя_учётная_запись` или `/home/твоя_учётная_запись`). Соответственно, полный путь обычно `/Users/имя/.zshrc` или `/home/имя/.zshrc`. Открой дома нужный каталог и редактируй этот файл.

