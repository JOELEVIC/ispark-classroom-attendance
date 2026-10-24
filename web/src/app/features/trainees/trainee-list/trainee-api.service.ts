import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Trainee {
  id: number;
  name: string;
}

export interface TraineeSearchResult extends Trainee {
  cohorts: string[];
}

export interface TraineePage {
  items: TraineeSearchResult[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

@Injectable({ providedIn: 'root' })
export class TraineeApiService {
  private readonly http = inject(HttpClient);
  private readonly traineesUrl = `${environment.apiBaseUrl}/trainees/`;

  list(): Observable<Trainee[]> {
    return this.http.get<Trainee[]>(this.traineesUrl);
  }

  search(query: string, page: number, pageSize: number): Observable<TraineePage> {
    return this.http.get<TraineePage>(`${this.traineesUrl}search`, {
      params: { q: query, page, page_size: pageSize },
    });
  }

  create(name: string): Observable<Trainee> {
    return this.http.post<Trainee>(this.traineesUrl, { name });
  }
}
