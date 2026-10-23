import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Program {
  id: number;
  name: string;
  description: string | null;
}

export interface ProgramCreate {
  name: string;
  description: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProgramApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly programsUrl = `${this.apiBaseUrl}/programs/`;

  list(): Observable<Program[]> {
    return this.http.get<Program[]>(this.programsUrl);
  }

  create(payload: ProgramCreate): Observable<Program> {
    return this.http.post<Program>(this.programsUrl, payload);
  }
}
