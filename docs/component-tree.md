# Frontend Component Agaci

Bu agac Next.js App Router bazli yapilandirma dusunulerek hazirlanmistir.

## 1. Route Yapisi

```text
app/
  (public)/
    login/page.tsx
    forgot-password/page.tsx
  (dashboard)/
    layout.tsx
    dashboard/page.tsx
    students/page.tsx
    students/[id]/page.tsx
    lessons/page.tsx
    plans/page.tsx
    tasks/page.tsx
    exams/page.tsx
    pomodoro/page.tsx
    messages/page.tsx
    agenda/page.tsx
    evaluations/page.tsx
    library/page.tsx
    settings/page.tsx
  (student)/
    layout.tsx
    home/page.tsx
    my-plan/page.tsx
    my-tasks/page.tsx
    my-exams/page.tsx
    pomodoro/page.tsx
    messages/page.tsx
    resources/page.tsx
    profile/page.tsx
```

## 2. Ortak Layout Bilesenleri

```text
AppShell
  Sidebar
    SidebarLogo
    SidebarNav
    SidebarFooter
  Topbar
    PageTitle
    QuickSearch
    NotificationBell
    MessageBell
    UserMenu
  MainContent
```

## 3. Dashboard Sayfasi

```text
DashboardPage
  DashboardHeader
    GreetingBlock
    DateRangePicker
    QuickActions
  KpiGrid
    KpiCard
    KpiCard
    KpiCard
    KpiCard
    KpiCard
  AnalyticsGrid
    StudyMinutesChartCard
    ExamTrendChartCard
    TaskStatusChartCard
  ActivityGrid
    TodayTasksCard
    UpcomingMeetingsCard
    RiskStudentsCard
    RecentMessagesCard
```

## 4. Ogrenciler Listesi

```text
StudentsPage
  PageHeader
    SearchInput
    GradeFilter
    StatusFilter
    AddStudentButton
  StudentViewToggle
  StudentGrid
    StudentCard
      StudentAvatar
      StudentMeta
      ProgressBadge
      QuickActions
  StudentTable
```

## 5. Ogrenci Detay Sayfasi

```text
StudentDetailPage
  StudentHeroCard
    StudentAvatar
    StudentIdentity
    ParentContactCard
    StudentQuickActions
  StudentSummaryStats
    SummaryStatCard
    SummaryStatCard
    SummaryStatCard
    SummaryStatCard
  StudentTabs
    OverviewTab
      WeeklyProgressCard
      ExamSnapshotCard
      FocusTimeCard
      CoachNotesPreview
    TasksTab
      TaskToolbar
      TaskList
      TaskCompletionPanel
    TopicsTab
      TopicProgressTree
      MissingTopicsPanel
    QuestionTrackingTab
      DailyQuestionChart
      WrongTopicAnalysis
    ExamsTab
      ExamTable
      ExamAnalyticsCards
      ExamTrendChart
    PomodoroTab
      LiveSessionPanel
      SessionHistoryTable
    MessagesTab
      ConversationPanel
    NotesTab
      NotesList
      NoteEditor
    ResourcesTab
      ResourceGrid
```

## 6. Dersler ve Konular

```text
LessonsPage
  LessonToolbar
  LessonList
    LessonCard
  TopicTreePanel
    TopicTree
    TopicItem
    TopicEditDrawer
```

## 7. Plan ve Gorevler

```text
PlansPage
  PlanCalendarHeader
  WeeklyPlanBoard
    DayColumn
      TimeBlockCard
  PlanSidebar
    PlanSummary
    PlanActions

TasksPage
  TaskToolbar
  TaskKanban
    PendingColumn
    InProgressColumn
    CompletedColumn
    MissedColumn
```

## 8. Deneme ve Pomodoro

```text
ExamsPage
  ExamHeader
  ExamFilters
  ExamTable
  ExamAnalyticsSection
    NetTrendChart
    LessonBreakdownChart
    WeakTopicsCard

PomodoroPage
  PomodoroTimerCard
  SessionControlBar
  FocusSummaryCards
  SessionHistoryList
```

## 9. Mesajlar ve Kutuphane

```text
MessagesPage
  ConversationSidebar
    ConversationSearch
    ConversationList
  MessagePanel
    MessageHeader
    MessageList
    MessageComposer

LibraryPage
  ResourceToolbar
  ResourceFilters
  ResourceGrid
    ResourceCard
```

## 10. Paylasilan UI Kit

```text
ui/
  Button
  Input
  Select
  Textarea
  Dialog
  Drawer
  Sheet
  Tabs
  Table
  Card
  Badge
  Avatar
  Progress
  Calendar
  ChartCard
  EmptyState
  StatCard
  FilterBar
```

## 11. Durum Yonetimi

- Server state: TanStack Query
- Session state: auth store
- Local UI state: drawer, filters, modal state
- Realtime state: socket event bridge

## 12. Tasarim token onerisi

```text
colors/
  primary: teal-600
  primary-dark: cyan-900
  accent: amber-500
  danger: rose-500
  surface: slate-50
  card: white

radius/
  sm: 10px
  md: 16px
  lg: 24px

shadow/
  card: soft medium blur
  floating: elevated large blur
```
