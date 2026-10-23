import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface ApiTrainer {
  id: number;
  name: string;
}

export interface TrainerRecord {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class TrainerApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  list(): Observable<TrainerRecord[]> {
    return this.http.get<ApiTrainer[]>(`${this.apiBaseUrl}/trainers/`);
  }

  create(name: string): Observable<TrainerRecord> {
    return this.http
      .post<ApiTrainer>(`${this.apiBaseUrl}/trainers/`, { name })
      .pipe(map((trainer) => ({ ...trainer })));
  }
}
