import { MockData } from './mock-data';

describe('MockData', () => {
  it('provides connected sample records for the required screens', () => {
    const data = new MockData();

    expect(data.programs).toHaveLength(2);
    expect(data.cohorts).toHaveLength(3);
    expect(data.trainers).toHaveLength(3);
    expect(data.trainees).toHaveLength(15);
    expect(data.classes).toHaveLength(12);
    expect(data.trainersFor(101).map((trainer) => trainer.id)).toContain(1);
    expect(data.trainersFor(201).map((trainer) => trainer.id)).toContain(1);
    expect(data.traineesFor(101).map((trainee) => trainee.id)).toContain(1);
    expect(data.traineesFor(201).map((trainee) => trainee.id)).toContain(1);
  });

  it('updates mock enrollments, classes, and attendance', () => {
    const data = new MockData();
    const trainee = data.createTrainee('New Learner');
    data.enrollTrainee(trainee.id, 102);
    const classItem = data.createClass(102, 2, '2025-05-01', 'Mock topic');
    data.recordAttendance(classItem.id, { [trainee.id]: 'late' });

    expect(data.traineesFor(102)).toContain(trainee);
    expect(classItem.attendance[trainee.id]).toBe('late');
  });
});
