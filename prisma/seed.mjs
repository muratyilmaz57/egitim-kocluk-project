import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { readFileSync } from "node:fs";

loadEnvFile();
const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo1234!";
const PASSWORD_HASH = hashSync(DEMO_PASSWORD, 10);

const now = new Date();
const todayAt = (hour, minute = 0) => {
  const date = new Date(now);
  date.setHours(hour, minute, 0, 0);
  return date;
};

function loadEnvFile() {
  if (process.env.DATABASE_URL) {
    return;
  }

  try {
    const content = readFileSync(".env", "utf8");
    for (const rawLine of content.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    console.warn("Could not load .env file for seed script.", error);
  }
}

async function upsertUser(data) {
  return prisma.user.upsert({
    where: { email: data.email },
    update: {
      role: data.role,
      fullName: data.fullName,
      phone: data.phone,
      passwordHash: PASSWORD_HASH,
      passwordChangedAt: now,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      mfaEnabled: false,
      mfaSecret: null,
      mfaTempSecret: null,
      status: "active",
    },
    create: {
      ...data,
      passwordHash: PASSWORD_HASH,
      passwordChangedAt: now,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      mfaEnabled: false,
      mfaSecret: null,
      mfaTempSecret: null,
      status: "active",
    },
  });
}

async function ensureLesson(data) {
  return prisma.lesson.upsert({
    where: { code: data.code },
    update: {
      name: data.name,
      color: data.color,
      icon: data.icon,
      sortOrder: data.sortOrder,
      isActive: true,
      coachId: data.coachId,
    },
    create: data,
  });
}

async function ensureTopic(data) {
  const existing = await prisma.topic.findFirst({
    where: {
      lessonId: data.lessonId,
      name: data.name,
    },
  });

  if (existing) {
    return prisma.topic.update({
      where: { id: existing.id },
      data: {
        description: data.description,
        gradeLevel: data.gradeLevel,
        difficultyLevel: data.difficultyLevel,
        estimatedMinutes: data.estimatedMinutes,
        isActive: true,
      },
    });
  }

  return prisma.topic.create({ data });
}

async function cleanupSeedData(studentIds) {
  await prisma.auditLog.deleteMany({});
  await prisma.notificationPreference.deleteMany({});

  await prisma.message.deleteMany({
    where: {
      content: {
        startsWith: "Seed |",
      },
    },
  });

  await prisma.pomodoroSession.deleteMany({
    where: {
      notes: {
        startsWith: "Seed |",
      },
    },
  });

  await prisma.note.deleteMany({
    where: {
      title: {
        startsWith: "Seed |",
      },
    },
  });

  await prisma.examResult.deleteMany({
    where: {
      examName: {
        startsWith: "Seed |",
      },
    },
  });

  await prisma.resource.deleteMany({
    where: {
      title: {
        startsWith: "Seed |",
      },
    },
  });

  await prisma.notification.deleteMany({
    where: {
      title: {
        startsWith: "Seed |",
      },
    },
  });

  await prisma.task.deleteMany({
    where: {
      title: {
        startsWith: "Seed |",
      },
    },
  });

  await prisma.studyPlan.deleteMany({
    where: {
      title: {
        startsWith: "Seed |",
      },
    },
  });

  await prisma.student.updateMany({
    where: {
      id: {
        in: studentIds,
      },
    },
    data: {
      status: "active",
    },
  });
}

async function main() {
  const admin = await upsertUser({
    role: "admin",
    fullName: "Seed Admin",
    email: "admin@kocluk.local",
    phone: "5550000000",
  });

  const coach = await upsertUser({
    role: "coach",
    fullName: "Pelin Arslan",
    email: "coach@kocluk.local",
    phone: "5551112233",
  });

  const studentUser1 = await upsertUser({
    role: "student",
    fullName: "Mehmet Demir",
    email: "mehmet@kocluk.local",
    phone: "5552000001",
  });

  const studentUser2 = await upsertUser({
    role: "student",
    fullName: "Ece Kaya",
    email: "ece@kocluk.local",
    phone: "5552000002",
  });

  const studentUser3 = await upsertUser({
    role: "student",
    fullName: "Arda Can",
    email: "arda@kocluk.local",
    phone: "5552000003",
  });

  const students = await Promise.all([
    prisma.student.upsert({
      where: { studentCode: "STD-MEHMET" },
      update: {
        userId: studentUser1.id,
        coachId: coach.id,
        fullName: "Mehmet Demir",
        gradeLevel: "8. sinif",
        schoolName: "Ataturk Ortaokulu",
        targetExam: "LGS",
        parentName: "Fatma Demir",
        parentPhone: "5551112233",
        parentEmail: "veli.mehmet@kocluk.local",
        enrollmentDate: new Date("2025-09-02"),
        status: "active",
      },
      create: {
        userId: studentUser1.id,
        coachId: coach.id,
        studentCode: "STD-MEHMET",
        fullName: "Mehmet Demir",
        gradeLevel: "8. sinif",
        schoolName: "Ataturk Ortaokulu",
        targetExam: "LGS",
        parentName: "Fatma Demir",
        parentPhone: "5551112233",
        parentEmail: "veli.mehmet@kocluk.local",
        enrollmentDate: new Date("2025-09-02"),
      },
    }),
    prisma.student.upsert({
      where: { studentCode: "STD-ECE" },
      update: {
        userId: studentUser2.id,
        coachId: coach.id,
        fullName: "Ece Kaya",
        gradeLevel: "11. sinif",
        schoolName: "Cumhuriyet Anadolu Lisesi",
        targetExam: "TYT",
        parentName: "Sibel Kaya",
        parentPhone: "5551112244",
        parentEmail: "veli.ece@kocluk.local",
        enrollmentDate: new Date("2025-09-10"),
        status: "active",
      },
      create: {
        userId: studentUser2.id,
        coachId: coach.id,
        studentCode: "STD-ECE",
        fullName: "Ece Kaya",
        gradeLevel: "11. sinif",
        schoolName: "Cumhuriyet Anadolu Lisesi",
        targetExam: "TYT",
        parentName: "Sibel Kaya",
        parentPhone: "5551112244",
        parentEmail: "veli.ece@kocluk.local",
        enrollmentDate: new Date("2025-09-10"),
      },
    }),
    prisma.student.upsert({
      where: { studentCode: "STD-ARDA" },
      update: {
        userId: studentUser3.id,
        coachId: coach.id,
        fullName: "Arda Can",
        gradeLevel: "12. sinif",
        schoolName: "Namik Kemal Anadolu Lisesi",
        targetExam: "AYT",
        parentName: "Aylin Can",
        parentPhone: "5551112255",
        parentEmail: "veli.arda@kocluk.local",
        enrollmentDate: new Date("2025-10-01"),
        status: "active",
      },
      create: {
        userId: studentUser3.id,
        coachId: coach.id,
        studentCode: "STD-ARDA",
        fullName: "Arda Can",
        gradeLevel: "12. sinif",
        schoolName: "Namik Kemal Anadolu Lisesi",
        targetExam: "AYT",
        parentName: "Aylin Can",
        parentPhone: "5551112255",
        parentEmail: "veli.arda@kocluk.local",
        enrollmentDate: new Date("2025-10-01"),
      },
    }),
  ]);

  await cleanupSeedData(students.map((student) => student.id));

  await prisma.notificationPreference.createMany({
    data: [
      {
        userId: coach.id,
        type: "message",
        inAppEnabled: true,
        emailEnabled: true,
      },
      {
        userId: studentUser1.id,
        type: "message",
        inAppEnabled: true,
        emailEnabled: false,
      },
      {
        userId: studentUser1.id,
        type: "resource",
        inAppEnabled: true,
        emailEnabled: true,
      },
    ],
  });

  const lessons = await Promise.all([
    ensureLesson({
      coachId: coach.id,
      name: "Matematik",
      code: "MAT",
      color: "#0f766e",
      icon: "calculator",
      sortOrder: 1,
      isActive: true,
    }),
    ensureLesson({
      coachId: coach.id,
      name: "Turkce",
      code: "TRK",
      color: "#0c4a6e",
      icon: "book-open",
      sortOrder: 2,
      isActive: true,
    }),
    ensureLesson({
      coachId: coach.id,
      name: "Fen Bilimleri",
      code: "FEN",
      color: "#15803d",
      icon: "flask-conical",
      sortOrder: 3,
      isActive: true,
    }),
  ]);

  const [mathLesson, turkishLesson, scienceLesson] = lessons;

  const [
    problemsTopic,
    divisorsTopic,
    paragraphTopic,
    pressureTopic,
  ] = await Promise.all([
    ensureTopic({
      lessonId: mathLesson.id,
      name: "Problemler",
      description: "Temel problem tipleri ve hiz calismasi",
      gradeLevel: "8. sinif",
      difficultyLevel: 3,
      estimatedMinutes: 90,
      isActive: true,
    }),
    ensureTopic({
      lessonId: mathLesson.id,
      name: "Carpanlar ve Katlar",
      description: "Eksik konu ve tekrar odagi",
      gradeLevel: "8. sinif",
      difficultyLevel: 4,
      estimatedMinutes: 75,
      isActive: true,
    }),
    ensureTopic({
      lessonId: turkishLesson.id,
      name: "Paragraf Hiz",
      description: "Sureli paragraf sorulari",
      gradeLevel: "8. sinif",
      difficultyLevel: 3,
      estimatedMinutes: 60,
      isActive: true,
    }),
    ensureTopic({
      lessonId: scienceLesson.id,
      name: "Basinc",
      description: "Video tekrar ve mini test",
      gradeLevel: "8. sinif",
      difficultyLevel: 2,
      estimatedMinutes: 45,
      isActive: true,
    }),
  ]);

  const mainStudent = students[0];

  const weeklyPlan = await prisma.studyPlan.create({
    data: {
      studentId: mainStudent.id,
      coachId: coach.id,
      title: "Seed | 17-23 Mart Haftalik Plan",
      planType: "weekly",
      startDate: new Date("2026-03-17"),
      endDate: new Date("2026-03-23"),
      status: "active",
      totalTargetMinutes: 840,
      notes: "Seed | Demo haftalik plan",
    },
  });

  const [completedTask1, completedTask2, activeTask, pendingTask] =
    await Promise.all([
      prisma.task.create({
        data: {
          studyPlanId: weeklyPlan.id,
          studentId: mainStudent.id,
          coachId: coach.id,
          lessonId: mathLesson.id,
          topicId: problemsTopic.id,
          title: "Seed | Problemler 60 soru",
          taskType: "question",
          description: "Seed | LGS odakli hiz calismasi",
          targetQuestionCount: 60,
          targetMinutes: 90,
          priority: "high",
          status: "completed",
          progressPercent: 100,
          dueAt: todayAt(20, 0),
          completedAt: todayAt(18, 10),
        },
      }),
      prisma.task.create({
        data: {
          studyPlanId: weeklyPlan.id,
          studentId: mainStudent.id,
          coachId: coach.id,
          lessonId: turkishLesson.id,
          topicId: paragraphTopic.id,
          title: "Seed | Paragraf sureli paket",
          taskType: "question",
          description: "Seed | 40 soruluk zaman kontrollu set",
          targetQuestionCount: 40,
          targetMinutes: 55,
          priority: "medium",
          status: "completed",
          progressPercent: 100,
          dueAt: todayAt(17, 0),
          completedAt: todayAt(15, 45),
        },
      }),
      prisma.task.create({
        data: {
          studyPlanId: weeklyPlan.id,
          studentId: mainStudent.id,
          coachId: coach.id,
          lessonId: scienceLesson.id,
          topicId: pressureTopic.id,
          title: "Seed | Basinc video + mini test",
          taskType: "video",
          description: "Seed | 35 dakikalik video ve 12 soruluk test",
          targetMinutes: 45,
          priority: "medium",
          status: "in_progress",
          progressPercent: 45,
          dueAt: todayAt(21, 30),
        },
      }),
      prisma.task.create({
        data: {
          studyPlanId: weeklyPlan.id,
          studentId: students[1].id,
          coachId: coach.id,
          lessonId: mathLesson.id,
          topicId: divisorsTopic.id,
          title: "Seed | Carpanlar tekrar seti",
          taskType: "study",
          description: "Seed | Zayif konular tekrar blogu",
          targetMinutes: 70,
          priority: "high",
          status: "pending",
          progressPercent: 15,
          dueAt: todayAt(19, 30),
        },
      }),
    ]);

  await Promise.all([
    prisma.pomodoroSession.create({
      data: {
        studentId: mainStudent.id,
        taskId: completedTask1.id,
        startedAt: todayAt(10, 0),
        endedAt: todayAt(10, 25),
        durationMinutes: 25,
        breakMinutes: 5,
        sessionType: "focus",
        deviceType: "web",
        notes: "Seed | Sabah odak oturumu",
      },
    }),
    prisma.pomodoroSession.create({
      data: {
        studentId: mainStudent.id,
        taskId: completedTask1.id,
        startedAt: todayAt(10, 35),
        endedAt: todayAt(11, 0),
        durationMinutes: 25,
        breakMinutes: 5,
        sessionType: "focus",
        deviceType: "web",
        notes: "Seed | Ikinci odak oturumu",
      },
    }),
    prisma.pomodoroSession.create({
      data: {
        studentId: mainStudent.id,
        taskId: activeTask.id,
        startedAt: todayAt(16, 0),
        endedAt: todayAt(16, 20),
        durationMinutes: 20,
        breakMinutes: 5,
        sessionType: "focus",
        deviceType: "mobile",
        notes: "Seed | Aksam tekrar oturumu",
      },
    }),
  ]);

  await Promise.all([
    prisma.message.create({
      data: {
        senderUserId: coach.id,
        receiverUserId: studentUser1.id,
        studentId: mainStudent.id,
        messageType: "text",
        content: "Seed | Aksam 20:30'da deneme analizi yapalim.",
        isRead: false,
      },
    }),
    prisma.message.create({
      data: {
        senderUserId: studentUser1.id,
        receiverUserId: coach.id,
        studentId: mainStudent.id,
        messageType: "text",
        content: "Seed | Fen videosunu bitirince kisa not atacagim.",
        isRead: false,
      },
    }),
  ]);

  await Promise.all([
    prisma.note.create({
      data: {
        studentId: mainStudent.id,
        coachId: coach.id,
        noteType: "weekly_report",
        title: "Seed | Hafta 11 degerlendirmesi",
        content: "Matematikte artis var, paragraf tarafinda ritim korunuyor.",
        visibility: "student_visible",
        rating: 4,
      },
    }),
    prisma.note.create({
      data: {
        studentId: mainStudent.id,
        coachId: coach.id,
        noteType: "motivation",
        title: "Seed | Motivasyon notu",
        content: "Aksam blogundaki istikrar korunursa net artis devam eder.",
        visibility: "student_visible",
        rating: 5,
      },
    }),
  ]);

  await prisma.examResult.create({
    data: {
      studentId: mainStudent.id,
      coachId: coach.id,
      examName: "Seed | Turkiye Geneli Deneme 5",
      examType: "LGS",
      examDate: new Date("2026-03-14"),
      durationMinutes: 90,
      correctCount: 62,
      wrongCount: 18,
      blankCount: 10,
      totalNet: 56.0,
      score: 382.5,
      rankInGroup: 4,
      lessonBreakdown: {
        turkce: { correct: 18, wrong: 2, net: 17.5 },
        matematik: { correct: 12, wrong: 8, net: 10.0 },
        fen: { correct: 16, wrong: 4, net: 15.0 },
      },
      incorrectTopics: ["Carpanlar ve Katlar", "Paragraf Hiz"],
      notes: "Seed | Matematikte eksik konu tekrar gerektiriyor.",
    },
  });

  await Promise.all([
    prisma.resource.create({
      data: {
        coachId: coach.id,
        lessonId: mathLesson.id,
        topicId: problemsTopic.id,
        resourceType: "video",
        title: "Seed | Problemler hizli tekrar videosu",
        description: "Seed | 18 dakikalik konu ozeti",
        url: "https://example.com/seed-problemler-video",
        targetGradeLevel: "8. sinif",
        isFeatured: true,
      },
    }),
    prisma.resource.create({
      data: {
        coachId: coach.id,
        lessonId: scienceLesson.id,
        topicId: pressureTopic.id,
        resourceType: "pdf",
        title: "Seed | Basinc mini not",
        description: "Seed | 2 sayfalik tekrar ozeti",
        filePath: "/resources/seed/basinc-mini-not.pdf",
        targetGradeLevel: "8. sinif",
      },
    }),
  ]);

  await prisma.notification.createMany({
    data: [
      {
        recipientUserId: studentUser1.id,
        actorUserId: coach.id,
        studentId: mainStudent.id,
        type: "task",
        title: "Seed | Yeni gorev atandi",
        body: "Seed | Problemler 60 soru gorevi eklendi.",
        href: "/tasks",
        isRead: false,
      },
      {
        recipientUserId: studentUser1.id,
        actorUserId: coach.id,
        studentId: mainStudent.id,
        type: "note",
        title: "Seed | Yeni koç notu",
        body: "Seed | Haftalik rapor paylasildi.",
        href: "/agenda",
        isRead: false,
      },
      {
        recipientUserId: coach.id,
        actorUserId: studentUser1.id,
        studentId: mainStudent.id,
        type: "message",
        title: "Seed | Yeni ogrenci mesaji",
        body: "Seed | Fen videosunu bitirince kisa not atacagim.",
        href: "/messages",
        isRead: false,
      },
    ],
  });

  const summary = {
    users: await prisma.user.count(),
    students: await prisma.student.count(),
    lessons: await prisma.lesson.count(),
    topics: await prisma.topic.count(),
    studyPlans: await prisma.studyPlan.count(),
    tasks: await prisma.task.count(),
    examResults: await prisma.examResult.count(),
    pomodoroSessions: await prisma.pomodoroSession.count(),
    messages: await prisma.message.count(),
    notes: await prisma.note.count(),
    resources: await prisma.resource.count(),
    notifications: await prisma.notification.count(),
    notificationPreferences: await prisma.notificationPreference.count(),
  };

  console.log("Seed completed");
  console.log(JSON.stringify(summary, null, 2));
  console.log(
    JSON.stringify(
      {
        adminEmail: admin.email,
        coachEmail: coach.email,
        demoStudentEmail: studentUser1.email,
        demoPassword: DEMO_PASSWORD,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
