import { Component, OnInit } from '@angular/core';
import { StorageService } from '../../../commons/service/localStotarage/local-storage.service';
import { ProceduresTargetComponent } from '../procedures-target/component/procedures-target.component';
import { TargetProcedure } from '../../interface/target-procedure';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wiew-cards-procedure',
  standalone: true,
  imports: [ProceduresTargetComponent, CommonModule],
  templateUrl: './wiew-cards-procedure.component.html',
  styleUrls: ['./wiew-cards-procedure.component.css']
})
export class WiewCardsProcedureComponent implements OnInit {

  upcomingProcedures: TargetProcedure[] = [];
  previousProcedures: TargetProcedure[] = [];
  messageUpcomingProcedures: string = '';
  messagePreviousProcedures: string = '';

  constructor(private readonly storageService: StorageService) { }

  ngOnInit(): void {
    console.log('🎯 [VIEW-CARDS] Iniciando componente');
    this.loadProcedures();
  }

  loadProcedures(): void {
    console.log('📋 [VIEW-CARDS] Cargando procedimientos desde storage');

    // Cargar próximos procedimientos
    this.loadUpcomingProcedures();

    // Cargar procedimientos anteriores
    this.loadPreviousProcedures();

    console.log('✅ [VIEW-CARDS] Carga completada:', {
      upcoming: this.upcomingProcedures.length,
      previous: this.previousProcedures.length,
      upcomingMessage: this.messageUpcomingProcedures,
      previousMessage: this.messagePreviousProcedures
    });
  }

  private loadUpcomingProcedures(): void {
    const upcomingRegistry = this.storageService.getItem('upcomingProcedures');
    console.log('🔍 [VIEW-CARDS] upcomingProcedures raw:', upcomingRegistry);

    if (!upcomingRegistry) {
      console.warn('⚠️ [VIEW-CARDS] No hay datos de upcomingProcedures en storage');
      this.upcomingProcedures = [];
      this.messageUpcomingProcedures = 'No hay procedimientos programados';
      return;
    }

    try {
      const parsed = JSON.parse(upcomingRegistry);
      console.log('✅ [VIEW-CARDS] upcomingProcedures parseado:', parsed);

      // Verificar si es un array
      if (Array.isArray(parsed)) {
        this.upcomingProcedures = parsed as TargetProcedure[];
        this.messageUpcomingProcedures = '';
        console.log(`✅ [VIEW-CARDS] ${this.upcomingProcedures.length} próximos procedimientos cargados`);
      } else {
        console.warn('⚠️ [VIEW-CARDS] upcomingProcedures no es un array:', typeof parsed);
        this.upcomingProcedures = [];
        this.messageUpcomingProcedures = 'Formato de datos inválido';
      }
    } catch (error) {
      console.log('ℹ️ [VIEW-CARDS] upcomingProcedures es un mensaje de texto');
      // Es un mensaje de texto (error o sin datos)
      this.messageUpcomingProcedures = typeof upcomingRegistry === 'string'
        ? upcomingRegistry
        : 'Error al cargar procedimientos';
      this.upcomingProcedures = [];
    }
  }

  private loadPreviousProcedures(): void {
    const previousRegistry = this.storageService.getItem('lastProcedures');
    console.log('🔍 [VIEW-CARDS] lastProcedures raw:', previousRegistry);

    if (!previousRegistry) {
      console.warn('⚠️ [VIEW-CARDS] No hay datos de lastProcedures en storage');
      this.previousProcedures = [];
      this.messagePreviousProcedures = 'No hay procedimientos pasados';
      return;
    }

    try {
      const parsed = JSON.parse(previousRegistry);
      console.log('✅ [VIEW-CARDS] lastProcedures parseado:', parsed);

      // Verificar si es un array
      if (Array.isArray(parsed)) {
        this.previousProcedures = parsed as TargetProcedure[];
        this.messagePreviousProcedures = '';
        console.log(`✅ [VIEW-CARDS] ${this.previousProcedures.length} procedimientos anteriores cargados`);
      } else {
        console.warn('⚠️ [VIEW-CARDS] lastProcedures no es un array:', typeof parsed);
        this.previousProcedures = [];
        this.messagePreviousProcedures = 'Formato de datos inválido';
      }
    } catch (error) {
      console.log('ℹ️ [VIEW-CARDS] lastProcedures es un mensaje de texto');
      // Es un mensaje de texto (error o sin datos)
      this.messagePreviousProcedures = typeof previousRegistry === 'string'
        ? previousRegistry
        : 'Error al cargar procedimientos';
      this.previousProcedures = [];
    }
  }
}