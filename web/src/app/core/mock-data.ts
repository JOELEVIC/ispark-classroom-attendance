import { Injectable } from '@angular/core';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface MockProgram {
  id: number;
  name: string;
  description: string | null;
}

export interface MockCohort {
  id: number;
  programId: number;
  name: string;
  startDate: string;
  endDate: string;
}

export interface MockTrainer {
  id: number;
  name: string;
  cohortIds: number[];
}

export interface MockTrainee {
  id: number;
  name: string;
  cohortIds: number[];
}

export interface MockClass {
  id: number;
  cohortId: number;
  trainerId: number;
  date: string;
  topic: string;
  attendance: Record<number, AttendanceStatus>;
}

@Injectable({ providedIn: 'root' })
export class MockData {
  readonly programs: MockProgram[] = [
    { id: 1, name: 'Web Development', description: 'Build modern web applications.' },
    { id: 2, name: 'Data Analytics', description: 'Turn data into useful insights.' },
  ];

  readonly cohorts: MockCohort[] = [
    { id: 101, programId: 1, name: 'Cohort A', startDate: '2025-01-06', endDate: '2025-06-30' },
    { id: 102, programId: 1, name: 'Cohort B', startDate: '2025-02-03', endDate: '2025-07-25' },
    { id: 201, programId: 2, name: 'Cohort A', startDate: '2025-01-13', endDate: '2025-06-20' },
  ];

  readonly trainers: MockTrainer[] = [
    { id: 1, name: 'Amina Yusuf', cohortIds: [101, 201] },
    { id: 2, name: 'Daniel Okafor', cohortIds: [101, 102] },
    { id: 3, name: 'Joel David', cohortIds: [102, 201] },
  ];

  readonly trainees: MockTrainee[] = [
    { id: 1, name: 'Paul Mensah', cohortIds: [101, 201] },
    { id: 2, name: 'Grace Nwosu', cohortIds: [101] },
    { id: 3, name: 'Samuel Adeyemi', cohortIds: [101] },
    { id: 4, name: 'Maya Okoro', cohortIds: [101] },
    { id: 5, name: 'David Boateng', cohortIds: [101] },
    { id: 6, name: 'Lydia James', cohortIds: [102] },
    { id: 7, name: 'Emmanuel Eze', cohortIds: [102] },
    { id: 8, name: 'Chika Obi', cohortIds: [102] },
    { id: 9, name: 'Tobi Akin', cohortIds: [102] },
    { id: 10, name: 'Sarah Bello', cohortIds: [102] },
    { id: 11, name: 'Ibrahim Musa', cohortIds: [201] },
    { id: 12, name: 'Adaeze Obi', cohortIds: [201] },
    { id: 13, name: 'Kofi Asante', cohortIds: [201] },
    { id: 14, name: 'Nneka Eze', cohortIds: [201] },
    { id: 15, name: 'Michael Osei', cohortIds: [201] },
  ];

  readonly classes: MockClass[] = [
    ...this.makeClasses(101, [1, 2, 3, 4], ['HTML & CSS', 'JavaScript Basics', 'Responsive Design', 'Git Essentials']),
    ...this.makeClasses(102, [1, 2, 3, 4], ['Data Fundamentals', 'Working with APIs', 'Angular Basics', 'Project Workshop']),
    ...this.makeClasses(201, [1, 2, 3, 4], ['Data Literacy', 'Spreadsheets', 'SQL Foundations', 'Visualising Data']),
  ];

  private nextCohortId = 202;
  private nextProgramId = 3;
  private nextTrainerId = 4;
  private nextTraineeId = 16;
  private nextClassId = 13;

  constructor() {
    this.classes.forEach((classItem) => {
      const enrolled = this.trainees.filter((trainee) =>
        trainee.cohortIds.includes(classItem.cohortId),
      );
      enrolled.forEach((trainee, index) => {
        classItem.attendance[trainee.id] =
          index === 0 && classItem.id % 4 === 0
            ? 'late'
            : index === 1 && classItem.id % 3 === 0
              ? 'absent'
              : 'present';
      });
    });
  }

  createProgram(name: string, description: string | null): MockProgram {
    const program = {
      id: this.nextProgramId++,
      name: name.trim(),
      description: description?.trim() || null,
    };
    this.programs.push(program);
    return program;
  }

  createCohort(
    programId: number,
    name: string,
    startDate: string,
    endDate: string,
  ): MockCohort {
    const cohort = {
      id: this.nextCohortId++,
      programId,
      name: name.trim(),
      startDate,
      endDate,
    };
    this.cohorts.push(cohort);
    return cohort;
  }

  createTrainer(name: string): MockTrainer {
    const trainer = { id: this.nextTrainerId++, name: name.trim(), cohortIds: [] };
    this.trainers.push(trainer);
    return trainer;
  }

  assignTrainer(trainerId: number, cohortId: number): void {
    const trainer = this.trainers.find((item) => item.id === trainerId);
    if (trainer && !trainer.cohortIds.includes(cohortId)) {
      trainer.cohortIds.push(cohortId);
    }
  }

  createTrainee(name: string): MockTrainee {
    const trainee = { id: this.nextTraineeId++, name: name.trim(), cohortIds: [] };
    this.trainees.push(trainee);
    return trainee;
  }

  enrollTrainee(traineeId: number, cohortId: number): void {
    const trainee = this.trainees.find((item) => item.id === traineeId);
    if (trainee && !trainee.cohortIds.includes(cohortId)) {
      trainee.cohortIds.push(cohortId);
    }
  }

  createClass(
    cohortId: number,
    trainerId: number,
    date: string,
    topic: string,
  ): MockClass {
    const classItem = {
      id: this.nextClassId++,
      cohortId,
      trainerId,
      date,
      topic: topic.trim(),
      attendance: {},
    };
    this.classes.push(classItem);
    return classItem;
  }

  recordAttendance(
    classId: number,
    attendance: Record<number, AttendanceStatus>,
  ): void {
    const classItem = this.classes.find((item) => item.id === classId);
    if (classItem) {
      Object.assign(classItem.attendance, attendance);
    }
  }

  classesFor(cohortId: number): MockClass[] {
    return this.classes
      .filter((classItem) => classItem.cohortId === cohortId)
      .sort((left, right) => left.date.localeCompare(right.date));
  }

  traineesFor(cohortId: number): MockTrainee[] {
    return this.trainees.filter((trainee) => trainee.cohortIds.includes(cohortId));
  }

  trainersFor(cohortId: number): MockTrainer[] {
    return this.trainers.filter((trainer) => trainer.cohortIds.includes(cohortId));
  }

  private makeClasses(
    cohortId: number,
    trainers: number[],
    topics: string[],
  ): MockClass[] {
    const cohort = this.cohorts.find((item) => item.id === cohortId);
    return topics.map((topic, index) => ({
      id: (cohortId === 101 ? 0 : cohortId === 102 ? 4 : 8) + index + 1,
      cohortId,
      trainerId: trainers[index % trainers.length],
      date: `2025-04-${String(index * 7 + (cohortId === 102 ? 2 : 1)).padStart(2, '0')}`,
      topic,
      attendance: {},
    })).filter((classItem) => !!cohort);
  }
}
