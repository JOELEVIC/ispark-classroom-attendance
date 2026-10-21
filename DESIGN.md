Overview sumary 
Record attendance and cohort management for iSpark

Tech Stack
Frontend: Angularjs (for its Simplicity in structure compared to react, and component designing )
Backend: Fast Api (for it's large liabry stack, dependency injection leading to repid development )
Database: postgrl
Deployment: Docker


Core Definitions

Program { name, description }, Cohort { name, startDate, endDate, _Program_}, Trainer { name, [_Cohort_] }, Trainee { name, [_Enrollment_]}, Enrollment { _Trainee_, [_Cohort_]}, Class { _Cohort_, date, topic?}, Attendance { _Trainee_,_Class_,status,date}, AttendanceRate...


Features

- Program creation and fetching
- Cohort creation under a program,cohort listing of a program and single cohort preview
- Trainers creation and assigning to cohort
- Trainees creation, enrollment to cohort, re-enrollment of same to other cohort
- Shedule Class for a cohort, assign trainer to lead, list cohort calsses by date
- Take attendance for a class, list cohort's trainees and record attendance for each of them in a single submission
- Correcting of attendance record after initial record
- Report a cohort, list it's trainees, count of each trainee's status??? and their attendance rate, flag a trainee who's rate is bellow 75%
- For one trainee in one cohort, show their status for each class in date order
- For one class's summary, show howmany trianers had each status and those who havnt been marked yet
- Init Scripts for carefully constructing database schema and seeding

Main system rules
- Cohort isolation and uniqueness 
- Attendance can only be recorded for a trainee who is enrolled in that course
- A class can only be led, and have attendance recorded only by the trainner assigned to that cohort
- One attendance record per trainee per class per date, if you attempt to reupdate, only the unique record get's reupdated, no duplicate record
- Fixed attendance statuses, Present, absent, late and excused
- Dates should make sense, a cohort's end date should after it's start date, a class must fall within it's cohort's dates, attendance cannot be recorded for a class in the future (and limitation to past)
- A trainee enrolled in two cohorts has two independent attendance histories and two independence attendance rates
- History is protected, non-mutable, this avoid deleting or editing which could silently remove or corupt records that already exists
- Every attendance record shows who recorded it and when it was last changed by whom

Ui features
- Pages for every required features
- Plain styling, access clarity and usability
- Taking attendance for a full cohort should be quick on phone-sized screens
- Error messages must be clear and informative


Addons/Stretched goals
- A log of every correction to an attendance record, showing the old status, new status, who changed it and when
- csv export download a cohort report as csv file
- csv import to enroll list of trainees into a cohort from uploaded csv, reporting which rows failed and why
- shedule a repeating pattern of classes in one step, for example, every monday and wednesday for the lenght of the cohort
- mark a cohort as finished so it is read-only and hidden from the default lists without loosing any data
- Docker compose that starts the backend, front end with one comand (plus init database creds too )
- Search and pagination, find trainees by name accross cohorts, with page results