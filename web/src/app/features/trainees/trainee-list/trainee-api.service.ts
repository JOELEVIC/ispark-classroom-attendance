import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Trainee {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class TraineeApiService {
  private readonly http = inject(HttpClient);
  private readonly traineesUrl = `${environment.apiBaseUrl}/trainees/`;

  list(): Observable<Trainee[]> {
    return this.http.get<Trainee[]>(this.traineesUrl);
  }

  create(name: string): Observable<Trainee> {
    return this.http.post<Trainee>(this.traineesUrl, { name });
  }
}
