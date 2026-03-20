# REST API Sozlesmesi

Base path: `/api/v1`

## 1. Auth

### `POST /auth/login`
Request:
```json
{
  "email": "coach@example.com",
  "password": "secret"
}
```

Response:
```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt",
  "user": {
    "id": 1,
    "role": "coach",
    "fullName": "Ayse Yilmaz"
  }
}
```

### `POST /auth/refresh`
### `POST /auth/logout`
### `GET /auth/me`

## 2. Dashboard

### `GET /dashboard/summary`
Response:
```json
{
  "totalStudents": 48,
  "totalLessons": 8,
  "completedTasksToday": 26,
  "dailyStudyMinutes": 1130,
  "unreadMessages": 7,
  "overallCompletionPercent": 72,
  "upcomingMeetings": 3
}
```

### `GET /dashboard/charts`
- Haftalik calisma suresi
- Deneme trendi
- Ders bazli dagilim

## 3. Students

### `GET /students`
Query:
- `search`
- `gradeLevel`
- `status`
- `page`
- `limit`

### `POST /students`
Request:
```json
{
  "fullName": "Mehmet Demir",
  "gradeLevel": "8. sinif",
  "targetExam": "LGS",
  "parentName": "Fatma Demir",
  "parentPhone": "5551112233",
  "enrollmentDate": "2026-03-15"
}
```

### `GET /students/:id`
### `PUT /students/:id`
### `PATCH /students/:id/status`
### `DELETE /students/:id`

## 4. Lessons and Topics

### `GET /lessons`
### `POST /lessons`
### `PUT /lessons/:id`
### `GET /topics`
Query:
- `lessonId`
- `gradeLevel`

### `POST /topics`
### `PUT /topics/:id`

## 5. Study Plans

### `GET /study-plans`
Query:
- `studentId`
- `planType`
- `status`

### `POST /study-plans`
Request:
```json
{
  "studentId": 15,
  "title": "15-21 Mart Haftalik Program",
  "planType": "weekly",
  "startDate": "2026-03-15",
  "endDate": "2026-03-21",
  "totalTargetMinutes": 840
}
```

### `GET /study-plans/:id`
### `PUT /study-plans/:id`
### `PATCH /study-plans/:id/status`

## 6. Tasks

### `GET /tasks`
Query:
- `studentId`
- `status`
- `date`
- `studyPlanId`

### `POST /tasks`
Request:
```json
{
  "studentId": 15,
  "studyPlanId": 10,
  "lessonId": 2,
  "topicId": 9,
  "title": "Problemler 60 soru",
  "taskType": "question",
  "targetQuestionCount": 60,
  "targetMinutes": 90,
  "priority": "high",
  "dueAt": "2026-03-16T20:00:00Z"
}
```

### `GET /tasks/:id`
### `PUT /tasks/:id`
### `PATCH /tasks/:id/status`
### `PATCH /tasks/:id/complete`

## 7. Exam Results

### `GET /exam-results`
Query:
- `studentId`
- `examType`
- `dateFrom`
- `dateTo`

### `POST /exam-results`
Request:
```json
{
  "studentId": 15,
  "examName": "Turkiye Geneli Deneme 5",
  "examType": "LGS",
  "examDate": "2026-03-14",
  "correctCount": 62,
  "wrongCount": 18,
  "blankCount": 10,
  "totalNet": 56.0,
  "lessonBreakdown": {
    "turkce": { "correct": 18, "wrong": 2, "net": 17.5 },
    "matematik": { "correct": 12, "wrong": 8, "net": 10.0 }
  },
  "incorrectTopics": [
    "carpanlar ve katlar",
    "paragraf anlam"
  ]
}
```

### `GET /exam-results/:id`
### `PUT /exam-results/:id`
### `GET /exam-results/analytics/:studentId`

Analytics response:
```json
{
  "latestNet": 56.0,
  "bestNet": 61.5,
  "averageNet": 53.2,
  "trend": [
    { "date": "2026-02-10", "net": 49.5 },
    { "date": "2026-02-24", "net": 52.0 },
    { "date": "2026-03-14", "net": 56.0 }
  ],
  "weakLessons": ["matematik", "fen"]
}
```

## 8. Pomodoro

### `POST /pomodoro/start`
Request:
```json
{
  "studentId": 15,
  "taskId": 124
}
```

### `POST /pomodoro/stop`
Request:
```json
{
  "sessionId": 88,
  "durationMinutes": 25,
  "breakMinutes": 5
}
```

### `GET /pomodoro/summary/:studentId`
Response:
```json
{
  "todayFocusMinutes": 95,
  "weekFocusMinutes": 420,
  "sessionCountToday": 4,
  "productivityScore": 78
}
```

## 9. Messages

### `GET /messages/conversations`

### `GET /messages`
Query:
- `studentId`
- `receiverUserId`

### `POST /messages`
Request:
```json
{
  "receiverUserId": 41,
  "studentId": 15,
  "messageType": "text",
  "content": "Aksam 8'de deneme analizi yapalim."
}
```

### `PATCH /messages/:id/read`

## 10. Notes

### `GET /notes`
Query:
- `studentId`
- `noteType`

### `POST /notes`
Request:
```json
{
  "studentId": 15,
  "noteType": "weekly_report",
  "title": "Hafta 11 Degerlendirmesi",
  "content": "Matematikte artis var, paragraf disiplini korunmali.",
  "visibility": "student_visible",
  "rating": 4
}
```

### `PUT /notes/:id`
### `DELETE /notes/:id`

## 11. Resources

### `GET /resources`
Query:
- `lessonId`
- `topicId`
- `resourceType`
- `targetGradeLevel`

### `POST /resources`
Request:
```json
{
  "lessonId": 2,
  "topicId": 9,
  "resourceType": "video",
  "title": "Problemler hizli tekrar videosu",
  "url": "https://example.com/video/1",
  "targetGradeLevel": "8. sinif"
}
```

### `PUT /resources/:id`
### `DELETE /resources/:id`

## 12. Status Kodlari

- `200 OK`: basarili okuma/guncelleme
- `201 Created`: yeni kayit olustu
- `400 Bad Request`: dogrulama hatasi
- `401 Unauthorized`: giris gerekli
- `403 Forbidden`: yetki yetersiz
- `404 Not Found`: kayit bulunamadi
- `409 Conflict`: benzersiz alan cakismasi
- `422 Unprocessable Entity`: alan semantik hatasi

## 13. Validasyon Kurallari

- `email` benzersiz olmali
- `role` yalnizca tanimli enum degerleri olmali
- `progressPercent` 0-100 araliginda olmali
- `rating` 1-5 araliginda olmali
- `examDate <= today`
- `endDate >= startDate`
- `completedAt` yalnizca tamamlanan gorevlerde dolu olmali

## 14. Yetkilendirme Kurallari

- `admin`: tum endpoint'lere tam erisim
- `coach`: yalnizca kendi ogrencileri ve bagli kayitlari
- `student`: yalnizca kendi profili, gorevleri, oturumlari, mesajlari, kaynaklari

## 15. Realtime Olaylari

- `message:new`
- `message:read`
- `task:completed`
- `dashboard:refresh`
- `pomodoro:started`
- `pomodoro:stopped`
