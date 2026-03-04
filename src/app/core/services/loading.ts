import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly _counter$ = new BehaviorSubject<number>(0);

  /** true cuando hay 1+ requests activas */
  readonly isLoading$: Observable<boolean> = this._counter$.pipe(
    map((n) => n > 0),
    distinctUntilChanged()
  );

  show(): void {
    this._counter$.next(this._counter$.value + 1);
  }

  hide(): void {
    const next = Math.max(0, this._counter$.value - 1);
    this._counter$.next(next);
  }

  /** Por si alguna vez necesitas resetear en errores globales */
  reset(): void {
    this._counter$.next(0);
  }
}
