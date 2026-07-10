import { Component, inject, OnInit } from '@angular/core';
import { LocalStorageService } from '../../../common/services/local-storage/local-storage';
import { TargetProcedure } from '../../model/target-procedure';
import { ProceduresTarget } from '../procedures-target/component/procedures-target';

@Component({
  selector: 'app-view-cards-procedure',
  imports: [ProceduresTarget],
  templateUrl: './view-cards-procedure.html',
  styleUrl: './view-cards-procedure.scss',
})
export class ViewCardsProcedure implements OnInit {
  private readonly storageService = inject(LocalStorageService);

  upcomingProcedures: TargetProcedure[] = [];
  previousProcedures: TargetProcedure[] = [];
  messageUpcomingProcedures = '';
  messagePreviousProcedures = '';

  ngOnInit(): void {
    this.upcomingProcedures = this.parseFromStorage(
      'upcomingProcedures',
      (msg) => (this.messageUpcomingProcedures = msg),
    );
    this.previousProcedures = this.parseFromStorage(
      'lastProcedures',
      (msg) => (this.messagePreviousProcedures = msg),
    );
  }

  private parseFromStorage(key: string, setMessage: (msg: string) => void): TargetProcedure[] {
    const raw = this.storageService.getItem<TargetProcedure[]>(key);

    if (!raw || !Array.isArray(raw) || raw.length === 0) {
      setMessage('No hay procedimientos disponibles');
      return [];
    }

    setMessage('');
    return raw;
  }
}
